"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { RadioGroup } from "./radio-group";
import { NativeStage } from "./native-stage";

const PLANS = [
  { value: "free", label: "Free", description: "One project, community support" },
  { value: "pro", label: "Pro", description: "Unlimited projects, priority support" },
  { value: "team", label: "Team", description: "Shared workspaces and roles" },
  { value: "enterprise", label: "Enterprise", description: "Contact sales", disabled: true },
];

export function RadioGroupDemo() {
  const [plan, setPlan] = useState("pro");

  return (
    <NativeStage height={460}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>
            Choose a plan
          </Text>
          <RadioGroup
            label="Plan"
            options={PLANS}
            value={plan}
            onChange={setPlan}
            colors={{
              accent: c.primary,
              border: c.border,
              surface: c.card,
              selectedSurface: c.muted,
              label: c.foreground,
              description: c.mutedForeground,
            }}
          />
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, color: c.mutedForeground }}>
            Selected: {plan}
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default RadioGroupDemo;
