"use client";

import type { ComponentProps } from "react";
import { MorphingGlyphCloud } from "./morphing-glyph-cloud";

export default function MorphingGlyphCloudDemo(
  props: Partial<ComponentProps<typeof MorphingGlyphCloud>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <MorphingGlyphCloud {...props} />
    </div>
  );
}
