import { BounceCards } from "./bounce-cards";

export default function BounceCardsDemo() {
  const images = [
    "https://images.unsplash.com/photo-1512850183-6d7990f42385?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=500",
  ];

  return (
    <div className="flex w-full items-center justify-center p-12 bg-muted border border-border rounded-xl overflow-hidden min-h-[500px]">
      <BounceCards
        images={images}
        containerWidth={500}
        containerHeight={400}
        animationDelay={0.2}
        animationStagger={0.08}
        enableHover={true}
      />
    </div>
  );
}
