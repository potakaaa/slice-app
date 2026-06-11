import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { SliceLogo } from "@/components/SliceLogo";
import { useAppStore } from "@/store/useAppStore";

const FEATURES: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  { icon: "bar-chart-2", text: "Build a customized debt program" },
  { icon: "percent", text: "Calculate settlement targets" },
  { icon: "trending-up", text: "Create a monthly budget" },
];

export default function OnboardingWelcome() {
  const topPad = Platform.OS === "web" ? 67 : 0;
  const markOnboardingSeen = useAppStore((s) => s.markOnboardingSeen);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF5A00", "#FF8A00"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={[styles.safe, { paddingTop: topPad }]}>
        <View style={styles.content}>
          <View style={styles.top}>
            <SliceLogo size={80} />
            <Text style={styles.appName}>SLICE</Text>
            <Text style={styles.tagline}>Reducing your debt{"\n"}one bite at a time.</Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map((item, i) => (
              <View key={i} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Feather name={item.icon} size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.bottom, { paddingBottom: Platform.OS === "web" ? 34 : 0 }]}>
            <Button
              label="Get Started — It's Free"
              onPress={() => {
                markOnboardingSeen();
                router.push("/auth?mode=signup");
              }}
              style={styles.cta}
              textColor="#FF5A00"
              fullWidth
            />
            <Text style={styles.disclaimer}>
              No credit card required. Your program is stored securely in your SLICE account.
            </Text>
            <Pressable
              onPress={() => {
                markOnboardingSeen();
                router.push("/auth");
              }}
              hitSlop={8}
              style={styles.loginRow}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    paddingTop: 8,
    gap: 12,
  },
  appName: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 25,
  },
  features: { gap: 12 },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    flexShrink: 1,
  },
  bottom: { gap: 12 },
  cta: { backgroundColor: "#FFFFFF" },
  disclaimer: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  loginRow: { alignItems: "center", paddingTop: 2 },
  loginText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  loginLink: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textDecorationLine: "underline",
  },
});
