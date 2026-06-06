import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gbfjkjtcjtbuwdvsscpy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_placeholder";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
