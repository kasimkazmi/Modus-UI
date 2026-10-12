"use client";

import type { ComponentProps } from "react";
import { DiagnosticsPanel } from "./diagnostics-panel";

export default function DiagnosticsPanelDemo(
  props: Partial<ComponentProps<typeof DiagnosticsPanel>>,
) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-[#020804]">
      <DiagnosticsPanel {...props} />
    </div>
  );
}
