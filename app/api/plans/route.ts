import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { supabaseAdmin }             from '@/lib/supabase';
import { validatePinSession }        from '@/lib/pin';

export const runtime = 'nodejs';

const CARD_FIELDS = [
  'id', 'created_at', 'subject', 'grade', 'topic',
  'duration_min', 'tier', 'language', 'inquiry_question', 'is_favourite',
].join(', ');

// ── GET: list plans with filtering and pagination ─────────────────────────────

export async function GET(req: NextRequest) {
  if (!await validatePinSession(req.cookies.get('pin_session')?.value)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const sp         = new URL(req.url).searchParams;
  const page       = Math.max(1, parseInt(sp.get('page')  ?? '1'));
  const limit      = Math.min(50, Math.max(1, parseInt(sp.get('limit') ?? '12')));
  const subject    = sp.get('subject');
  const grade      = sp.get('grade') ? parseInt(sp.get('grade')!) : null;
  const language   = sp.get('language');
  const tier       = sp.get('tier');
  const favourites = sp.get('favourites') === 'true';
  const search     = sp.get('search')?.trim();

  let query = supabaseAdmin
    .from('plans')
    .select(CARD_FIELDS, { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (subject)    query = query.eq('subject', subject);
  if (grade)      query = query.eq('grade', grade);
  if (language)   query = query.eq('language', language);
  if (tier)       query = query.eq('tier', tier);
  if (favourites) query = query.eq('is_favourite', true);
  if (search)     query = query.textSearch(
    'plan_text',
    search,
    { type: 'plain', config: 'simple' }
  );

  const { data, error, count } = await query;

  if (error) {
    console.error('[GET /api/plans]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans: data, total: count, page, limit });
}

// ── POST: save a generated plan ───────────────────────────────────────────────

const SaveSchema = z.object({
  language:           z.enum(['bosnian', 'german', 'english']),
  subject:            z.string().min(1).max(100),
  grade:              z.number().int().min(1).max(9),
  topic:              z.string().min(1).max(200),
  duration_min:       z.number().int().min(10).max(240),
  tier:               z.enum(['MICRO', 'STANDARD', 'EXTENDED']),
  prior_knowledge:    z.string().max(500).optional(),
  notes:              z.string().max(500).optional(),
  plan_text:          z.string().min(1),
  inquiry_question:   z.string().nullable().optional(),
  generation_time_ms: z.number().int().optional(),
  gemini_key_index:   z.number().int().min(0).max(7).optional(),
});

export async function POST(req: NextRequest) {
  if (!await validatePinSession(req.cookies.get('pin_session')?.value)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    console.error('[POST /api/plans]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}