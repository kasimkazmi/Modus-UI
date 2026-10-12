"use client";

import type { ComponentProps } from "react";
import { InductionButton } from "./induction-button";

export default function InductionButtonDemo(
  props: Partial<ComponentProps<typeof InductionButton>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <InductionButton {...props} />
    </div>
  );
}
