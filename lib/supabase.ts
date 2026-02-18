import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = Boolean(supabaseUrl && supabaseAnon);
export const hasSupabaseAdmin = Boolean(supabaseUrl && supabaseServiceRole);

export const supabase = hasSupabase
  ? createClient(supabaseUrl!, supabaseAnon!, {
      auth: {
        persistSession: false
      }
    })
  : null;

export const supabaseAdmin = hasSupabaseAdmin
  ? createClient(supabaseUrl!, supabaseServiceRole!, {
      auth: {
        persistSession: false
      }
    })
  : null;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
