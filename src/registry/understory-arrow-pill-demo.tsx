import type { ComponentProps } from "react";
import { UnderstoryArrowPill } from "@/registry/understory-arrow-pill";

export default function UnderstoryArrowPillDemo(
  props: Partial<ComponentProps<typeof UnderstoryArrowPill>>,
) {
  return (
    <div className="flex h-[400px] min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl">
      <UnderstoryArrowPill {...props} />
    </div>
  );
}
