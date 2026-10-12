"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { GlyphSurge } from "./glyph-surge";

export default function GlyphSurgeDemo(props: Partial<ComponentProps<typeof GlyphSurge>>) {
  return (
    <ModusStage caption="Glyph Surge" layout="bleed">
      <GlyphSurge {...props} />
    </ModusStage>
  );
}
