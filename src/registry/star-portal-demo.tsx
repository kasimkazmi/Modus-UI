import type { ComponentProps } from "react";
import { StarPortal } from "@/registry/star-portal";

export default function StarPortalDemo(props: Partial<ComponentProps<typeof StarPortal>>) {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border">
      <div className="absolute inset-0">
        <StarPortal {...props} />
      </div>
    </div>
  );
}
