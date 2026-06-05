import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { SliceLogo } from "@/components/SliceLogo";

const FEATURES: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  { icon: "bar-chart-2", text: "Build a customized debt program" },
  { icon: "percent", text: "Calculate settlement targets" },
  { icon: "trending-up", text: "Plan your monthly savings" },
  { icon: "phone", text: "Get AI negotiation guidance" },
];

export default function OnboardingWelcome() {
  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF6B35", "#FF8055"]}
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

          <View style={styles.spacer} />

          <View style={styles.features}>
            {FEATURES.map((item, i) => (
              <View key={i} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Feather name={item.icon} size={16} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.featureText} numberOfLines={1}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.bottom, { paddingBottom: Platform.OS === "web" ? 34 : 0 }]}>
            <Button
              label="Get Started — It's Free"
              onPress={() => router.push("/onboarding/step1")}
              style={styles.cta}
              textColor="#FF6B35"
              fullWidth
            />
            <Text style={styles.disclaimer}>
              No credit card required. Your data stays on your device.
            </Text>
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
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 25,
  },
  spacer: { flex: 1, minHeight: 24, maxHeight: 56 },
  features: { gap: 12, marginBottom: 28 },
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
    fontFamily: "Inter_500Medium",
    flex: 1,
    flexShrink: 1,
  },
  bottom: { gap: 12 },
  cta: { backgroundColor: "#FFFFFF" },
  disclaimer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
