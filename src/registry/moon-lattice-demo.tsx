"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { MoonLattice } from "./moon-lattice";

export default function MoonLatticeDemo(props: Partial<ComponentProps<typeof MoonLattice>>) {
  return (
    <ModusStage caption="Moon Lattice" layout="bleed">
      <MoonLattice {...props} />
    </ModusStage>
  );
}
