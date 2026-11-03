"use client";

import { Text, View } from "react-native";
import { ExpandableText } from "./expandable-text";
import { NativeStage } from "./native-stage";

const BIO =
  "Maya is a product designer who spends her days turning messy ideas into calm, usable screens. She has shipped onboarding flows for banking apps, a meditation timer used by a few hundred thousand people, and a recipe tool that her own family relies on every Sunday. Outside of work she climbs, bakes bread badly and reads far too many newsletters.";

export function ExpandableTextDemo() {
  return (
    <NativeStage height={340}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 10, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>About Maya</Text>
          <ExpandableText text={BIO} colors={{ text: c.mutedForeground, link: c.primary }} />
          <ExpandableText
            text="Short bios never show a link."
            colors={{ text: c.mutedForeground, link: c.primary }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default ExpandableTextDemo;
