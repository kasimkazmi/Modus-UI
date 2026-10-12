"use client";

import type { ComponentProps } from "react";
import { LumenCta } from "./lumen-cta";

export default function LumenCtaDemo(props: Partial<ComponentProps<typeof LumenCta>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <div className="grid w-full grid-cols-1 sm:grid-cols-2">
        <LumenCta {...props} />
        <LumenCta variant="ghost" />
      </div>
    </div>
  );
}
