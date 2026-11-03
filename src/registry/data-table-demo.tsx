"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { DataTable } from "./data-table";
import { NativeStage } from "./native-stage";

interface Order {
  id: string;
  customer: string;
  status: string;
  total: number;
}

const ORDERS: Order[] = [
  { id: "A-1042", customer: "Maya Lopez", status: "Shipped", total: 84.5 },
  { id: "A-1043", customer: "Jon Park", status: "Pending", total: 19 },
  { id: "A-1044", customer: "Sara Khan", status: "Delivered", total: 132.25 },
  { id: "A-1045", customer: "Leo Brandt", status: "Pending", total: 47.9 },
  { id: "A-1046", customer: "Ana Silva", status: "Shipped", total: 60 },
  { id: "A-1047", customer: "Omar Aziz", status: "Delivered", total: 215.4 },
];

export function DataTableDemo() {
  const [picked, setPicked] = useState("Tap a row");

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 14, padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>Orders</Text>
          <DataTable
            rows={ORDERS}
            rowKey={(row) => row.id}
            initialSort={{ key: "total", direction: "desc" }}
            onRowPress={(row) => setPicked(`${row.id} · ${row.customer}`)}
            maxHeight={240}
            colors={{
              header: c.muted,
              headerText: c.mutedForeground,
              text: c.foreground,
              border: c.border,
              stripe: c.muted,
              background: c.card,
            }}
            columns={[
              { key: "id", title: "Order", width: 90, sortable: true },
              { key: "customer", title: "Customer", width: 140, sortable: true },
              { key: "status", title: "Status", width: 110, sortable: true },
              {
                key: "total",
                title: "Total",
                width: 100,
                align: "right",
                sortable: true,
                render: (row) => (
                  <Text style={{ fontSize: 14, textAlign: "right", color: c.foreground }}>
                    ${row.total.toFixed(2)}
                  </Text>
                ),
              },
            ]}
          />
          <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, color: c.mutedForeground }}>
            {picked}
          </Text>
        </View>
      )}
    </NativeStage>
  );
}

export default DataTableDemo;
