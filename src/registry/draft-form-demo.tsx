"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { DraftForm } from "./draft-form";

export default function DraftFormDemo(props: Partial<ComponentProps<typeof DraftForm>>) {
  return (
    <ModusStage caption="Draft Form" layout="center">
      <DraftForm {...props} />
    </ModusStage>
  );
}
