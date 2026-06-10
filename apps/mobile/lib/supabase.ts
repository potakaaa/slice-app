import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

// Expo only inlines public variables when they use direct member access.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabasePublicConfig() {
  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error(
      "Missing Supabase public URL and publishable or anon key for the mobile app",
    );
  }

  return {
    url: supabaseUrl,
    anonKey: supabasePublicKey,
    functionsUrl: `${supabaseUrl.replace(/\/$/, "")}/functions/v1`,
  };
}

export type AccessTokenProvider = () => Promise<string | null | undefined>;

const config = getSupabasePublicConfig();

export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export async function getCurrentAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
