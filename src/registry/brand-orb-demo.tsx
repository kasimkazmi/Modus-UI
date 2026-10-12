"use client";

import type { ComponentProps } from "react";
import { BRAND_ORB_BRANDS, BrandOrb } from "./brand-orb";

export default function BrandOrbDemo(props: Partial<ComponentProps<typeof BrandOrb>>) {
  return (
    <div className="relative flex min-h-[400px] w-full flex-col items-center justify-center gap-10 overflow-hidden rounded-xl border border-border bg-[#050608] p-6">
      <div className="h-24 w-24">
        <BrandOrb brand="claude" {...props} />
      </div>
      <div className="flex max-w-2xl flex-wrap justify-center gap-2">
        {BRAND_ORB_BRANDS.map((brand) => (
          <div key={brand} className="h-14 w-14" title={brand}>
            <BrandOrb brand={brand} />
          </div>
        ))}
      </div>
    </div>
  );
}
