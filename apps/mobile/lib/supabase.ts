const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabasePublicConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    functionsUrl: `${supabaseUrl.replace(/\/$/, "")}/functions/v1`,
  };
}

export type AccessTokenProvider = () => Promise<string | null | undefined>;
