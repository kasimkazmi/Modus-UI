"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SurveyRelief } from "./survey-relief";

export default function SurveyReliefDemo(props: Partial<ComponentProps<typeof SurveyRelief>>) {
  return (
    <ModusStage caption="Survey Relief" layout="bleed">
      <SurveyRelief {...props} />
    </ModusStage>
  );
}
