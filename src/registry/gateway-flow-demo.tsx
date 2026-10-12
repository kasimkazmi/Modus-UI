"use client";

import type { ComponentProps } from "react";
import { GatewayFlow } from "./gateway-flow";

export default function GatewayFlowDemo(props: Partial<ComponentProps<typeof GatewayFlow>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <GatewayFlow {...props} />
    </div>
  );
}
