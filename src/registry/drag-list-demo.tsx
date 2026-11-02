"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { DragList } from "./drag-list";
import { NativeStage } from "./native-stage";

const INITIAL = [
  { id: "espresso", title: "Espresso", note: "Double shot, no sugar" },
  { id: "croissant", title: "Butter croissant", note: "Warmed" },
  { id: "oat", title: "Oat flat white", note: "Extra hot" },
  { id: "cookie", title: "Brown butter cookie", note: "Take away" },
  { id: "matcha", title: "Iced matcha", note: "Less ice" },
  { id: "banana", title: "Banana bread", note: "Toasted" },
];

export function DragListDemo() {
  const [items, setItems] = useState(INITIAL);
  const [moves, setMoves] = useState(0);

  return (
    <NativeStage height={520}>
      {(c) => (
        <View style={{ flex: 1 }}>
          <View style={{ padding: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Order</Text>
            <Text style={{ marginTop: 2, fontSize: 13, color: c.mutedForeground }}>
              {moves === 0
                ? "Drag the grip to reorder"
                : `${moves} change${moves === 1 ? "" : "s"}`}
            </Text>
          </View>
          <DragList
            data={items}
            keyExtractor={(item) => item.id}
            colors={{ row: c.background, border: c.border, handle: c.mutedForeground }}
            onReorder={(next) => {
              setItems(next);
              setMoves((n) => n + 1);
            }}
            renderItem={(item, { dragging }) => (
              <View style={{ paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
                  {item.title}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 13,
                    color: dragging ? c.primary : c.mutedForeground,
                  }}
                >
                  {item.note}
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default DragListDemo;
