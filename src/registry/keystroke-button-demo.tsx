"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { KeystrokeButton } from "./keystroke-button";

export default function KeystrokeButtonDemo(
  props: Partial<ComponentProps<typeof KeystrokeButton>>,
) {
  return (
    <ModusStage caption="Keystroke Button" layout="center">
      <KeystrokeButton {...props} />
    </ModusStage>
  );
}
