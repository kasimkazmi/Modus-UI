"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { PollBars } from "./poll-bars";
import { NativeStage } from "./native-stage";

export function PollBarsDemo() {
  const [selected, setSelected] = useState<string | undefined>();
  const [votes, setVotes] = useState({ ios: 34, android: 29, both: 12 });

  return (
    <NativeStage height={360}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>
            Which phone do you use?
          </Text>
          <PollBars
            selected={selected}
            onVote={(id) => {
              setSelected(id);
              setVotes((now) => ({ ...now, [id]: now[id as keyof typeof now] + 1 }));
            }}
            options={[
              { id: "ios", label: "iPhone", votes: votes.ios },
              { id: "android", label: "Android", votes: votes.android },
              { id: "both", label: "Both", votes: votes.both },
            ]}
            colors={{
              bar: c.muted,
              chosenBar: c.primary,
              surface: c.card,
              border: c.border,
              text: c.foreground,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default PollBarsDemo;
