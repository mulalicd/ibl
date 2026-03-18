import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.SUPABASE_URL!;
const supabaseAnon    = process.env.SUPABASE_ANON_KEY!;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side admin client — use ONLY in API routes and middleware.
// Has full database access. NEVER import this in client components.
export const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
  auth: { persistSession: false },
});

// Browser-safe client — uses anon key with row-level security.
// Safe to import in client components.
export const supabaseClient = createClient(supabaseUrl, supabaseAnon);
