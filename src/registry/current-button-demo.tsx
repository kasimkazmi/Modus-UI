"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { CurrentButton } from "./current-button";

export default function CurrentButtonDemo(props: Partial<ComponentProps<typeof CurrentButton>>) {
  return (
    <ModusStage caption="Current Button" layout="bleed">
      <CurrentButton {...props} />
    </ModusStage>
  );
}
