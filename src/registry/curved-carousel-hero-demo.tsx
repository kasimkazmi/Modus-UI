"use client";

import { ModusStage } from "@/components/modus-stage";
import { CurvedCarouselHero } from "@/registry/curved-carousel-hero";

export default function CurvedCarouselHeroDemo() {
  return (
    <ModusStage caption="Curved Carousel Hero" layout="bleed">
      <div className="absolute inset-0">
        <CurvedCarouselHero />
      </div>
    </ModusStage>
  );
}
