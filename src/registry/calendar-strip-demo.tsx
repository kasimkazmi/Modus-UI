"use client";

import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { CalendarStrip } from "./calendar-strip";
import { NativeStage } from "./native-stage";

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const PLANS = [
  { time: "9:00", title: "Standup with design", place: "Room 4" },
  { time: "11:30", title: "Dentist", place: "Linden Street" },
  { time: "14:00", title: "Contract review", place: "Video call" },
  { time: "18:30", title: "Climbing", place: "The Wall" },
];

/** The local date `days` after `from`, as YYYY-MM-DD. */
const shift = (from: Date, days: number) =>
  toISO(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));

export function CalendarStripDemo() {
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(() => shift(today, 0));
  const marked = useMemo(() => [1, 2, 4, 5, 9, 12].map((days) => shift(today, days)), [today]);

  const [year, month, day] = selected.split("-").map(Number);
  const heading = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
  const busy = marked.includes(selected);

  return (
    <NativeStage height={400}>
      {(c) => (
        <View style={{ flex: 1, paddingTop: 8 }}>
          <Text
            style={{ paddingHorizontal: 20, fontSize: 24, fontWeight: "700", color: c.foreground }}
          >
            Schedule
          </Text>
          <Text
            style={{
              paddingHorizontal: 20,
              marginTop: 2,
              marginBottom: 14,
              fontSize: 14,
              color: c.mutedForeground,
            }}
          >
            {heading}
          </Text>
          <CalendarStrip
            selected={selected}
            onSelect={setSelected}
            marked={marked}
            days={28}
            colors={{
              pill: c.primary,
              text: c.foreground,
              selectedText: c.primaryForeground,
              mutedText: c.mutedForeground,
              dot: c.destructive,
            }}
          />
          <View style={{ padding: 20, gap: 12 }}>
            {busy ? (
              PLANS.map((plan) => (
                <View
                  key={plan.time}
                  style={{
                    flexDirection: "row",
                    gap: 14,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  }}
                >
                  <Text style={{ width: 48, fontSize: 14, fontWeight: "600", color: c.primary }}>
                    {plan.time}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: c.foreground }}>
                      {plan.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: c.mutedForeground }}>{plan.place}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 14, color: c.mutedForeground }}>
                Nothing planned. Days with a dot have events.
              </Text>
            )}
          </View>
        </View>
      )}
    </NativeStage>
  );
}

export default CalendarStripDemo;
