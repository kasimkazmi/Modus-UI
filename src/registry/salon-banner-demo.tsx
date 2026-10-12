"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SalonBanner } from "./salon-banner";

export default function SalonBannerDemo(props: Partial<ComponentProps<typeof SalonBanner>>) {
  return (
    <ModusStage caption="Salon Banner" layout="bleed">
      <SalonBanner {...props} />
    </ModusStage>
  );
}
