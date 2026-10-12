import { ModusStage } from "@/components/modus-stage";
import { HerbariumStudy } from "./herbarium-study";

export default function HerbariumStudyDemo() {
  return (
    <ModusStage caption="Herbarium Study" layout="bleed" className="min-h-[520px]">
      <HerbariumStudy />
    </ModusStage>
  );
}
