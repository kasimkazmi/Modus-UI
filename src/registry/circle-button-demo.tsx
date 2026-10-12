import type { ComponentProps } from "react";
import { CircleButton } from "@/registry/circle-button";

export default function CircleButtonDemo(props: Partial<ComponentProps<typeof CircleButton>>) {
  return (
    <div className="flex h-[400px] min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl">
      <CircleButton {...props} />
    </div>
  );
}
