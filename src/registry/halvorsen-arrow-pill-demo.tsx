import type { ComponentProps } from "react";
import { HalvorsenArrowPill } from "@/registry/halvorsen-arrow-pill";

export default function HalvorsenArrowPillDemo(
  props: Partial<ComponentProps<typeof HalvorsenArrowPill>>,
) {
  return (
    <div className="flex h-[400px] min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl">
      <HalvorsenArrowPill {...props} />
    </div>
  );
}
