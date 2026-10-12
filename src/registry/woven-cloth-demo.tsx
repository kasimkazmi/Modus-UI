"use client";

import type { ComponentProps } from "react";
import { WovenCloth } from "./woven-cloth";

export default function WovenClothDemo(props: Partial<ComponentProps<typeof WovenCloth>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <WovenCloth {...props} />
    </div>
  );
}
