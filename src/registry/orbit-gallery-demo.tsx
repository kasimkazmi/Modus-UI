"use client";

import type { ComponentProps } from "react";
import { OrbitGallery } from "./orbit-gallery";

export default function OrbitGalleryDemo(props: Partial<ComponentProps<typeof OrbitGallery>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <OrbitGallery {...props} />
    </div>
  );
}
