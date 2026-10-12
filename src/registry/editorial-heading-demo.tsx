"use client";

import type { ComponentProps } from "react";
import { EditorialHeading } from "./editorial-heading";

export default function EditorialHeadingDemo(
  props: Partial<ComponentProps<typeof EditorialHeading>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <EditorialHeading className="absolute inset-0" {...props} />
    </div>
  );
}
