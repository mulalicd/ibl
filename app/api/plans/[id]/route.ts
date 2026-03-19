import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { supabaseAdmin }             from '@/lib/supabase';
import { validatePinSession }        from '@/lib/pin';

export const runtime = 'nodejs';

type Params = { params: { id: string } };

// ── GET: single plan ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  if (!await validatePinSession(req.cookies.get('pin_session')?.value)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// ── PATCH: toggle is_favourite ────────────────────────────────────────────────

const PatchSchema = z.object({
  is_favourite: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await validatePinSession(req.cookies.get('pin_session')?.value)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('plans')
    .update({ is_favourite: parsed.data.is_favourite })
    .eq('id', params.id)
    .eq('is_deleted', false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── DELETE: soft delete ───────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await validatePinSession(req.cookies.get('pin_session')?.value)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('plans')
    .update({ is_deleted: true })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}