"use client";

import { useState } from "react";
import { ModusStage } from "@/components/modus-stage";
import { FlickNotice } from "./flick-notice";

export default function FlickNoticeDemo() {
  const [run, setRun] = useState(0);
  return (
    <ModusStage caption="Flick Notice" layout="center">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border bg-card px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-transform active:scale-[0.97] motion-reduce:transition-none"
        >
          File a draft
        </button>
        <FlickNotice
          key={run}
          inline
          duration={8000}
          description="Swipe it away, or let the fuse run out."
          actionLabel="Open"
        />
      </div>
    </ModusStage>
  );
}
