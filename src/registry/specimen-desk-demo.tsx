import { ModusStage } from "@/components/modus-stage";
import { SpecimenDesk } from "@/registry/specimen-desk";

export default function SpecimenDeskDemo() {
  return (
    <ModusStage caption="Specimen Desk" layout="bleed" className="min-h-[520px]">
      <SpecimenDesk />
    </ModusStage>
  );
}
