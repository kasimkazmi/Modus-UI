"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { KilnButton } from "./kiln-button";

export default function KilnButtonDemo(props: Partial<ComponentProps<typeof KilnButton>>) {
  return (
    <ModusStage caption="Kiln Button" layout="center">
      <KilnButton {...props} />
    </ModusStage>
  );
}
