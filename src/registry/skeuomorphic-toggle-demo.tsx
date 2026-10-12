"use client";

import type { ComponentProps } from "react";
import { SkeuomorphicToggle } from "./skeuomorphic-toggle";

export default function SkeuomorphicToggleDemo(
  props: Partial<ComponentProps<typeof SkeuomorphicToggle>>,
) {
  return (
    <div className="flex min-h-[400px] w-full">
      <SkeuomorphicToggle {...props} />
    </div>
  );
}
