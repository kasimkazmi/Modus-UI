import type { ComponentProps } from "react";
import { MeridianKeycap } from "@/registry/meridian-keycap";

export default function MeridianKeycapDemo(props: Partial<ComponentProps<typeof MeridianKeycap>>) {
  return (
    <div className="flex h-[400px] min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl">
      <MeridianKeycap {...props} />
    </div>
  );
}
