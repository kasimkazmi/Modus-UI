"use client";

import { ModusStage } from "@/components/modus-stage";
import { TallyBox } from "./tally-box";

export default function TallyBoxDemo() {
  return (
    <ModusStage caption="Tally Box" layout="center">
      <div className="flex flex-col items-start gap-2">
        <TallyBox defaultChecked label="Set the masthead" />
        <TallyBox />
        <TallyBox label="Send to the printer" />
      </div>
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
