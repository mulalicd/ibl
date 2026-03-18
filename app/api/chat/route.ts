import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import sanitizeHtml                  from 'sanitize-html';
import { geminiChat, deriveZpdCalibration, extractInquiryQuestion }
                                     from '@/lib/gemini';
import { validatePinSession }        from '@/lib/pin';
import { supabaseAdmin }             from '@/lib/supabase';
import { deriveTier, randomHex }     from '@/lib/utils';

export const runtime = 'nodejs';

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role:    z.enum(['user', 'model']),
  content: z.string().min(1).max(8000),
});

const ParamsSchema = z.object({
  language:        z.enum(['bosnian', 'german', 'english']),
  subject:         z.string().min(1).max(100),
  grade:           z.number().int().min(1).max(9),
  topic:           z.string().min(1).max(200),
  duration_min:    z.number().int().min(10).max(240).default(90),
  tier:            z.enum(['MICRO', 'STANDARD', 'EXTENDED']),
  prior_knowledge: z.string().max(500).optional(),
  notes:           z.string().max(500).optional(),
  zpd_calibration: z.string().optional(),
});

const ChatSchema = z.object({
  mode:         z.enum(['onboarding', 'generate', 'chat']),
  messages:     z.array(MessageSchema).min(1).max(100),
  plan_id:      z.string().uuid().optional(),
  plan_context: z.string().max(20000).optional(),
  params:       ParamsSchema.optional(),
});

// ─── SANITIZE ─────────────────────────────────────────────────────────────────

function sanitize(s: string): string {
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} }).trim();
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const sessionToken = req.cookies.get('pin_session')?.value;
  if (!await validatePinSession(sessionToken)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // 2. Validate input
  const body   = await req.json().catch(() => ({}));
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { mode, messages, plan_id, plan_context, params } = parsed.data;
  const requestId = randomHex(16);

  // 3. Enrich params for generate mode
  let enrichedParams = params;
  if (mode === 'generate' && params) {
    const tier = deriveTier(params.duration_min);
    const zpd  = deriveZpdCalibration(
      params.grade,
      params.prior_knowledge ?? ''
    );
    enrichedParams = {
      ...params,
      subject:         sanitize(params.subject),
      topic:           sanitize(params.topic),
      prior_knowledge: params.prior_knowledge
                         ? sanitize(params.prior_knowledge)
                         : undefined,
      notes:           params.notes ? sanitize(params.notes) : undefined,
      tier,
      zpd_calibration: zpd,
    };
  }

  // 4. Call Gemini
  try {
    const { text, keyIndex, durationMs } = await geminiChat(
      { mode, messages, plan_context, params: enrichedParams },
      requestId
    );

    // 5. Auto-save plan when generation is complete
    let savedPlanId: string | null = null;
    if (mode === 'generate' && enrichedParams) {
      const iq = extractInquiryQuestion(text);
      const { data, error } = await supabaseAdmin
        .from('plans')
        .insert({
          language:           enrichedParams.language,
          subject:            enrichedParams.subject,
          grade:              enrichedParams.grade,
          topic:              enrichedParams.topic,
          duration_min:       enrichedParams.duration_min,
          tier:               enrichedParams.tier,
          prior_knowledge:    enrichedParams.prior_knowledge ?? null,
          notes:              enrichedParams.notes ?? null,
          plan_text:          text,
          inquiry_question:   iq ?? null,
          generation_time_ms: durationMs,
          gemini_key_index:   keyIndex,
        })
        .select('id')
        .single();

      if (!error && data) {
        savedPlanId = data.id as string;
      }
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
    const message = (err as Error)?.message;

    if (message === 'ALL_KEYS_EXHAUSTED') {
      return NextResponse.json(
        {
          error:   'RATE_LIMIT',
          message: 'Svi API ključevi su privremeno preopterećeni. Sačekajte 1 minutu.',
        },
        { status: 429 }
      );
    }

    console.error('[/api/chat] Unexpected error:', err);
    return NextResponse.json(
      { error: 'GENERATION_FAILED' },
      { status: 500 }
    );
  }
}