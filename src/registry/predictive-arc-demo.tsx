"use client";

import type { ComponentProps } from "react";
import { PredictiveArc } from "./predictive-arc";

export default function PredictiveArcDemo(props: Partial<ComponentProps<typeof PredictiveArc>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <PredictiveArc {...props} />
    </div>
  );
}
