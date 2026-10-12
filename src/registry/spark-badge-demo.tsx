import type { ComponentProps } from "react";
import { SparkBadge } from "@/registry/spark-badge";

export default function SparkBadgeDemo(props: Partial<ComponentProps<typeof SparkBadge>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <SparkBadge {...props} />
    </div>
  );
}
