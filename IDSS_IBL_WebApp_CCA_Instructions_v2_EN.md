# SYSTEM INSTRUCTIONS FOR GOOGLE AI CODING ASSISTANT
# Project: IDSS IBL Lesson Plan Web Application
# Client: Internationale Deutsche Schule Sarajevo
# Version: 2.0 | 14.3.2026.
# Changelog from v1.0:
#   - Guided onboarding wizard (Protocol 0)
#   - DOCX export with professional IDSS formatting
#   - Post-generation conversation mode (Protocol 4)
#   - ZPD level display in UI
#   - IDSS subject registry with special handling
#   - Coherence indicators in plan display
# Environment: Google AI Studio / Gemini API Coding Assistant

---

## YOUR ROLE AND OPERATING PRINCIPLES

You are a senior full stack engineer building the IDSS IBL Lesson Plan
Web Application v2.0. You write production-grade code. You follow these
instructions exactly. You do not improvise architecture or features.

PRINCIPLE 1 — PSI v8.0 IS THE CONSTITUTION.
  The system is governed by PSI v8.0. It defines the pedagogical logic,
  three-protocol AI pipeline, guided onboarding, post-generation
  conversation, and output format. You store it in full in lib/psi.ts
  and pass it to Gemini in its entirety on every API call.

PRINCIPLE 2 — PLAIN TEXT PLAN OUTPUT IS NON-NEGOTIABLE.
  Gemini generates plans as plain text with = - | table structure.
  You never parse this into HTML or React components.
  You display it inside a <pre> tag with IBM Plex Mono font.
  The DOCX export converts this plain text to professional Word format
  using the docx npm library — it does NOT use HTML-to-DOCX conversion.

PRINCIPLE 3 — THREE AI MODES MUST BE HANDLED.
  Mode A: Guided onboarding (conversational step-by-step)
  Mode B: Direct plan generation
  Mode C: Post-generation conversation
  The frontend and API must support all three modes seamlessly.

PRINCIPLE 4 — CONVERSATION IS A FIRST-CLASS FEATURE.
  After a plan is generated, the teacher can ask follow-up questions.
  The conversation maintains full plan context. Responses are specific
  and anchored to the inquiry question.

PRINCIPLE 5 — DOCX EXPORT IS PROFESSIONAL AND COMPLETE.
  The exported Word document must look like a document created by a
  professional designer — not a plain text dump. It uses the docx npm
  library to create proper Word formatting with IDSS branding.

---

## 1. TECH STACK — FIXED

```
Frontend:      React 18 within Next.js 14 App Router
Styling:       Tailwind CSS v3
UI Components: shadcn/ui
Backend:       Next.js 14 API Routes
Database:      Supabase (PostgreSQL)
Auth:          Custom PIN system
AI:            Google Gemini 1.5 Pro — 8-key rotation system
DOCX Export:   docx npm library (v8.x) — server-side generation
Hosting:       Vercel
Icons:         Lucide React
Fonts:         IBM Plex Sans (UI) + IBM Plex Mono (plan display)
```

---

## 2. REPOSITORY STRUCTURE

```
idss-ibl-planer/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Redirect -> /login
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── chat/
│   │   └── page.tsx                      # NEW: Onboarding + conversation UI
│   └── plan/
│       └── [id]/
│           └── page.tsx
│
├── app/api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   ├── chat/
│   │   └── route.ts                      # NEW: Handles all 3 AI modes
│   ├── plans/
│   │   └── route.ts
│   ├── plans/[id]/
│   │   └── route.ts
│   └── export/
│       └── docx/
│           └── route.ts                  # NEW: DOCX generation endpoint
│
├── components/
│   ├── ui/                               # shadcn/ui
│   ├── ChatInterface.tsx                 # NEW: Unified chat UI (all 3 modes)
│   ├── OnboardingWizard.tsx              # NEW: Mode A guided input
│   ├── PlanDisplay.tsx                   # Updated: coherence indicators
│   ├── ConversationPanel.tsx             # NEW: Mode C follow-up UI
│   ├── DocxExportButton.tsx              # NEW: Export trigger + status
│   ├── PlanCard.tsx
│   ├── DashboardSidebar.tsx
│   ├── GeminiStatusBar.tsx
│   └── LoadingIndicator.tsx
│
├── lib/
│   ├── psi.ts                            # PSI v8.0 CONSTITUTION (read-only)
│   ├── gemini.ts                         # Updated: handles all 3 modes
│   ├── docx-generator.ts                 # NEW: Word document builder
│   ├── supabase.ts
│   ├── pin.ts
│   ├── types.ts                          # Updated: conversation types
│   ├── constants.ts                      # Updated: IDSS subject registry
│   └── utils.ts
│
├── middleware.ts
├── supabase/migrations/
│   ├── 001_initial.sql
│   └── 002_conversations.sql             # NEW: conversation tables
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. PSI v8.0 IN lib/psi.ts

```typescript
// lib/psi.ts
// READ-ONLY after initial creation.
// PSI v8.0 — the complete Constitution of the IBL lesson plan system.

