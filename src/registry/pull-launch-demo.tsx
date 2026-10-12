"use client";

import { ModusStage } from "@/components/modus-stage";
import { PullLaunch } from "./pull-launch";

export default function PullLaunchDemo() {
  return (
    <ModusStage caption="Pull Launch" layout="center">
      <div className="flex flex-col items-center gap-6">
        <PullLaunch />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Pull back and release
        </p>
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
