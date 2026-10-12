"use client";

import { ModusStage } from "@/components/modus-stage";
import { DispatchColophon } from "@/registry/dispatch-colophon";

export default function DispatchColophonDemo() {
  return (
    <ModusStage caption="Dispatch Colophon" layout="bleed">
      <div className="absolute inset-0">
        <DispatchColophon />
      </div>
    </ModusStage>
  );
}
