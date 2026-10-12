"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { GlyphEddy } from "./glyph-eddy";

export default function GlyphEddyDemo(props: Partial<ComponentProps<typeof GlyphEddy>>) {
  return (
    <ModusStage caption="Glyph Eddy" layout="bleed">
      <GlyphEddy {...props} />
    </ModusStage>
  );
}
