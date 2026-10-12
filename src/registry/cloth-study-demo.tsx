"use client";

import type { ComponentProps } from "react";
import { ClothStudy } from "./cloth-study";

export default function ClothStudyDemo(props: Partial<ComponentProps<typeof ClothStudy>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ClothStudy {...props} />
    </div>
  );
}
