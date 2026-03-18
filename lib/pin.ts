import { supabaseAdmin } from './supabase';

export async function validatePinSession(
  token: string | undefined
): Promise<boolean> {
  // Reject immediately if token is missing or wrong length
  // 32 random bytes = 64 hex characters
  if (!token || token.length !== 64) return false;

  const { data, error } = await supabaseAdmin
    .from('pin_sessions')
    .select('expires_at')
    .eq('session_token', token)
    .maybeSingle();

  if (error || !data) return false;

  // Check expiry server-side — never trust client-side expiry
  return new Date(data.expires_at) > new Date();
}
