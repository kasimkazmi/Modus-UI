"use client";

import { useEffect, useRef, useState, type ElementRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChatBubble, type ChatStatus } from "./chat-bubble";
import { NativeStage } from "./native-stage";

interface Message {
  id: number;
  side: "me" | "them";
  text: string;
  time: string;
  status?: ChatStatus;
}

const START: Message[] = [
  { id: 1, side: "them", text: "Are we still on for Thursday?", time: "9:38" },
  { id: 2, side: "me", text: "Yes! Same place as last time.", time: "9:39", status: "read" },
  { id: 3, side: "them", text: "Perfect. I'll book a table for four.", time: "9:40" },
  { id: 4, side: "them", text: "Should I invite Ines?", time: "9:40" },
];

const REPLIES = ["Sounds great.", "On my way.", "Ha, see you there.", "Booked it."];

export function ChatBubbleDemo() {
  const [messages, setMessages] = useState<Message[]>(START);
  const next = useRef(5);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scroller = useRef<ElementRef<typeof ScrollView>>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    scroller.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const patch = (id: number, status: ChatStatus) =>
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, status } : m)));

  const send = (fail = false) => {
    const id = next.current++;
    const time = `9:${41 + (id % 17)}`;
    setMessages((all) => [
      ...all,
      {
        id,
        side: "me",
        text: fail ? "This one will not go through" : "Yes, invite her!",
        time,
        status: "sending",
      },
    ]);
    if (fail) {
      timers.current.push(setTimeout(() => patch(id, "failed"), 900));
      return;
    }
    timers.current.push(setTimeout(() => patch(id, "sent"), 700));
    timers.current.push(setTimeout(() => patch(id, "delivered"), 1500));
    timers.current.push(setTimeout(() => patch(id, "read"), 2400));
    timers.current.push(
      setTimeout(() => {
        const reply = REPLIES[id % REPLIES.length];
        setMessages((all) => [...all, { id: next.current++, side: "them", text: reply, time }]);
      }, 3000),
    );
  };

  return (
    <NativeStage height={470}>
      {(c) => {
        const colors = {
          mine: c.primary,
          theirs: c.muted,
          mineText: c.primaryForeground,
          theirsText: c.foreground,
          meta: c.mutedForeground,
        };
        const button = (label: string, onPress: () => void) => (
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.muted,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: c.foreground }}>{label}</Text>
          </Pressable>
        );
        return (
          <View style={{ flex: 1 }}>
            <ScrollView ref={scroller} contentContainerStyle={{ paddingVertical: 12 }}>
              {messages.map((m, i) => {
                const last = messages[i + 1]?.side !== m.side;
                return (
                  <ChatBubble
                    key={m.id}
                    side={m.side}
                    text={m.text}
                    time={m.time}
                    status={m.status}
                    name={m.side === "them" ? "Maya" : undefined}
                    tail={last}
                    animateIn={i >= START.length}
                    onRetry={() => {
                      patch(m.id, "sending");
                      timers.current.push(setTimeout(() => patch(m.id, "sent"), 800));
                    }}
                    colors={colors}
                  />
                );
              })}
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                padding: 10,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              {button("Send", () => send(false))}
              {button("Send (fails)", () => send(true))}
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default ChatBubbleDemo;
