import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('pin_session')?.value;

  if (token) {
    await supabaseAdmin
      .from('pin_sessions')
      .delete()
      .eq('session_token', token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('pin_session');
  return response;
}
