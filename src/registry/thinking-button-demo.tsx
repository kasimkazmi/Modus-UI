"use client";

import type { ComponentProps } from "react";
import { ThinkingButton } from "./thinking-button";

export default function ThinkingButtonDemo(props: Partial<ComponentProps<typeof ThinkingButton>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ThinkingButton {...props} />
    </div>
  );
}
