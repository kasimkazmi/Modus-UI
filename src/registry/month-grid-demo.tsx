"use client";

import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { MonthGrid } from "./month-grid";
import { NativeStage } from "./native-stage";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function MonthGridDemo() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`);
  const [selected, setSelected] = useState<string | null>(iso(today));
  const marked = useMemo(
    () => [2, 5, 9, 12, 16, 23].map((n) => iso(new Date(today.getFullYear(), today.getMonth(), n))),
    [today],
  );

  const [year, m, day] = (selected ?? "").split("-").map(Number);
  const heading = selected
    ? new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(
        new Date(year, m - 1, day),
      )
    : "No day chosen";
  const busy = selected !== null && marked.includes(selected);

  return (
    <NativeStage height={440}>
      {(c) => (
        <View style={{ flex: 1, padding: 16, gap: 14 }}>
          <MonthGrid
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            marked={marked}
            colors={{
              text: c.foreground,
              mutedText: c.mutedForeground,
              pill: c.primary,
              pillText: c.primaryForeground,
              today: c.primary,
              dot: c.destructive,
            }}
          />
          <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12, gap: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: c.foreground }}>{heading}</Text>
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              {busy
                ? "2 events: Standup at 9:00, dentist at 14:30."
                : "Nothing planned. Days with a dot have events. Swipe to change month."}
            </Text>
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default MonthGridDemo;
