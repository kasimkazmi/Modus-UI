"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SheenCta } from "./sheen-cta";

export default function SheenCtaDemo(props: Partial<ComponentProps<typeof SheenCta>>) {
  return (
    <ModusStage caption="Sheen CTA" layout="center">
      <SheenCta {...props} />
    </ModusStage>
  );
}
