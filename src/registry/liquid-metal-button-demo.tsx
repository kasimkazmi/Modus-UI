import type { ComponentProps } from "react";
import { LiquidMetalButton } from "@/registry/liquid-metal-button";

export default function LiquidMetalButtonDemo(
  props: Partial<ComponentProps<typeof LiquidMetalButton>>,
) {
  return (
    <div className="flex h-[400px] min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl">
      <LiquidMetalButton {...props} />
    </div>
  );
}
