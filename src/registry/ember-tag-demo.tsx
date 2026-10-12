import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { EmberTag } from "@/registry/ember-tag";

export default function EmberTagDemo(props: Partial<ComponentProps<typeof EmberTag>>) {
  return (
    <ModusStage caption="Ember Tag" layout="bleed" className="min-h-[600px]">
      <EmberTag {...props} />
    </ModusStage>
  );
}
