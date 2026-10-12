"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { PondGlide } from "./pond-glide";

export default function PondGlideDemo(props: Partial<ComponentProps<typeof PondGlide>>) {
  return (
    <ModusStage caption="Pond Glide" layout="bleed" className="h-[640px]">
      <PondGlide {...props} />
    </ModusStage>
  );
}
