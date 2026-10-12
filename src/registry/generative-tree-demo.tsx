import type { ComponentProps } from "react";
import { GenerativeTree } from "@/registry/generative-tree";

export default function GenerativeTreeDemo(props: Partial<ComponentProps<typeof GenerativeTree>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <GenerativeTree {...props} />
    </div>
  );
}