export const PSI_SYSTEM_PROMPT = `
[INSERT COMPLETE PSI v8.0 TEXT HERE — ALL SECTIONS:
  - Pedagogical Foundation (all 8 frameworks)
  - System Execution — Three Modes (A, B, C)
  - Protocol 0: Guided Onboarding
  - Protocol 1: Input Intelligence (Modules 1.1-1.6)
  - Protocol 2: Pedagogical Content Generation (Modules 2.1-2.12)
  - Protocol 3: Lesson Plan Writing Engine (Modules 3.1-3.13)
  - Protocol 4: Post-Generation Conversation (Modules 4.1-4.3)
  - Master System Prompt section
  All criteria, traps, quality gates, language tables — complete.]

WEB APPLICATION CONTEXT:
You receive a structured JSON request. The "mode" field tells you which
protocol to execute:
  mode: "onboarding" -> You are mid-conversation. messages[] contains
        the dialogue so far. Continue Protocol 0.
  mode: "generate"   -> All parameters confirmed. Run P1 -> P2 -> P3.
  mode: "chat"       -> Plan is in context. Run Protocol 4.

Request structure:
{
  mode: "onboarding" | "generate" | "chat",
  messages: [{ role: "user"|"assistant", content: string }],
  plan_context?: string,       // Full plan text (mode "chat" only)
  params?: {                   // Complete params (mode "generate" only)
    language, subject, grade, topic, duration_min,
    prior_knowledge, notes, tier, zpd_calibration
  }
}
` as const;
```

---

## 4. GEMINI CLIENT — UPDATED FOR THREE MODES

```typescript
// lib/gemini.ts

import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { PSI_SYSTEM_PROMPT } from './psi';

const API_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_KEY_6,
  process.env.GEMINI_KEY_7,
  process.env.GEMINI_KEY_8,
].filter((k): k is string => Boolean(k));

export type ChatMode = 'onboarding' | 'generate' | 'chat';

export interface GeminiChatRequest {
  mode:          ChatMode;
  messages:      { role: 'user' | 'model'; content: string }[];
  plan_context?: string;
  params?:       GenerateParams;
}

export interface GenerateParams {
  language:        'bosnian' | 'german' | 'english';
  subject:         string;
  grade:           number;
  topic:           string;
  duration_min:    number;
  tier:            'MICRO' | 'STANDARD' | 'EXTENDED';
  prior_knowledge?: string;
  notes?:          string;
  zpd_calibration?: string;
}

export interface GeminiResult {
  text:        string;
  keyIndex:    number;
  durationMs:  number;
}

function selectStartIndex(requestId: string): number {
  const hash = requestId.split('').reduce(
    (acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffffff, 0
  );
  return Math.abs(hash) % API_KEYS.length;
}

// Build the Gemini Contents array from a chat request
export function buildContents(req: GeminiChatRequest): Content[] {
  const contents: Content[] = [];

  // For onboarding and chat: use full message history
  if (req.mode === 'onboarding') {
    for (const msg of req.messages) {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.content }],
      });
    }
    return contents;
  }

  // For generation: build a structured prompt
  if (req.mode === 'generate' && req.params) {
    const p = req.params;
    const langLabels = {
      bosnian: 'Bosnian (output: bosanski)',
      german:  'German (Ausgabe: Deutsch)',
      english: 'English (output: English)',
    };
    const prompt = [
      'MODE: generate',
      'Generate a complete IBL lesson plan for:',
      '',
      `SUBJECT:           ${p.subject}`,
      `GRADE:             ${p.grade}`,
      `TOPIC:             ${p.topic}`,
      `DURATION:          ${p.duration_min} minutes`,
      `TIER:              ${p.tier}`,
      `OUTPUT LANGUAGE:   ${langLabels[p.language]}`,
      p.prior_knowledge ? `PRIOR KNOWLEDGE:   ${p.prior_knowledge}` : null,
      p.zpd_calibration ? `ZPD CALIBRATION:   ${p.zpd_calibration}` : null,
      p.notes           ? `TEACHER NOTES:     ${p.notes}`           : null,
      '',
      'Execute Protocol 1 -> Protocol 2 -> Protocol 3 in strict sequence.',
      'Run ZPD test first, then all 7 Wiggins-McTighe criteria.',
      'Run Coherence Integrity Check (Module 2.11) before writing.',
      'Include Synthesis & Return to IQ as the final Socratic question.',
      'Output: plain text with = - | table structure. No HTML. No Markdown.',
      'Complete all 10 sections including Post-Generation Prompt.',
    ].filter(Boolean).join('\n');

    contents.push({ role: 'user', parts: [{ text: prompt }] });
    return contents;
  }

  // For chat (Mode C): inject plan context, then conversation history
  if (req.mode === 'chat') {
    const contextIntro = req.plan_context
      ? `MODE: chat\n\nFULL PLAN CONTEXT (this is the plan the teacher is asking about):\n\n${req.plan_context}\n\n---\nThe teacher now has a follow-up question about this plan. Apply Protocol 4.`
      : 'MODE: chat\nThe teacher has a follow-up question. Apply Protocol 4.';

    contents.push({ role: 'user', parts: [{ text: contextIntro }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood. I have the full plan context. I am ready for the teacher\'s question.' }] });

    for (const msg of req.messages) {
      contents.push({ role: msg.role, parts: [{ text: msg.content }] });
    }
    return contents;
  }

  return contents;
}

export async function geminiChat(
  req: GeminiChatRequest,
  requestId: string
): Promise<GeminiResult> {
  const startIndex = selectStartIndex(requestId);
  const startTime  = Date.now();
  const contents   = buildContents(req);

  for (let i = 0; i < API_KEYS.length; i++) {
    const keyIndex = (startIndex + i) % API_KEYS.length;
    const apiKey   = API_KEYS[keyIndex];

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        systemInstruction: PSI_SYSTEM_PROMPT,
        generationConfig: {
          temperature:     req.mode === 'chat' ? 0.6 : 0.7,
          topK:            40,
          topP:            0.95,
          maxOutputTokens: req.mode === 'chat' ? 4096 : 8192,
        },
      });

      const result = await model.generateContent({ contents });
      const text   = result.response.text();

      if (!text || text.trim().length < 50) throw new Error('EMPTY_RESPONSE');

      return { text, keyIndex, durationMs: Date.now() - startTime };
    } catch (err: unknown) {
      const status  = (err as { status?: number })?.status;
      const message = (err as Error)?.message;
      if (status === 429 || status === 503 || message === 'EMPTY_RESPONSE') {
        continue;
      }
      throw err;
    }
  }

  throw new Error('ALL_KEYS_EXHAUSTED');
}

