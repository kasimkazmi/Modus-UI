"use client";

import type { ComponentProps } from "react";
import { LiquidForm } from "./liquid-form";

export default function LiquidFormDemo(props: Partial<ComponentProps<typeof LiquidForm>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border bg-black">
      <LiquidForm {...props} />
    </div>
  );
}
