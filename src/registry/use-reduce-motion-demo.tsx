"use client";

import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { useReduceMotion } from "./use-reduce-motion";
import { NativeStage } from "./native-stage";

export function UseReduceMotionDemo() {
  const reduce = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, t]);

  return (
    <NativeStage height={280}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 20, padding: 24 }}>
          <Text style={{ fontSize: 14, color: c.mutedForeground }}>useReduceMotion() returned</Text>
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontSize: 30, fontWeight: "800", color: c.foreground }}
          >
            {String(reduce)}
          </Text>
          <View
            style={{
              height: 40,
              borderRadius: 20,
              backgroundColor: c.muted,
              justifyContent: "center",
            }}
          >
            <Animated.View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.primary,
                marginLeft: 4,
                transform: [
                  { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, 240] }) },
                ],
              }}
            />
          </View>
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            The dot slides back and forth, and stays put when your system asks to reduce motion.
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default UseReduceMotionDemo;