// Parse ZPD calibration from prior knowledge + grade
export function deriveZpdCalibration(
  grade: number,
  priorKnowledge: string
): string {
  if (!priorKnowledge.trim()) {
    return `No prior knowledge specified. Calibrate from grade ${grade} developmental norms.`;
  }
  const len = priorKnowledge.length;
  if (len < 30)  return `Basic prior knowledge noted. Place IQ at lower ZPD boundary.`;
  if (len < 100) return `Intermediate prior knowledge noted. Place IQ at middle ZPD.`;
  return `Detailed prior knowledge noted. Place IQ at upper ZPD boundary.`;
}

// Extract inquiry question from plan text
export function extractInquiryQuestion(planText: string): string | null {
  const patterns = [
    /ISTRAZIVACKO PITANJE[^\n]*\n={3,}\n\s*\|\s+(.+?)\s+\|/s,
    /FORSCHUNGSFRAGE[^\n]*\n={3,}\n\s*\|\s+(.+?)\s+\|/s,
    /INQUIRY QUESTION[^\n]*\n={3,}\n\s*\|\s+(.+?)\s+\|/s,
  ];
  for (const p of patterns) {
    const m = planText.match(p);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}
```

---

## 5. UNIFIED CHAT API ROUTE

```typescript
// app/api/chat/route.ts
// Handles all three AI modes: onboarding, generate, chat.

import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { geminiChat, deriveZpdCalibration, extractInquiryQuestion }
                                     from '@/lib/gemini';
import { validatePinSession }        from '@/lib/pin';
import { supabaseAdmin }             from '@/lib/supabase';
import sanitizeHtml                  from 'sanitize-html';

const MessageSchema = z.object({
  role:    z.enum(['user', 'model']),
  content: z.string().min(1).max(8000),
});

const ChatSchema = z.object({
  mode:         z.enum(['onboarding', 'generate', 'chat']),
  messages:     z.array(MessageSchema).min(1).max(100),
  plan_id:      z.string().uuid().optional(),
  plan_context: z.string().max(20000).optional(),
  params: z.object({
    language:        z.enum(['bosnian', 'german', 'english']),
    subject:         z.string().min(1).max(100),
    grade:           z.number().int().min(1).max(9),
    topic:           z.string().min(1).max(200),
    duration_min:    z.number().int().min(10).max(240).default(90),
    tier:            z.enum(['MICRO', 'STANDARD', 'EXTENDED']),
    prior_knowledge: z.string().max(500).optional(),
    notes:           z.string().max(500).optional(),
  }).optional(),
});

function sanitize(s: string) {
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} }).trim();
}

function deriveTier(d: number): 'MICRO' | 'STANDARD' | 'EXTENDED' {
  return d <= 45 ? 'MICRO' : d <= 90 ? 'STANDARD' : 'EXTENDED';
}

export async function POST(req: NextRequest) {
  // Auth
  const token = req.cookies.get('pin_session')?.value;
  if (!await validatePinSession(token)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Validate
  const body   = await req.json().catch(() => ({}));
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { mode, messages, plan_id, plan_context, params } = parsed.data;
  const requestId = crypto.randomUUID();

  // For generate mode: sanitize and enrich params
  let enrichedParams = params;
  if (mode === 'generate' && params) {
    enrichedParams = {
      ...params,
      subject:         sanitize(params.subject),
      topic:           sanitize(params.topic),
      prior_knowledge: params.prior_knowledge ? sanitize(params.prior_knowledge) : undefined,
      notes:           params.notes           ? sanitize(params.notes)           : undefined,
      tier:            deriveTier(params.duration_min),
      zpd_calibration: deriveZpdCalibration(
        params.grade,
        params.prior_knowledge ?? ''
      ),
    };
  }

  try {
    const { text, keyIndex, durationMs } = await geminiChat(
      { mode, messages, plan_context, params: enrichedParams },
      requestId
    );

    // For generate mode: auto-save the plan
    let savedPlanId: string | null = null;
    if (mode === 'generate' && enrichedParams) {
      const iq = extractInquiryQuestion(text);
      const { data } = await supabaseAdmin
        .from('plans')
        .insert({
          language:           enrichedParams.language,
          subject:            enrichedParams.subject,
          grade:              enrichedParams.grade,
          topic:              enrichedParams.topic,
          duration_min:       enrichedParams.duration_min,
          tier:               enrichedParams.tier,
          prior_knowledge:    enrichedParams.prior_knowledge,
          notes:              enrichedParams.notes,
          plan_text:          text,
          inquiry_question:   iq,
          generation_time_ms: durationMs,
          gemini_key_index:   keyIndex,
        })
        .select('id')
        .single();
      savedPlanId = data?.id ?? null;
    }

    return NextResponse.json({
      success:    true,
      text,
      mode,
      plan_id:    savedPlanId ?? plan_id ?? null,
      keyIndex,
      durationMs,
    });

  } catch (err: unknown) {
    const msg = (err as Error)?.message;
    if (msg === 'ALL_KEYS_EXHAUSTED') {
      return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 });
    }
    console.error('[/api/chat]', err);
    return NextResponse.json({ error: 'GENERATION_FAILED' }, { status: 500 });
  }
}
```

---

## 6. DOCX EXPORT

### 6.1 DOCX generation route

```typescript
// app/api/export/docx/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateDocx }              from '@/lib/docx-generator';
import { supabaseAdmin }             from '@/lib/supabase';
import { validatePinSession }        from '@/lib/pin';
import { z }                         from 'zod';

