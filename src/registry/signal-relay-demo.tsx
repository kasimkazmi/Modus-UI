"use client";

import { ModusStage } from "@/components/modus-stage";
import { SignalRelay } from "./signal-relay";

export default function SignalRelayDemo() {
  return (
    <ModusStage caption="Signal Relay" layout="bleed">
      <div className="absolute inset-0">
        <SignalRelay />
      </div>
    </ModusStage>
  );
}
