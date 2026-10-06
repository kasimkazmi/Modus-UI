"use client";

import { useState } from "react";
import { LiquidTabs } from "./liquid-tabs";

export default function LiquidTabsDemo() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { label: "Overview", value: "overview" },
    { label: "Integrations", value: "integrations" },
    { label: "Activity", value: "activity" },
    { label: "Settings", value: "settings" },
  ];

  return (
    <div className="relative flex w-full flex-col items-center justify-center min-h-[400px] gap-8 overflow-hidden rounded-xl border border-border bg-background">
      <LiquidTabs 
        items={tabs} 
        value={activeTab} 
        onValueChange={setActiveTab} 
      />
      <div className="p-8 text-center border border-border rounded-xl bg-card shadow-sm w-full max-w-sm">
        <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">Current Tab</p>
        <h3 className="text-2xl font-semibold capitalize text-foreground">{activeTab}</h3>
      </div>
    </div>
  );
}
