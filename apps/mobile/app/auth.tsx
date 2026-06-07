import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { SliceLogo } from "@/components/SliceLogo";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const colors = useColors();
  const { session, signIn, signUp } = useAuth();
  const draftProfile = useAppStore((state) => state.profile);
  const onboardingReadyForAuth = useAppStore((state) => state.onboardingReadyForAuth);
  const awaitingEmailConfirmation = useAppStore(
    (state) => state.awaitingEmailConfirmation
  );
  const setAwaitingEmailConfirmation = useAppStore(
    (state) => state.setAwaitingEmailConfirmation
  );
  const clearDraft = useAppStore((state) => state.clearDraft);
  const [mode, setMode] = useState<Mode>(
    onboardingReadyForAuth ? "signup" : "signin"
  );
  const [name, setName] = useState(draftProfile.name);
  const [email, setEmail] = useState(draftProfile.email);
  const [password, setPassword] = useState("");
  const [confirmationSignIn, setConfirmationSignIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!name && draftProfile.name) setName(draftProfile.name);
    if (!email && draftProfile.email) setEmail(draftProfile.email);
  }, [draftProfile.email, draftProfile.name, email, name]);

  useEffect(() => {
    if (!session) return;
    if (onboardingReadyForAuth) {
      setAwaitingEmailConfirmation(false);
      router.replace("/onboarding/complete");
    } else if (!onboardingReadyForAuth) {
      router.replace("/");
    }
  }, [
    awaitingEmailConfirmation,
    onboardingReadyForAuth,
    session,
    setAwaitingEmailConfirmation,
  ]);

  const canSubmit =
    email.trim().includes("@") &&
    password.length >= 6 &&
    (mode === "signin" || name.trim().length > 0);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") {
        await signIn(email, password);
        if (onboardingReadyForAuth) {
          setAwaitingEmailConfirmation(false);
          router.replace("/onboarding/complete");
        } else {
          clearDraft();
          router.replace("/");
        }
      } else {
        const nextSession = await signUp(email, password, name);
        if (!nextSession) {
          setAwaitingEmailConfirmation(true);
          return;
        }
        setAwaitingEmailConfirmation(false);
        router.replace("/onboarding/complete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF5A00", "#FF8A00"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={[styles.safe, { paddingTop: topPad }]}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.brand}>
            <SliceLogo size={72} />
            <Text style={styles.appName}>SLICE</Text>
            <Text style={styles.tagline}>Reducing your debt one bite at a time.</Text>
          </View>

          <View style={styles.panel}>
            {awaitingEmailConfirmation && !confirmationSignIn ? (
              <View style={styles.confirmation}>
                <View style={[styles.confirmationIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="mail" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.confirmationTitle, { color: colors.foreground }]}>
                  Check your email
                </Text>
                <Text style={[styles.confirmationText, { color: colors.mutedForeground }]}>
                  Confirm {email || "your email address"}, then return to SLICE. Your program
                  draft will be waiting.
                </Text>
                <Button
                  label="Back to Sign In"
                  variant="secondary"
                  onPress={() => {
                    setConfirmationSignIn(true);
                    setMode("signin");
                    setPassword("");
                  }}
                  fullWidth
                />
              </View>
            ) : (
              <>
            <View style={styles.modeRow}>
              {(["signin", "signup"] as Mode[]).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setMode(item);
                    setError("");
                  }}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor: mode === item ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      { color: mode === item ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {item === "signin" ? "Sign In" : "Create Account"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === "signup" && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                secureTextEntry
              />
            </View>

            {error ? (
              <View style={[styles.error, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="alert-circle" size={15} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <Button
              label={mode === "signin" ? "Sign In" : "Create Account"}
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={loading}
              fullWidth
            />

            <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
              Your program data is stored securely in Supabase under your authenticated account.
            </Text>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  keyboard: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    gap: 20,
  },
  brand: { alignItems: "center", gap: 10, paddingTop: 22 },
  appName: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    gap: 14,
    marginBottom: Platform.OS === "web" ? 34 : 0,
  },
  confirmation: { alignItems: "center", gap: 12, paddingVertical: 8 },
  confirmationIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmationTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  confirmationText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  error: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    padding: 10,
  },
  errorText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  privacy: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    textAlign: "center",
  },
});
