"use client";

import type { ComponentProps } from "react";
import { GenerateButton } from "./generate-button";

export default function GenerateButtonDemo(props: Partial<ComponentProps<typeof GenerateButton>>) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center rounded-xl border border-border bg-[#111318]">
      <GenerateButton {...props} />
    </div>
  );
}
