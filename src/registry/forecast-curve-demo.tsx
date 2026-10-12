"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { ForecastCurve } from "./forecast-curve";

export default function ForecastCurveDemo(props: Partial<ComponentProps<typeof ForecastCurve>>) {
  return (
    <ModusStage caption="Forecast Curve" layout="bleed">
      <ForecastCurve {...props} />
    </ModusStage>
  );
}
