"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { CastReel } from "./cast-reel";

export default function CastReelDemo(props: Partial<ComponentProps<typeof CastReel>>) {
  return (
    <ModusStage caption="Cast Reel" layout="bleed">
      <div className="absolute inset-0 flex">
        <CastReel {...props} />
      </div>
    </ModusStage>
  );
}