const ExportSchema = z.object({
  plan_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  if (!await validatePinSession(req.cookies.get('pin_session')?.value)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = ExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const { data: plan, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', parsed.data.plan_id)
    .eq('is_deleted', false)
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  try {
    const docxBuffer = await generateDocx(plan);
    const filename   = `IBL_Plan_${plan.subject}_${plan.grade}razred_${plan.topic.replace(/\s+/g, '_').slice(0, 30)}.docx`;

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      docxBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error('[/api/export/docx]', err);
    return NextResponse.json({ error: 'EXPORT_FAILED' }, { status: 500 });
  }
}
```

### 6.2 DOCX generator — professional Word format

```typescript
// lib/docx-generator.ts
// Converts plain-text plan to a professionally formatted Word document.
// Uses the docx npm library. Does NOT use HTML-to-DOCX conversion.

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, ImageRun, PageNumber, NumberFormat,
  convertInchesToTwip, convertMillimetersToTwip,
  TableLayoutType,
} from 'docx';
import type { PlanRecord } from './types';

// IDSS brand colours
const IDSS_DARK_BLUE  = '002D6E';
const IDSS_GOLD       = 'F0B429';
const IDSS_LIGHT_BLUE = 'EBF5FB';
const IDSS_GREY_BG    = 'F8FAFC';
const WHITE           = 'FFFFFF';

// Font settings
const FONT_DISPLAY = 'Calibri';
const FONT_BODY    = 'Calibri';
const FONT_MONO    = 'Courier New';

// --- HELPER FUNCTIONS -------------------------------------------------------

function idssHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({
      text,
      bold:  true,
      color: IDSS_DARK_BLUE,
      size:  26,
      font:  FONT_DISPLAY,
    })],
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: IDSS_DARK_BLUE },
    },
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({
      text,
      bold:  true,
      color: WHITE,
      size:  22,
      font:  FONT_DISPLAY,
    })],
    shading: { type: ShadingType.CLEAR, fill: IDSS_DARK_BLUE },
    spacing: { before: 200, after: 80 },
    indent:  { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
  });
}

function bodyParagraph(text: string, indent = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: FONT_BODY })],
    spacing: { after: 80 },
    indent:  indent ? { left: convertInchesToTwip(0.3) } : undefined,
  });
}

function monoParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: FONT_MONO })],
    spacing: { after: 0 },
    shading: { type: ShadingType.CLEAR, fill: IDSS_GREY_BG },
  });
}

function checkboxLine(checked: boolean, text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: checked ? '☑ ' : '☐ ',
        size: 20,
        color: checked ? '16A34A' : '94A3B8',
        font: FONT_BODY,
      }),
      new TextRun({ text, size: 20, font: FONT_BODY }),
    ],
    spacing: { after: 60 },
    indent:  { left: convertInchesToTwip(0.2) },
  });
}

function twoColumnRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children:  [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: FONT_BODY })] })],
        width:     { size: 25, type: WidthType.PERCENTAGE },
        shading:   { type: ShadingType.CLEAR, fill: IDSS_LIGHT_BLUE },
        margins:   { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      new TableCell({
        children:  [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: FONT_BODY })] })],
        width:     { size: 75, type: WidthType.PERCENTAGE },
        margins:   { top: 80, bottom: 80, left: 120, right: 120 },
      }),
    ],
  });
}

function goldDivider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: IDSS_GOLD } },
    spacing: { before: 160, after: 160 },
  });
}

// --- PLAN TEXT PARSER -------------------------------------------------------
// Parses the plain-text plan into structured sections for Word formatting.

interface ParsedSection {
  heading:  string;
  lines:    string[];
  isAscii:  boolean;
}

function parsePlanSections(planText: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let currentHeading = '';
  let currentLines:   string[] = [];
  let inAscii = false;

  for (const raw of planText.split('\n')) {
    const line = raw; // preserve indentation

    // Major section separator (=====)
    if (/^={5,}/.test(line.trim())) {
      if (currentLines.length > 0 || currentHeading) {
        sections.push({
          heading:  currentHeading,
          lines:    currentLines,
          isAscii:  inAscii,
        });
        currentLines  = [];
        currentHeading = '';
        inAscii        = false;
      }
      continue;
    }

    // Section heading (CAPS line after separator)
    if (/^[A-ZÜÄÖŠĆČŽĐ][A-ZÜÄÖŠĆČŽĐ\s\-\/\|\.0-9]{4,}$/.test(line.trim()) && !line.includes('|')) {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, lines: currentLines, isAscii: inAscii });
        currentLines = [];
        inAscii      = false;
      }
      currentHeading = line.trim();
      continue;
    }

    // Detect ASCII visual block
    if (line.includes('+----') || line.includes('+====')) {
      inAscii = true;
    }
    if (inAscii && line.trim() === '') {
      inAscii = false;
    }

    currentLines.push(line);
  }

  if (currentLines.length > 0 || currentHeading) {
    sections.push({ heading: currentHeading, lines: currentLines, isAscii: inAscii });
  }

  return sections;
}

