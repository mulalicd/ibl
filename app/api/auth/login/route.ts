import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { SESSION_DURATION_MS } from '@/lib/constants';
import { z } from 'zod';

const LoginSchema = z.object({
  pin: z.string().min(4).max(8).regex(/^\d+$/, 'PIN must be numeric'),
});

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const salt = process.env.PIN_SESSION_SECRET!;
  const inputHash = createHash('sha256')
    .update(parsed.data.pin + salt)
    .digest('hex');
  const correctHash = createHash('sha256')
    .update(process.env.APP_PIN! + salt)
    .digest('hex');

  if (inputHash !== correctHash) {
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.json(
      { error: 'INVALID_PIN', message: 'Pogrešan PIN.' },
      { status: 401 }
    );
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const { error } = await supabaseAdmin
    .from('pin_sessions')
    .insert({ session_token: token, expires_at: expiresAt.toISOString() });

  if (error) {
    return NextResponse.json(
      { error: 'SESSION_CREATE_FAILED' },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('pin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return response;
}
