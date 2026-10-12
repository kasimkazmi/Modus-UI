import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { PrismFlowButton } from "@/registry/prism-flow-button";

export default function PrismFlowButtonDemo(
  props: Partial<ComponentProps<typeof PrismFlowButton>>,
) {
  return (
    <ModusStage caption="Prism Flow Button" layout="bleed">
      <div className="absolute inset-0">
        <PrismFlowButton {...props} />
      </div>
    </ModusStage>
  );
}