function sectionToDocxChildren(section: ParsedSection): Paragraph[] {
  const children: Paragraph[] = [];

  if (section.heading) {
    children.push(sectionHeading(section.heading));
  }

  // ASCII visual blocks get monospace font
  if (section.isAscii || section.heading.includes('VIZUELNI') || section.heading.includes('VISUAL')) {
    for (const line of section.lines) {
      children.push(monoParagraph(line));
    }
    return children;
  }

  for (const line of section.lines) {
    const trimmed = line.trim();

    // Skip pure separator lines
    if (/^[-=]{4,}$/.test(trimmed)) continue;

    // Checkbox lines
    if (trimmed.startsWith('[X]')) {
      children.push(checkboxLine(true, trimmed.slice(3).trim()));
    } else if (trimmed.startsWith('[ ]')) {
      children.push(checkboxLine(false, trimmed.slice(3).trim()));

    // Bullet points
    } else if (trimmed.startsWith('- ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(2), size: 20, font: FONT_BODY })],
        bullet:   { level: 0 },
        spacing:  { after: 60 },
      }));

    // Table rows with pipes
    } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
      if (cells.length >= 2 && !cells.every(c => /^[-=]+$/.test(c))) {
        children.push(new Paragraph({
          children: cells.map((cell, i) => new TextRun({
            text:  i === 0 ? `${cell}   ` : cell + '   ',
            bold:  i === 0,
            size:  20,
            font:  FONT_BODY,
          })),
          spacing: { after: 60 },
          shading: { type: ShadingType.CLEAR, fill: IDSS_GREY_BG },
        }));
      }

    // Numbered items
    } else if (/^\d+\./.test(trimmed)) {
      children.push(new Paragraph({
        children:       [new TextRun({ text: trimmed, size: 20, font: FONT_BODY })],
        numbering:      { reference: 'numbered-list', level: 0 },
        spacing:        { after: 60 },
      }));

    // Normal body text
    } else if (trimmed.length > 0) {
      const isLabel = trimmed.endsWith(':') && trimmed.length < 60;
      children.push(bodyParagraph(trimmed, false));
    }
  }

  return children;
}

// --- DOCUMENT BUILDER -------------------------------------------------------

