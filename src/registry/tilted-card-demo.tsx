"use client";

import { TiltedCard } from "./tilted-card";

export default function TiltedCardDemo() {
  return (
    <div className="relative flex w-full items-center justify-center min-h-[500px] overflow-hidden rounded-xl border border-border bg-background py-10">
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
          <div className="w-[300px] h-[400px] p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent rounded-xl">
            <p className="text-white text-2xl font-bold drop-shadow-lg">Just Do It.</p>
            <p className="text-white/80 text-sm drop-shadow-md mt-1">Interactive 3D Hover</p>
          </div>
        }
      />
    </div>
  );
}
