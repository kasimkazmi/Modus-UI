"use client";

import { ModusStage } from "@/components/modus-stage";
import { PolishPane } from "./polish-pane";

export default function PolishPaneDemo() {
  return (
    <ModusStage caption="Polish Pane" layout="center">
      <PolishPane status="refining">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&auto=format&fit=crop&q=80"
          alt="Concrete facade"
          className="h-full w-full object-cover"
        />
      </PolishPane>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
