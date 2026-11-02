"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ChoiceChips } from "./choice-chips";
import { NativeStage } from "./native-stage";

const DIETS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten free" },
  { value: "dairy-free", label: "Dairy free" },
  { value: "nut-free", label: "Nut free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
];

const SLOTS = [
  { value: "morning", label: "8 to 10" },
  { value: "midday", label: "12 to 2" },
  { value: "evening", label: "5 to 7" },
];

export function ChoiceChipsDemo() {
  const [diets, setDiets] = useState<string[]>(["vegetarian"]);
  const [slot, setSlot] = useState<string[]>(["midday"]);

  return (
    <NativeStage height={520}>
      {(c) => {
        const colors = {
          chip: c.card,
          selectedChip: c.primary,
          text: c.foreground,
          selectedText: c.primaryForeground,
          border: c.border,
        };
        return (
          <View style={{ flex: 1, padding: 20, gap: 22 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Your order</Text>
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Dietary needs (up to 3)
              </Text>
              <ChoiceChips
                multiple
                max={3}
                options={DIETS}
                value={diets}
                onChange={setDiets}
                colors={colors}
              />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                {diets.length === 0 ? "None selected" : `${diets.length} selected`}
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Delivery window
              </Text>
              <ChoiceChips
                min={1}
                options={SLOTS}
                value={slot}
                onChange={setSlot}
                colors={colors}
              />
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default ChoiceChipsDemo;
