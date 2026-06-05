import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";

interface SliceLogoProps {
  size?: number;
}

export function SliceLogo({ size = 64 }: SliceLogoProps) {
  const r = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <Circle cx="50" cy="50" r="48" fill="#FF6B35" />
        {/* Orange segments (simplified citrus cross-section) */}
        <G opacity="0.3">
          <Path d="M50 10 L50 50" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M10 50 L50 50" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M22 22 L50 50" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M78 22 L50 50" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M22 78 L50 50" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M78 78 L50 50" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M90 50 L50 50" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M50 90 L50 50" stroke="#FFFFFF" strokeWidth="2" />
        </G>
        {/* Inner white circle */}
        <Circle cx="50" cy="50" r="18" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
        {/* Bite taken out - white ellipse top-right */}
        <Circle cx="82" cy="18" r="18" fill="#FFFFFF" />
        {/* White border ring */}
        <Circle cx="50" cy="50" r="48" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.3" />
      </Svg>
    </View>
  );
}
