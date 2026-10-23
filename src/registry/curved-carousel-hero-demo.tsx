"use client";

import { ModusStage } from "@/components/modus-stage";
import { CurvedCarouselHero, type CurvedCarouselCard } from "@/registry/curved-carousel-hero";

// Clips from Mixkit (Stock Video Free License), trimmed to 5s portrait loops.
const CLIPS = [
  "latte-art",
  "flower-shop",
  "face-cream",
  "coffee-beans",
  "pink-flowers",
  "cappuccino",
  "watering-plant",
  "sunflowers",
  "coffee-maker",
];

const CARDS: CurvedCarouselCard[] = CLIPS.map((clip) => ({
  video: `/media/curved-carousel-hero/${clip}.mp4`,
  image: `/media/curved-carousel-hero/${clip}.jpg`,
}));

export default function CurvedCarouselHeroDemo() {
  return (
    <ModusStage caption="Curved Carousel Hero" layout="bleed">
      <div className="absolute inset-0">
        <CurvedCarouselHero cards={CARDS} />
      </div>
    </ModusStage>
  );
}
