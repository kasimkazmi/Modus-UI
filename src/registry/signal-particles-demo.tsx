"use client";

import type { ComponentProps } from "react";
import { SignalParticles } from "./signal-particles";

export default function SignalParticlesDemo(
  props: Partial<ComponentProps<typeof SignalParticles>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <SignalParticles {...props} />
    </div>
  );
}
