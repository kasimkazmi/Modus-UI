"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DewPane } from "./dew-pane";

export default function DewPaneDemo(props: Partial<ComponentProps<typeof DewPane>>) {
  return (
    <ModusStage caption="Dew Pane" layout="bleed">
      <DewPane {...props} />
    </ModusStage>
  );
}
