"use client";

import type { ComponentProps } from "react";
import { ModusStage } from "@/components/modus-stage";
import { FolioTitle } from "./folio-title";

export default function FolioTitleDemo(props: Partial<ComponentProps<typeof FolioTitle>>) {
  return (
    <ModusStage caption="Folio Title" layout="bleed">
      <FolioTitle className="absolute inset-0" {...props} />
    </ModusStage>
  );
}
