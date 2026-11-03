"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { TaskChecklist } from "./task-checklist";
import { NativeStage } from "./native-stage";

const TASKS = [
  { id: "profile", label: "Add a profile photo" },
  { id: "verify", label: "Verify your email" },
  { id: "invite", label: "Invite a teammate" },
  { id: "first", label: "Create your first project" },
];

export function TaskChecklistDemo() {
  const [done, setDone] = useState<string[]>(["verify"]);

  return (
    <NativeStage height={380}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: c.foreground }}>Get started</Text>
          <TaskChecklist
            items={TASKS}
            value={done}
            onChange={setDone}
            colors={{
              accent: c.primary,
              text: c.foreground,
              done: c.mutedForeground,
              track: c.muted,
              border: c.border,
            }}
          />
        </View>
      )}
    </NativeStage>
  );
}

export default TaskChecklistDemo;
