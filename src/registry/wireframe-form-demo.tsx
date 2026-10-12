"use client";

import type { ComponentProps } from "react";
import { WireframeForm } from "./wireframe-form";

export default function WireframeFormDemo(props: Partial<ComponentProps<typeof WireframeForm>>) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-[#050505]">
      <WireframeForm {...props} />
    </div>
  );
}
