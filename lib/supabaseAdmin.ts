import { createClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key and must only ever be
// imported from server-side code (API routes). Never import this
// file from a "use client" component.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: { persistSession: false },
  }
);
