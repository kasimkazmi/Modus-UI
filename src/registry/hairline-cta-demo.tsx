"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { HairlineCta } from "./hairline-cta";

export default function HairlineCtaDemo(props: Partial<ComponentProps<typeof HairlineCta>>) {
  return (
    <ModusStage caption="Hairline CTA" layout="center">
      <HairlineCta {...props} />
    </ModusStage>
  );
}
