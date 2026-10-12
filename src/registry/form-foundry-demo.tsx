"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { FormFoundry } from "./form-foundry";

export default function FormFoundryDemo(props: Partial<ComponentProps<typeof FormFoundry>>) {
  return (
    <ModusStage caption="Form Foundry" layout="bleed">
      <FormFoundry {...props} />
    </ModusStage>
  );
}
