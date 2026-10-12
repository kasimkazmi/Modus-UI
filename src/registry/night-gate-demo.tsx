import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { NightGate } from "@/registry/night-gate";

export default function NightGateDemo(props: Partial<ComponentProps<typeof NightGate>>) {
  return (
    <ModusStage caption="Night Gate" layout="bleed">
      <div className="absolute inset-0">
        <NightGate {...props} />
      </div>
    </ModusStage>
  );
}
