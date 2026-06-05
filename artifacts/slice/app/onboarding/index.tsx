import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { SliceLogo } from "@/components/SliceLogo";
import { useColors } from "@/hooks/useColors";

const { height } = Dimensions.get("window");

export default function OnboardingWelcome() {
  const colors = useColors();
  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF6B35", "#FF8C5A", "#FFB088"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      <SafeAreaView style={[styles.safe, { paddingTop: topPad }]}>
        <View style={styles.content}>
          <View style={styles.top}>
            <SliceLogo size={100} />
            <Text style={styles.appName}>SLICE</Text>
            <Text style={styles.tagline}>Reducing your debt{"\n"}one bite at a time.</Text>
          </View>

          <View style={styles.features}>
            {[
              { emoji: "📊", text: "Build a customized debt program" },
              { emoji: "🤝", text: "Calculate settlement targets" },
              { emoji: "💰", text: "Plan your monthly savings" },
              { emoji: "📞", text: "Get AI negotiation guidance" },
            ].map((item, i) => (
              <View key={i} style={styles.feature}>
                <View style={styles.featureDot}>
                  <Text style={styles.featureEmoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottom}>
            <Button
              label="Get Started — It's Free"
              onPress={() => router.push("/onboarding/step1")}
              style={styles.cta}
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
    paddingVertical: 20,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    paddingTop: 20,
    gap: 16,
  },
  appName: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 28,
  },
  features: {
    gap: 16,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  bottom: {
    gap: 12,
    paddingBottom: Platform.OS === "web" ? 34 : 0,
  },
  cta: {
    backgroundColor: "#FFFFFF",
  },
  disclaimer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
