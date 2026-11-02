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

const BEZEL = 10;
const SCREEN_WIDTH = 360;
const STATUS_HEIGHT = 48;
const HOME_HEIGHT = 26;

/** Signal strength, drawn as four rising bars. */
function SignalBars({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 11 }}>
      {[4, 6, 8.5, 11].map((height) => (
        <View key={height} style={{ width: 3, height, borderRadius: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

/** A battery outline with a full charge and the small nub on its right. */
function Battery({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 24,
          height: 12,
          borderRadius: 3.5,
          borderWidth: 1,
          borderColor: color,
          padding: 1.5,
          opacity: 0.9,
        }}
      >
        <View style={{ flex: 1, borderRadius: 1.5, backgroundColor: color }} />
      </View>
      <View
        style={{
          width: 2,
          height: 5,
          borderTopRightRadius: 1,
          borderBottomRightRadius: 1,
          backgroundColor: color,
          opacity: 0.6,
        }}
      />
    </View>
  );
}

/**
 * A phone for previewing React Native components on the docs site: a bezel with side buttons, a
 * Dynamic Island, a status bar, the screen, and a home indicator. `height` is the height of the
 * screen area the component gets, between the status bar and the home indicator. Children render
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
  const ink = colors?.foreground ?? "transparent";

  return (
    <View
      style={{
        width: SCREEN_WIDTH + BEZEL * 2,
        maxWidth: "100%",
        marginVertical: 24,
        padding: BEZEL,
        borderRadius: 54,
        backgroundColor: "#0b0b0d",
        borderWidth: 1,
        borderColor: "#2c2c31",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.04)",
      }}
    >
      {/* Side buttons: action and volume on the left, power on the right. */}
      {[
        { side: "left", top: 96, height: 28 },
        { side: "left", top: 150, height: 52 },
        { side: "left", top: 214, height: 52 },
        { side: "right", top: 170, height: 84 },
      ].map(({ side, top, height: buttonHeight }) => (
        <View
          key={`${side}-${top}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            top,
            height: buttonHeight,
            width: 3,
            [side]: -3,
            borderTopLeftRadius: side === "left" ? 2 : 0,
            borderBottomLeftRadius: side === "left" ? 2 : 0,
            borderTopRightRadius: side === "right" ? 2 : 0,
            borderBottomRightRadius: side === "right" ? 2 : 0,
            backgroundColor: "#1c1c20",
          }}
        />
      ))}
      <View
        style={{
          borderRadius: 44,
          overflow: "hidden",
          backgroundColor: colors?.background ?? "transparent",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            height: STATUS_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 30,
            paddingTop: 6,
          }}
        >
          <Text style={{ width: 70, fontSize: 15, fontWeight: "600", color: ink }}>9:41</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              width: 70,
              justifyContent: "flex-end",
            }}
          >
            <SignalBars color={ink} />
            <Battery color={ink} />
          </View>
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 11,
            alignSelf: "center",
            width: 108,
            height: 31,
            borderRadius: 16,
            backgroundColor: "#000000",
          }}
        />
        <View style={{ height }}>
          {colors ? (
            children(colors)
          ) : (
            <Text accessibilityElementsHidden style={{ opacity: 0 }}>
              Loading
            </Text>
          )}
        </View>
        <View
          pointerEvents="none"
          style={{ height: HOME_HEIGHT, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{ width: 120, height: 5, borderRadius: 3, backgroundColor: ink, opacity: 0.85 }}
          />
        </View>
      </View>
    </View>
  );
}
