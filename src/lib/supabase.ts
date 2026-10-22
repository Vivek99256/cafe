import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qkpdqpxkbfcrduvdfpbb.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_NovOkiG5sDL9C4bdmuEp3Q_kzV9jYIj";

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
