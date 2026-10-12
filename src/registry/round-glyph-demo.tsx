"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { RoundGlyph } from "@/registry/round-glyph";

export default function RoundGlyphDemo(props: Partial<ComponentProps<typeof RoundGlyph>>) {
  return (
    <ModusStage caption="Round Glyph" layout="center">
      <div className="flex items-center gap-10">
        {props.variant ? (
          <RoundGlyph {...props} />
        ) : (
          (["plus", "play", "mail"] as const).map((v) => (
            <RoundGlyph key={v} {...props} variant={v} />
          ))
        )}
      </div>
    </ModusStage>
  );
}
