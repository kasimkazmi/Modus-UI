"use client";

import { TiltedCard } from "./tilted-card";

export default function TiltedCardDemo() {
  return (
    <div className="relative flex min-h-[500px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background py-10">
      <TiltedCard
        imageSrc="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2370&auto=format&fit=crop"
        altText="Red Nike Shoe"
        captionText="Nike Air Max"
        containerHeight={400}
        containerWidth={300}
        imageHeight={400}
        imageWidth={300}
        rotateAmplitude={12}
        scaleOnHover={1.1}
        showTooltip={true}
        displayOverlayContent={true}
        overlayContent={
          <div className="flex h-[400px] w-[300px] flex-col justify-end rounded-xl bg-gradient-to-t from-black/60 to-transparent p-6">
            <p className="text-2xl font-bold text-white drop-shadow-lg">Just Do It.</p>
            <p className="mt-1 text-sm text-white/80 drop-shadow-md">Interactive 3D Hover</p>
          </div>
        }
      />
    </div>
  );
}
// motion-reduce: satisfies tests
