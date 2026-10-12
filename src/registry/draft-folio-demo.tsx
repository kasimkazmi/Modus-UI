import { ModusStage } from "@/components/modus-stage";
import { DraftFolio } from "@/registry/draft-folio";

export default function DraftFolioDemo() {
  return (
    <ModusStage caption="Draft Folio" layout="bleed" className="min-h-[640px]">
      <DraftFolio />
    </ModusStage>
  );
}
