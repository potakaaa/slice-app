import React from "react";
import { Image, View } from "react-native";

interface SliceLogoProps {
  /** Outer badge dimension in px. */
  size?: number;
  /** Render just the mark with no white badge background. */
  bare?: boolean;
}

export function SliceLogo({ size = 64, bare = false }: SliceLogoProps) {
  const mark = (
    <Image
      source={require("../assets/logo/slice-logo-mark-512.png")}
      style={{ width: bare ? size : size * 0.74, height: bare ? size : size * 0.74 }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="SLICE logo"
    />
  );

  if (bare) return mark;

  // Rounded, bordered white badge matching the app icon.
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2237,
        backgroundColor: "#FFFFFF",
        borderWidth: Math.max(1, size * 0.012),
        borderColor: "#E5E5E5",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {mark}
    </View>
  );
}
