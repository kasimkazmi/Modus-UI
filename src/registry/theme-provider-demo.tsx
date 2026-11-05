"use client";

import { Pressable, Text, View } from "react-native";
import { ThemeProvider, useTheme } from "./theme-provider";
import { ModeProvider, useMode } from "./mode-provider";
import { NativeStage } from "./native-stage";

function Card() {
  const { colors } = useTheme();
  const { toggle, scheme } = useMode();

  return (
    <View
      style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: colors.background }}
    >
      <View
        style={{
          padding: 18,
          borderRadius: 18,
          gap: 10,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
          Themed card
        </Text>
        <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
          Every colour here comes from useTheme(), not from the card itself.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${scheme === "dark" ? "light" : "dark"}`}
          onPress={toggle}
          style={{
            alignSelf: "flex-start",
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ fontWeight: "700", color: colors.primaryForeground }}>
            Switch to {scheme === "dark" ? "light" : "dark"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Themed() {
  const { scheme } = useMode();
  return (
    <ThemeProvider
      scheme={scheme}
      colors={{ light: { primary: "#0d9488" }, dark: { primary: "#2dd4bf" } }}
    >
      <Card />
    </ThemeProvider>
  );
}

export function ThemeProviderDemo() {
  return (
    <NativeStage height={320}>
      {() => (
        <ModeProvider initialMode="light">
          <Themed />
        </ModeProvider>
      )}
    </NativeStage>
  );
}

export default ThemeProviderDemo;
