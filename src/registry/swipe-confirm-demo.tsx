"use client";

import { ModusStage } from "@/components/modus-stage";
import { SwipeConfirm } from "./swipe-confirm";

export default function SwipeConfirmDemo() {
  return (
    <ModusStage caption="Swipe Confirm" layout="center">
      <SwipeConfirm onConfirm={() => new Promise((resolve) => setTimeout(resolve, 900))} />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
