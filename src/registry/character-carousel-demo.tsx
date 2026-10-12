"use client";

import type { ComponentProps } from "react";
import { CharacterCarousel } from "./character-carousel";

export default function CharacterCarouselDemo(
  props: Partial<ComponentProps<typeof CharacterCarousel>>,
) {
  return (
    <div className="relative flex h-[520px] min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <CharacterCarousel {...props} />
    </div>
  );
}
