"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";

/** Site theme tokens as CSS colours, for the React Native demos (which take colours as props). */
export interface StageColors {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  border: string;
  destructive: string;
}

const TOKENS: Record<keyof StageColors, string> = {
  background: "--background",
  card: "--card",
  foreground: "--foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  border: "--border",
  destructive: "--destructive",
};

function read(): StageColors {
  const style = getComputedStyle(document.documentElement);
  const color = (name: string) => `hsl(${style.getPropertyValue(name).trim()})`;
  return Object.fromEntries(
    Object.entries(TOKENS).map(([key, name]) => [key, color(name)]),
  ) as unknown as StageColors;
}

/** Resolves the site's theme tokens and follows light/dark and palette changes. */
export function useStageColors(): StageColors | null {
  const [colors, setColors] = useState<StageColors | null>(null);
  useEffect(() => {
    setColors(read());
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette"],
    });
    return () => observer.disconnect();
  }, []);
  return colors;
}

/**
 * A phone-sized screen for previewing React Native components on the docs site. Children render
 * inside a real react-native-web tree, so layout, gestures and animation are the component's own.
 */
export function NativeStage({
  children,
  height = 520,
}: {
  children: (colors: StageColors) => ReactNode;
  height?: number;
}) {
  const colors = useStageColors();
  return (
    <View
      style={{
        width: 360,
        marginVertical: 24,
        maxWidth: "100%",
        height,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors?.border ?? "transparent",
        backgroundColor: colors?.background ?? "transparent",
        overflow: "hidden",
      }}
    >
      {colors ? (
        children(colors)
      ) : (
        <Text accessibilityElementsHidden style={{ opacity: 0 }}>
          Loading
        </Text>
      )}
    </View>
  );
}
