// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content }        from '@google/generative-ai';
import { PSI_SYSTEM_PROMPT }   from './psi';
import type { GeminiChatRequest, GeminiResult } from './types';
import { ZPD_THRESHOLDS }      from './constants';

const API_KEYS: string[] = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_KEY_6,
  process.env.GEMINI_KEY_7,
  process.env.GEMINI_KEY_8,
].filter((key): key is string => Boolean(key));

if (API_KEYS.length === 0) {
  throw new Error(
    'No Gemini API keys configured. Set GEMINI_KEY_1 through GEMINI_KEY_8 in .env.local'
  );
}

function selectStartIndex(requestId: string): number {
  const hash = requestId
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) & 0xffffffff, 0);
  return Math.abs(hash) % API_KEYS.length;
}

export function buildContents(req: GeminiChatRequest): Content[] {
  const contents: Content[] = [];

  if (req.mode === 'onboarding') {
    for (const msg of req.messages) {
      contents.push({
        role:  msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
    return contents;
  }

  if (req.mode === 'generate' && req.params) {
    const p = req.params;
    const langLabels: Record<string, string> = {
      bosnian: 'Bosnian — output language: bosanski',
      german:  'German — Ausgabesprache: Deutsch',
      english: 'English — output language: English',
    };
    const lines: string[] = [
      'MODE: generate',
      'Generate a complete IBL lesson plan for:',
      '',
      `SUBJECT:           ${p.subject}`,
      `GRADE:             ${p.grade}`,
      `TOPIC:             ${p.topic}`,
      `DURATION:          ${p.duration_min} minutes`,
      `TIER:              ${p.tier}`,
      `OUTPUT LANGUAGE:   ${langLabels[p.language] ?? p.language}`,
    ];
    if (p.prior_knowledge) lines.push(`PRIOR KNOWLEDGE:   ${p.prior_knowledge}`);
    if ('zpd_calibration' in p && p.zpd_calibration) {
      lines.push(`ZPD CALIBRATION:   ${String(p.zpd_calibration)}`);
    }
    if (p.notes) lines.push(`TEACHER NOTES:     ${p.notes}`);
    lines.push(
      '',
      'Execute Protocol 1 → Protocol 2 → Protocol 3 in strict sequence.',
      'Run ZPD test first, then all 7 Wiggins-McTighe criteria.',
      'Run Coherence Integrity Check (Module 2.11) before writing.',
      'Include Synthesis & Return to IQ as the final Socratic question.',
      'Output: plain text with = - | table structure. No HTML. No Markdown.',
      'Complete all 10 sections including Post-Generation Prompt (Module 3.13).',
    );
    contents.push({ role: 'user', parts: [{ text: lines.join('\n') }] });
    return contents;
  }

  if (req.mode === 'chat') {
    const contextText = req.plan_context
      ? [
          'MODE: chat',
          '',
          'FULL PLAN CONTEXT (this is the plan the teacher is asking about):',
          '',
          req.plan_context,
          '',
          '---',
          "The teacher now has a follow-up question. Apply Protocol 4.",
        ].join('\n')
      : 'MODE: chat\nThe teacher has a follow-up question. Apply Protocol 4.';

    contents.push({ role: 'user',  parts: [{ text: contextText }] });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I have the full plan context and am ready for the teacher\'s question.' }],
    });
    for (const msg of req.messages) {
      contents.push({
        role:  msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
    return contents;
  }

  return contents;
}

export async function geminiChat(
  req:       GeminiChatRequest,
  requestId: string,
): Promise<GeminiResult> {
  const startIndex = selectStartIndex(requestId);
  const startTime  = Date.now();
  const contents   = buildContents(req);
  const temperature = req.mode === 'chat' ? 0.6 : 0.7;
  const maxTokens   = req.mode === 'chat' ? 4096 : 8192;

  for (let i = 0; i < API_KEYS.length; i++) {
    const keyIndex = (startIndex + i) % API_KEYS.length;
    const apiKey   = API_KEYS[keyIndex];

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model:             'gemini-1.5-pro',
        systemInstruction: PSI_SYSTEM_PROMPT,
        generationConfig: {
          temperature,
          topK:            40,
          topP:            0.95,
          maxOutputTokens: maxTokens,
        },
      });

      const result = await model.generateContent({ contents });
      const text   = result.response.text();

      if (!text || text.trim().length < 50) {
        throw new Error('EMPTY_RESPONSE');
      }

      return { text, keyIndex, durationMs: Date.now() - startTime };

    } catch (err: unknown) {
      const status  = (err as unknown as { status?: number })?.status;
      const message = (err as Error)?.message;
      if (status === 429 || status === 503 || message === 'EMPTY_RESPONSE') {
        continue;
      }
      throw err;
    }
  }

  throw new Error('ALL_KEYS_EXHAUSTED');
}

export function deriveZpdCalibration(
  grade:          number,
  priorKnowledge: string,
): string {
  const len = priorKnowledge.trim().length;
  if (len === 0) {
    return `No prior knowledge specified. Calibrate from grade ${grade} developmental norms.`;
  }
  if (len < ZPD_THRESHOLDS.SHORT_INPUT) {
    return 'Basic prior knowledge noted. Place IQ at lower ZPD boundary.';
  }
  if (len < ZPD_THRESHOLDS.MEDIUM_INPUT) {
    return 'Intermediate prior knowledge noted. Place IQ at middle ZPD.';
  }
  return 'Detailed prior knowledge noted. Place IQ at upper ZPD boundary.';
}

export function extractInquiryQuestion(planText: string): string | null {
  const patterns: RegExp[] = [
    /ISTRAZIVACKO PITANJE[^\n]*\n={3,}\n\s*\|\s+(.+?)\s+\|/s,
    /FORSCHUNGSFRAGE[^\n]*\n={3,}\n\s*\|\s+(.+?)\s+\|/s,
    /INQUIRY QUESTION[^\n]*\n={3,}\n\s*\|\s+(.+?)\s+\|/s,
  ];
  for (const pattern of patterns) {
    const match = planText.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}