export async function generateDocx(plan: PlanRecord): Promise<Buffer> {
  const tierLabel = { MICRO: 'Mikro čas', STANDARD: 'Standardni čas', EXTENDED: 'Produženi čas' };
  const langLabel = { bosnian: 'Bosanski', german: 'Deutsch', english: 'English' };

  // Parse sections from plan text
  const sections = parsePlanSections(plan.plan_text);

  // Build document children
  const docChildren: Paragraph[] = [
    // --- COVER / HEADER ---
    new Paragraph({ spacing: { after: 80 } }),
    new Paragraph({
      children: [new TextRun({
        text:  'PLANER ZA IBL LEKCIJU',
        bold:  true,
        color: IDSS_DARK_BLUE,
        size:  36,
        font:  FONT_DISPLAY,
      })],
      alignment: AlignmentType.CENTER,
      spacing:   { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text:  'Inquiry-Based Learning',
        color: IDSS_DARK_BLUE,
        size:  24,
        font:  FONT_DISPLAY,
        italics: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing:   { after: 240 },
    }),

    // --- METADATA TABLE ---
    new Paragraph({ spacing: { after: 80 } }),
  ];

  // Metadata table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      twoColumnRow('Škola:', 'Internationale Deutsche Schule Sarajevo'),
      twoColumnRow('Nastavnik/Nastavnica:', '______________________________'),
      twoColumnRow('Predmet i razred:', `${plan.subject}, ${plan.grade}. razred`),
      twoColumnRow('Tema:', plan.topic),
      twoColumnRow('Datum:', '_______________'),
      twoColumnRow('Trajanje:', `${plan.duration_min} minuta — ${tierLabel[plan.tier]}`),
      twoColumnRow('Jezik:', langLabel[plan.language]),
    ],
    borders: {
      top:         { style: BorderStyle.SINGLE, size: 2, color: IDSS_DARK_BLUE },
      bottom:      { style: BorderStyle.SINGLE, size: 2, color: IDSS_DARK_BLUE },
      left:        { style: BorderStyle.SINGLE, size: 2, color: IDSS_DARK_BLUE },
      right:       { style: BorderStyle.SINGLE, size: 2, color: IDSS_DARK_BLUE },
      insideH:     { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      insideV:     { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    },
  });

  docChildren.push(
    new Paragraph({ children: [new TextRun({ text: '', children: [] })] })
  );

  // Add inquiry question callout box if extracted
  if (plan.inquiry_question) {
    docChildren.push(
      goldDivider(),
      new Paragraph({
        children: [new TextRun({ text: 'Istraživačko pitanje:', bold: true, color: IDSS_DARK_BLUE, size: 20, font: FONT_DISPLAY })],
        spacing: { before: 160, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({
          text:    plan.inquiry_question,
          bold:    true,
          color:   IDSS_DARK_BLUE,
          size:    24,
          font:    FONT_DISPLAY,
          italics: true,
        })],
        shading:  { type: ShadingType.CLEAR, fill: IDSS_LIGHT_BLUE },
        indent:   { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
        spacing:  { before: 120, after: 120 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: IDSS_GOLD },
        },
      }),
      goldDivider()
    );
  }

  // Render all parsed sections
  for (const section of sections) {
    docChildren.push(...sectionToDocxChildren(section));
  }

  // Footer content
  docChildren.push(
    goldDivider(),
    new Paragraph({
      children: [new TextRun({
        text:   'Za savjete, pitanja i ideje: gospođa Maja Ljubović — majaljubovic@gmail.com',
        size:   18,
        color:  '64748B',
        font:   FONT_BODY,
        italics: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 160, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text:  `IBL Planer — Internationale Deutsche Schule Sarajevo — PSI v8.0 — ${new Date().toLocaleDateString('bs-BA')}`,
        size:  16,
        color: '94A3B8',
        font:  FONT_BODY,
      })],
      alignment: AlignmentType.CENTER,
    }),
  );

  // Build document
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'numbered-list',
        levels: [{
          level:     0,
          format:    NumberFormat.DECIMAL,
          text:      '%1.',
          alignment: AlignmentType.START,
        }],
      }],
    },
    styles: {
      default: {
        document: {
          run:       { font: FONT_BODY, size: 20 },
          paragraph: { spacing: { after: 80 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertMillimetersToTwip(20),
            bottom: convertMillimetersToTwip(20),
            left:   convertMillimetersToTwip(25),
            right:  convertMillimetersToTwip(25),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text:  'INTERNATIONALE DEUTSCHE SCHULE SARAJEVO  —  IBL PLANER',
                  size:  16,
                  color: IDSS_DARK_BLUE,
                  font:  FONT_DISPLAY,
                  bold:  true,
                }),
              ],
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 2, color: IDSS_GOLD },
              },
              alignment: AlignmentType.CENTER,
              spacing:   { after: 80 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${plan.subject} — ${plan.grade}. razred — `, size: 16, color: '64748B', font: FONT_BODY }),
                new TextRun({ text: plan.topic, size: 16, color: '64748B', font: FONT_BODY, bold: true }),
                new TextRun({ text: '   Stranica ', size: 16, color: '94A3B8', font: FONT_BODY }),
                new TextRun({ children: [new PageNumber()] }),
              ],
              alignment: AlignmentType.RIGHT,
              border: {
                top: { style: BorderStyle.SINGLE, size: 2, color: IDSS_GOLD },
              },
            }),
          ],
        }),
      },
      // Insert metadata table as first table
      children: [
        metaTable,
        ...docChildren,
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
```

---

## 7. UPDATED DATABASE SCHEMA

```sql
-- supabase/migrations/002_conversations.sql

-- Conversation sessions (links messages to plans)
CREATE TABLE conversations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  plan_id     UUID        REFERENCES plans(id) ON DELETE SET NULL,
  mode        TEXT        NOT NULL CHECK (mode IN ('onboarding', 'generate', 'chat')),
  is_complete BOOLEAN     DEFAULT FALSE
);

-- Individual messages in a conversation
CREATE TABLE conversation_messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'model')),
  content         TEXT        NOT NULL,
  message_order   INTEGER     NOT NULL
);

CREATE INDEX conv_plan_idx      ON conversations (plan_id);
CREATE INDEX conv_msg_conv_idx  ON conversation_messages (conversation_id, message_order);

-- Add docx_export_count to plans for analytics
ALTER TABLE plans ADD COLUMN docx_export_count INTEGER DEFAULT 0;
```

---

## 8. FRONTEND COMPONENTS

### 8.1 ChatInterface.tsx — unified UI for all 3 modes

```
LAYOUT: Full-height flex column
  Top:    Mode indicator bar (shows current mode + plan title if in Mode C)
  Middle: Message scroll area (flex-1, overflow-y-auto)
  Bottom: Input area (sticky)

MESSAGE RENDERING:
  User messages:  right-aligned, primary color bubble, white text
  AI messages:    left-aligned, surface card
    - If message contains a complete plan (detected by "====" lines):
        Render with PlanDisplay component (pre-formatted, monospace)
        Show DocxExportButton below the plan
    - If message is conversational (Mode A or C):
        Render as normal text (with markdown-lite for bullet points only)

MODE INDICATOR BAR (64px, sticky top):
  Mode A: "Kreiranje novog plana" + step indicator (Step X of 6)
  Mode B: Spinner + "Generišem IBL plan..." (during generation)
  Mode C: Plan title + subject + grade chips + "Razgovor o planu"

INPUT AREA:
  Textarea (auto-resize, max 4 rows)
  Send button (primary, ArrowRight icon)
  Below input: suggestion pills for Mode C follow-ups
    (show after plan is generated, rotate through relevant suggestions)

SUGGESTION PILLS (Mode C — show 3 at a time):
  Examples based on what was just answered:
  "Predloži alternativnu udicu"
  "Generiraj rubrik za ocjenjivanje"
  "Prilagodi za 45 minuta"
  "Konkretni video za dokazni materijal"
  "Verzija za učenike sa posebnim potrebama"
  Click → auto-fills input + submits

EMPTY STATE (no messages yet):
  IDSS logo (centered, 80px)
  "IBL Planer — Internationale Deutsche Schule Sarajevo"
  "Kako mogu pomoći?"
  3 quick-start cards:
    [Kreirati novi plan]   → sends "novi plan"
    [Nastaviti razgovor]   → shows recent plan list
    [Pitati o IBL-u]       → sends "Šta je IBL?"
```

### 8.2 DocxExportButton.tsx

```
TRIGGER: Appears immediately below every generated plan.
APPEARANCE:
  Button: "Preuzmi kao Word (.docx)"
  Icon:   FileDown (Lucide)
  Style:  Secondary outlined, IDSS border color
  Size:   Medium

STATES:
  Default:   "Preuzmi kao Word (.docx)"
  Loading:   Spinner + "Priprema dokument..."
  Success:   Green check + "Preuzeto!" (3 seconds, then reverts)
  Error:     Red icon + "Greška — pokušaj ponovo"

BEHAVIOR:
  onClick:
    1. Show loading state
    2. POST /api/export/docx with { plan_id }
    3. Receive binary response
    4. Create blob URL and trigger browser download
    5. Show success state

POSITION:
  Sticky to the bottom of the PlanDisplay component
  On mobile: full-width button
  On desktop: right-aligned, max-width 280px

ADDITIONAL BUTTON (same row):
  "Kopiraj tekst" — copies raw plan_text to clipboard
  Icon: Copy (Lucide)
  Style: Ghost/text button
```

### 8.3 PlanDisplay.tsx — updated with coherence indicators

```
CONTAINER: white bg, max-w-900px, centered

PRE-FORMATTED DISPLAY:
  <pre> tag, IBM Plex Mono, 13px, line-height 1.65
  white-space: pre, overflow-x: auto

NON-DESTRUCTIVE VISUAL ENHANCEMENTS (via JS, original text preserved):
  Lines matching /^={5,}/     -> light blue background stripe (section border)
  Lines matching /^-{4,}/     -> subtle grey line (minor divider)
  "[X]" occurrences           -> ✓ symbol in emerald green
  "[ ]" occurrences           -> ☐ symbol in slate grey
  Lines containing "IQ veza:" -> subtle gold left border (coherence indicator)
  Lines containing "Sinteza"  -> amber background highlight (synthesis Q)
  ASCII visual blocks          -> monospace box with light grey bg + border
  "ZPD" lines                 -> blue-tinted background

COPY RULE: The copy-to-clipboard function copies the ORIGINAL plain text.
           The visual enhancements are CSS/span wrappers only.

INQUIRY QUESTION CALLOUT:
  The IQ is extracted and displayed as a prominent callout box:
  Gold left border, light blue background, bold italic text, 16px
  This appears BEFORE the pre-formatted plan begins.

PRINT STYLES (@media print):
  All UI chrome hidden
  Plan: full width, 11pt, Courier New
  Page breaks before ====== lines
  Header: "Internationale Deutsche Schule Sarajevo — IBL Planer"
  Footer: "majaljubovic@gmail.com | Stranica X"
```

### 8.4 ConversationPanel.tsx

```
POSITION: Right sidebar (320px) on desktop, bottom sheet on mobile
VISIBILITY: Only visible in Mode C (after plan generated)

CONTENT:
  Header: "Razgovor o planu"
  
  SUGGESTED QUESTIONS section (collapsible, open by default):
    "Pitajte me o ovom planu:"
    6 suggestion buttons, each pre-fills the chat input:
      "Predloži alternativnu udicu"
      "Generiraj rubrik za ocjenjivanje dokaza učenja"
      "Prilagodi plan za 45 minuta"
      "Predloži konkretan video za dokazni materijal"
      "Kako prilagoditi za učenike sa posebnim potrebama?"
      "Da li je istraživačko pitanje dovoljno otvoreno?"
  
  PLAN CONTEXT section (collapsible, closed by default):
    Shows: Inquiry question (gold callout)
    Shows: Subject, Grade, Topic, Tier chips
  
  HISTORY section:
    Shows: Conversation message count
    "Sačuvaj razgovor" button (saves to conversations table)
```

---

## 9. UPDATED types.ts

```typescript
// lib/types.ts — additions for v2.0

export type ChatMode    = 'onboarding' | 'generate' | 'chat';
export type MessageRole = 'user' | 'model';

export interface ChatMessage {
  id:        string;          // client-side UUID
  role:      MessageRole;
  content:   string;
  timestamp: Date;
  isPlan?:   boolean;         // true if content is a generated plan
  plan_id?:  string;          // populated after auto-save
}

export interface ConversationState {
  mode:         ChatMode;
  messages:     ChatMessage[];
  activePlanId: string | null;
  activePlan:   PlanRecord | null;
  isLoading:    boolean;
  error:        string | null;
}

// Onboarding form state (collected step by step in Mode A)
export interface OnboardingState {
  step:             number;   // 0-6
  language?:        Language;
  subject?:         string;
  grade?:           number;
  topic?:           string;
  duration_min?:    number;
  prior_knowledge?: string;
  notes?:           string;
  confirmed:        boolean;
}

// DOCX export state
export interface DocxExportState {
  status:   'idle' | 'loading' | 'success' | 'error';
  filename?: string;
  error?:    string;
}
```

---

## 10. UPDATED package.json DEPENDENCIES

```json
{
  "dependencies": {
    "next":                    "14.2.5",
    "react":                   "18.3.1",
    "react-dom":               "18.3.1",
    "@google/generative-ai":   "^0.15.0",
    "@supabase/supabase-js":   "^2.43.4",
    "tailwindcss":             "^3.4.4",
    "zod":                     "^3.23.8",
    "lucide-react":            "^0.400.0",
    "swr":                     "^2.2.5",
    "sanitize-html":           "^2.13.0",
    "docx":                    "^8.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx":                    "^2.1.1",
    "tailwind-merge":          "^2.3.0"
  }
}
```

---

## 11. UPDATED BUILD ORDER

```
Step 01: package.json + config files (add docx dependency)
Step 02: lib/types.ts (add v2.0 types)
Step 03: lib/constants.ts (23 IDSS subjects, special handling flags)
Step 04: lib/psi.ts (PSI v8.0 COMPLETE text)
Step 05: lib/gemini.ts (three-mode client + buildContents + helpers)
Step 06: lib/supabase.ts
Step 07: lib/pin.ts
Step 08: lib/utils.ts
Step 09: lib/docx-generator.ts (professional Word generator)
Step 10: supabase SQL: 001_initial.sql + 002_conversations.sql
Step 11: .env.example
Step 12: app/globals.css + app/layout.tsx
Step 13: app/login/page.tsx + login API routes
Step 14: middleware.ts
Step 15: app/api/chat/route.ts (unified 3-mode API)
Step 16: app/api/plans/route.ts + plans/[id]/route.ts
Step 17: app/api/export/docx/route.ts
Step 18: components/DocxExportButton.tsx
         TEST: generates and downloads a sample docx
Step 19: components/PlanDisplay.tsx (with coherence indicators)
         TEST: plain text preserved, visual enhancements applied
Step 20: components/ConversationPanel.tsx
Step 21: components/ChatInterface.tsx (all 3 modes)
         TEST: Mode A onboarding flow (6 steps, confirmation)
         TEST: Mode B generation flow (loading states, auto-save)
         TEST: Mode C conversation flow (context preserved)
Step 22: components/LoadingIndicator.tsx
Step 23: components/GeminiStatusBar.tsx
Step 24: app/chat/page.tsx (main entry point)
Step 25: components/PlanCard.tsx + DashboardSidebar.tsx
Step 26: app/dashboard/page.tsx
Step 27: app/plan/[id]/page.tsx
Step 28: app/page.tsx (redirect to /chat or /dashboard)
Step 29: Vercel deployment + all env vars set
Step 30: Run all 8 acceptance tests
```

---

## 12. ACCEPTANCE TESTS — ALL 8 MUST PASS

```
TEST 1 — ONBOARDING FLOW (Mode A):
  Open app -> click "Kreirati novi plan" ->
  AI asks: "Za koji predmet?"  ->  Answer: "Geschichte"
  AI asks: "Für welche Klasse?"  ->  Answer: "5"
  AI asks: "Was ist das Thema?"  ->  Answer: "Altes Rom"
  AI asks: "Wie viel Zeit?"  ->  Answer: "90"
  AI asks: "Was wissen die Schüler bereits?"  ->  Answer: given
  AI shows summary and asks for confirmation  ->  "Ja"
  Plan generated in German, 90 min, STANDARD tier
  PASS: Plan contains all 10 sections in German

TEST 2 — DIRECT GENERATION (Mode B):
  Open chat -> type "Biologie, 7, Fotosinteza, 60"
  Plan generated immediately (no onboarding)
  PASS: Plan in Bosnian (detected from topic word), 60 min, MICRO tier

TEST 3 — DOCX EXPORT:
  Open any generated plan -> click "Preuzmi kao Word (.docx)"
  Word file downloads automatically
  Open in Microsoft Word / LibreOffice
  PASS: Professional formatting: IDSS header on every page,
        gold footer, metadata table, IQ callout box,
        section headings in dark blue, checkboxes visible,
        ASCII visuals in monospace, all 10 sections present

TEST 4 — CONVERSATION MODE (Mode C):
  After plan generated -> type "Predloži alternativnu udicu"
  AI responds with a new hook specific to the plan's topic/grade
  PASS: Response references the inquiry question explicitly,
        does not regenerate the full plan,
        ends with "Moguća sljedeća pitanja:"

TEST 5 — RUBRIC GENERATION (Mode C, Category 4):
  After plan -> type "Generiraj rubrik za ocjenjivanje"
  AI generates a 4-level rubric in plain-text table format
  PASS: Rubric has 4 rows (inquiry process, reasoning, IQ connection,
        communication), no row assesses content memorization

TEST 6 — RATE LIMIT FALLBACK:
  Simulate key 0 returning 429
  PASS: System tries next key, plan generated, GeminiStatusBar
        shows "Fallback na ključ #X"

TEST 7 — SPECIAL SUBJECT HANDLING:
  Type "Lebenskunde, 6, Freundschaft und Konflikte, 90"
  PASS: Hook is an ethical dilemma, Socratic questions include
        perspective-shift (Type 4) and consequence (Type 6),
        IQ is philosophical not factual

TEST 8 — PRINT QUALITY:
  Open any plan -> Ctrl+P
  PASS: No sidebar, no buttons visible, plan text at full width,
        IDSS header and footer on every printed page,
        table structure (= - | chars) preserved in print
```

---

## 13. SECURITY — UNCHANGED FROM v1.0

All v1.0 security requirements apply without change:
PIN hashing, HttpOnly cookies, server-side-only API keys,
Zod validation on all routes, sanitize-html on all string inputs,
soft delete only, rate limiting on /api/auth/login.

---

## FINAL CHECKLIST BEFORE FIRST COMMIT

```
[ ] PSI v8.0 complete text in lib/psi.ts — not summarized
[ ] All 8 GEMINI_KEY_* in .env.local, never in code
[ ] docx library installed and importable
[ ] SQL migrations 001 and 002 run in Supabase
[ ] Three AI modes tested: onboarding, generate, chat
[ ] DOCX export tested in Microsoft Word and LibreOffice
[ ] Conversation panel suggestions are topic-relevant
[ ] Plan display: plain text preserved in <pre>, copy copies raw text
[ ] Print: IDSS header + gold footer on every page
[ ] All 8 acceptance tests pass on production Vercel URL
```

---

# END OF SYSTEM INSTRUCTIONS v2.0
# IDSS IBL Lesson Plan Web Application
# Internationale Deutsche Schule Sarajevo | 14.3.2026.
# PSI Foundation: v8.0
