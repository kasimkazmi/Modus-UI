"use client";

import type { ComponentProps } from "react";
import { BallStudy } from "./ball-study";

export default function BallStudyDemo(props: Partial<ComponentProps<typeof BallStudy>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <BallStudy {...props} />
    </div>
  );
}
