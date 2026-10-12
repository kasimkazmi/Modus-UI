"use client";

import type { ComponentProps } from "react";
import { CrtScreen } from "./crt-screen";

export default function CrtScreenDemo(props: Partial<ComponentProps<typeof CrtScreen>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <CrtScreen className="absolute inset-0" {...props} />
    </div>
  );
}
