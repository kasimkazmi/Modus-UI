"use client";

import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StoryBars } from "./story-bars";
import { NativeStage } from "./native-stage";

const STORIES = [
  { hue: 205, title: "Morning at the harbour", body: "The first ferry leaves at 6:40." },
  { hue: 28, title: "Fresh from the oven", body: "Cardamom buns, still warm." },
  { hue: 340, title: "Market day", body: "Peonies are in season." },
  { hue: 150, title: "The long way home", body: "Ten kilometres along the shore." },
];

export function StoryBarsDemo() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holding = useRef(false);

  const story = STORIES[index];
  const go = (next: number) => {
    setDone(false);
    setIndex(Math.max(0, Math.min(STORIES.length - 1, next)));
  };

  return (
    <NativeStage height={520}>
      {() => (
        <View style={{ flex: 1, backgroundColor: `hsl(${story.hue} 55% 38%)`, padding: 14 }}>
          <StoryBars
            count={STORIES.length}
            index={index}
            paused={paused || done}
            duration={3500}
            onIndexChange={go}
            onComplete={() => setDone(true)}
          />
          <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 30, gap: 6 }}>
            <Text style={{ fontSize: 30, fontWeight: "800", color: "#ffffff" }}>
              {done ? "That was the last one" : story.title}
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
              {done ? "Tap to start again." : paused ? "Paused while you hold" : story.body}
            </Text>
          </View>
          <View
            style={{
              position: "absolute",
              top: 30,
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: "row",
            }}
          >
            {(["Previous story", "Next story"] as const).map((label, i) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPressIn={() => {
                  holding.current = false;
                  hold.current = setTimeout(() => {
                    holding.current = true;
                    setPaused(true);
                  }, 220);
                }}
                onPressOut={() => {
                  if (hold.current) clearTimeout(hold.current);
                  setPaused(false);
                }}
                onPress={() => {
                  if (holding.current) return;
                  if (done) return go(0);
                  go(index + (i === 0 ? -1 : 1));
                }}
                style={{ flex: i === 0 ? 1 : 2 }}
              />
            ))}
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default StoryBarsDemo;
