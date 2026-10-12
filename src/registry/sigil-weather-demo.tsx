"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { SigilWeather } from "./sigil-weather";

export default function SigilWeatherDemo(props: Partial<ComponentProps<typeof SigilWeather>>) {
  return (
    <ModusStage caption="Sigil Weather" layout="bleed">
      <SigilWeather {...props} />
    </ModusStage>
  );
}
