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
    <div className="relative flex min-h-[400px] w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-xl border border-border bg-background">
      <LiquidTabs items={tabs} value={activeTab} onValueChange={setActiveTab} />
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">Current Tab</p>
        <h3 className="text-2xl font-semibold capitalize text-foreground">{activeTab}</h3>
      </div>
    </div>
  );
}
