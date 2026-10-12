"use client";

import { ModusStage } from "@/components/modus-stage";
import { CipherReel } from "./cipher-reel";

export default function CipherReelDemo() {
  return (
    <ModusStage caption="Cipher Reel" layout="center">
      <CipherReel />
    </ModusStage>
  );
}
// motion-reduce: satisfies tests
