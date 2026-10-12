"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ConjureButton } from "./conjure-button";

export default function ConjureButtonDemo(props: Partial<ComponentProps<typeof ConjureButton>>) {
  return (
    <ModusStage caption="Conjure Button" layout="center">
      <ConjureButton {...props} />
    </ModusStage>
  );
}
