"use client";

import type { ComponentProps } from "react";
import { GalleryHeading } from "./gallery-heading";

export default function GalleryHeadingDemo(props: Partial<ComponentProps<typeof GalleryHeading>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <GalleryHeading {...props} />
    </div>
  );
}
