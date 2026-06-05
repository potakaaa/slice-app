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
            <SliceLogo size={88} />
            <Text style={styles.appName}>SLICE</Text>
            <Text style={styles.tagline}>Reducing your debt{"\n"}one bite at a time.</Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map((item, i) => (
              <View key={i} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Feather name={item.icon} size={18} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.featureText}>{item.text}</Text>
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
    paddingHorizontal: 32,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    paddingTop: 16,
    gap: 14,
  },
  appName: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 26,
  },
  features: { gap: 14 },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
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
