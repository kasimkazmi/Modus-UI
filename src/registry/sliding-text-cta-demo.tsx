"use client";

import type { ComponentProps } from "react";
import { SlidingTextCta } from "./sliding-text-cta";

export default function SlidingTextCtaDemo(props: Partial<ComponentProps<typeof SlidingTextCta>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <SlidingTextCta className="min-h-[400px]" {...props} />
    </div>
  );
}
