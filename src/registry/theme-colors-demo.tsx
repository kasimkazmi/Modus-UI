"use client";

import { Text, View } from "react-native";
import { darkColors, lightColors, withAlpha, type ThemeColors } from "./theme-colors";
import { NativeStage } from "./native-stage";

function Palette({ title, colors, ink }: { title: string; colors: ThemeColors; ink: string }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: ink }}>{title}</Text>
      {(Object.keys(colors) as (keyof ThemeColors)[]).map((name) => (
        <View key={name} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              backgroundColor: colors[name],
              borderWidth: 1,
              borderColor: withAlpha("#808080", 0.4),
            }}
          />
          <Text style={{ fontSize: 11, color: ink }}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

export function ThemeColorsDemo() {
  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", padding: 18, gap: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>Colors</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Palette title="lightColors" colors={lightColors} ink={c.foreground} />
            <Palette title="darkColors" colors={darkColors} ink={c.foreground} />
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[1, 0.7, 0.4, 0.15].map((a) => (
              <View
                key={a}
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: withAlpha(lightColors.primary, a),
                }}
              />
            ))}
          </View>
          <Text style={{ fontSize: 12, color: c.mutedForeground }}>
            withAlpha(primary, 1 → 0.15)
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default ThemeColorsDemo;
