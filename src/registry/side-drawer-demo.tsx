"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SideDrawer } from "./side-drawer";
import { NativeStage } from "./native-stage";

const MENU = ["Inbox", "Starred", "Sent", "Drafts", "Archive"];
const FILTERS = ["Unread only", "Has attachment", "From today"];

export function SideDrawerDemo() {
  const [menu, setMenu] = useState(false);
  const [filters, setFilters] = useState(false);
  const [page, setPage] = useState("Inbox");

  return (
    <NativeStage height={460}>
      {(c) => {
        const colors = { surface: c.card, border: c.border };
        const bars = (
          <View style={{ gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{ width: 20, height: 2.5, borderRadius: 2, backgroundColor: c.foreground }}
              />
            ))}
          </View>
        );
        return (
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 12,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                onPress={() => setMenu(true)}
                style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              >
                {bars}
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: "700", color: c.foreground }}>{page}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open filters"
                onPress={() => setFilters(true)}
                style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: c.primary }}>Filters</Text>
              </Pressable>
            </View>
            <View style={{ padding: 20, gap: 10 }}>
              <Text style={{ fontSize: 15, color: c.foreground }}>You are looking at {page}.</Text>
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                Swipe in from either edge, or use the buttons. Drag a drawer toward its edge to
                close it.
              </Text>
            </View>
            <SideDrawer
              open={menu}
              onOpen={() => setMenu(true)}
              onClose={() => setMenu(false)}
              label="Menu"
              colors={colors}
            >
              <View style={{ padding: 20, gap: 4 }}>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: c.foreground, marginBottom: 12 }}
                >
                  Mail
                </Text>
                {MENU.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    onPress={() => {
                      setPage(item);
                      setMenu(false);
                    }}
                    style={{
                      minHeight: 44,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      justifyContent: "center",
                      backgroundColor: item === page ? c.muted : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: item === page ? "700" : "500",
                        color: c.foreground,
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SideDrawer>
            <SideDrawer
              open={filters}
              onOpen={() => setFilters(true)}
              onClose={() => setFilters(false)}
              side="right"
              width={240}
              label="Filters"
              colors={colors}
            >
              <View style={{ padding: 20, gap: 12 }}>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: c.foreground, marginBottom: 6 }}
                >
                  Filters
                </Text>
                {FILTERS.map((item) => (
                  <Text key={item} style={{ fontSize: 15, color: c.foreground }}>
                    {item}
                  </Text>
                ))}
              </View>
            </SideDrawer>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default SideDrawerDemo;
