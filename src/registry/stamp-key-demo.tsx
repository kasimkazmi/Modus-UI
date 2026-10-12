import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { StampKey } from "@/registry/stamp-key";

export default function StampKeyDemo(props: Partial<ComponentProps<typeof StampKey>>) {
  return (
    <ModusStage caption="Stamp Key" layout="bleed">
      <div className="absolute inset-0">
        <StampKey {...props} />
      </div>
    </ModusStage>
  );
}
