"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { ExpandSearch } from "./expand-search";
import { NativeStage } from "./native-stage";

const PEOPLE = [
  { name: "Amara Okafor", role: "Product design" },
  { name: "Bram de Vries", role: "iOS engineer" },
  { name: "Carmen Ortiz", role: "Research" },
  { name: "Dev Patel", role: "Data" },
  { name: "Elif Demir", role: "Android engineer" },
  { name: "Farah Haddad", role: "Support" },
  { name: "Goran Petrov", role: "Marketing" },
];

export function ExpandSearchDemo() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const matches = PEOPLE.filter((person) =>
    person.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <NativeStage height={520}>
      {(c) => (
        <View style={{ flex: 1, padding: 20, gap: 14 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: c.foreground }}>People</Text>
          <ExpandSearch
            value={query}
            onChangeText={setQuery}
            onSubmit={setSubmitted}
            placeholder="Search people"
            colors={{
              field: c.muted,
              icon: c.foreground,
              text: c.foreground,
              placeholder: c.mutedForeground,
            }}
          />
          <View style={{ flex: 1 }}>
            {matches.map((person) => (
              <View
                key={person.name}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground }}>
                  {person.name}
                </Text>
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>{person.role}</Text>
              </View>
            ))}
            {matches.length === 0 ? (
              <Text style={{ paddingVertical: 24, textAlign: "center", color: c.mutedForeground }}>
                No one matches “{query}”.
              </Text>
            ) : null}
          </View>
          {submitted ? (
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>Last search: {submitted}</Text>
          ) : null}
        </View>
      )}
    </NativeStage>
  );
}

export default ExpandSearchDemo;
