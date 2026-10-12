"use client";

import type { ComponentProps } from "react";
import { TowerLandscape } from "./tower-landscape";

export default function TowerLandscapeDemo(props: Partial<ComponentProps<typeof TowerLandscape>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <TowerLandscape {...props} />
    </div>
  );
}
