import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { InkEndcapButton } from "@/registry/ink-endcap-button";

export default function InkEndcapButtonDemo(
  props: Partial<ComponentProps<typeof InkEndcapButton>>,
) {
  return (
    <ModusStage caption="Ink Endcap Button" layout="center">
      <InkEndcapButton {...props} />
    </ModusStage>
  );
}
