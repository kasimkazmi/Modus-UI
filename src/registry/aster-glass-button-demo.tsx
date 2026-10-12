import type { ComponentProps } from "react";
import { AsterGlassButton } from "@/registry/aster-glass-button";

export default function AsterGlassButtonDemo(
  props: Partial<ComponentProps<typeof AsterGlassButton>>,
) {
  return (
    <div className="flex h-[400px] min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl">
      <AsterGlassButton {...props} />
    </div>
  );
}
