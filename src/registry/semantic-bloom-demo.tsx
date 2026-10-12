"use client";

import type { ComponentProps } from "react";
import { SemanticBloom } from "./semantic-bloom";

export default function SemanticBloomDemo(props: Partial<ComponentProps<typeof SemanticBloom>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <SemanticBloom {...props} />
    </div>
  );
}
