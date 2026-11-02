"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { IntroPager } from "./intro-pager";
import { NativeStage, type StageColors } from "./native-stage";

function Art({ hue, shape }: { hue: number; shape: "rings" | "stack" | "burst" }) {
  const tone = (lightness: number, alpha = 1) => `hsl(${hue} 60% ${lightness}% / ${alpha})`;
  if (shape === "rings") {
    return (
      <View style={{ width: 190, height: 190, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            position: "absolute",
            width: 190,
            height: 190,
            borderRadius: 95,
            backgroundColor: tone(86),
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: tone(72),
          }}
        />
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: tone(50) }} />
      </View>
    );
  }
  if (shape === "stack") {
    return (
      <View style={{ width: 190, height: 190 }}>
        {[0, 1, 2].map((n) => (
          <View
            key={n}
            style={{
              position: "absolute",
              left: n * 14,
              top: 70 - n * 26,
              width: 150,
              height: 96,
              borderRadius: 20,
              backgroundColor: tone(80 - n * 14),
            }}
          />
        ))}
      </View>
    );
  }
  return (
    <View style={{ width: 190, height: 190 }}>
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <View
          key={n}
          style={{
            position: "absolute",
            left: 85,
            top: 20,
            width: 20,
            height: 70,
            borderRadius: 10,
            backgroundColor: tone(52 + n * 5),
            transform: [{ translateY: 55 }, { rotate: `${n * 60}deg` }, { translateY: -55 }],
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          left: 70,
          top: 70,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: tone(42),
        }}
      />
    </View>
  );
}

function pages() {
  return [
    {
      id: "plan",
      title: "Plan the week",
      description: "Drop tasks onto the days they belong to and see the whole week at a glance.",
      art: <Art hue={205} shape="rings" />,
    },
    {
      id: "focus",
      title: "Stay in focus",
      description: "One card at a time. Finish it, swipe it away, and the next one slides up.",
      art: <Art hue={340} shape="stack" />,
    },
    {
      id: "grow",
      title: "Watch it add up",
      description: "Small wins collect into streaks you can look back on every Sunday.",
      art: <Art hue={32} shape="burst" />,
    },
  ];
}

function Pager({ c, onDone }: { c: StageColors; onDone: () => void }) {
  return (
    <IntroPager
      pages={pages()}
      onDone={onDone}
      colors={{
        background: c.background,
        title: c.foreground,
        text: c.mutedForeground,
        dot: c.border,
        activeDot: c.primary,
        button: c.primary,
        buttonText: c.primaryForeground,
      }}
    />
  );
}

export function IntroPagerDemo() {
  const [done, setDone] = useState(false);

  return (
    <NativeStage height={560}>
      {(c) =>
        done ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>
              You are all set
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDone(false)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: c.primary,
              }}
            >
              <Text style={{ fontWeight: "600", color: c.primaryForeground }}>Replay intro</Text>
            </Pressable>
          </View>
        ) : (
          <Pager c={c} onDone={() => setDone(true)} />
        )
      }
    </NativeStage>
  );
}

export default IntroPagerDemo;
