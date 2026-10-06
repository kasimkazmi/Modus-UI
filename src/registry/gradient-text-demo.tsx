import { GradientText } from "./gradient-text";

export default function GradientTextDemo() {
  return (
    <div className="flex w-full items-center justify-center p-12 bg-background min-h-[400px]">
      <div className="flex flex-col gap-12 items-center">
        <GradientText 
          className="text-4xl md:text-6xl font-bold tracking-tighter"
          colors={["#f43f5e", "#d946ef", "#8b5cf6", "#3b82f6"]}
          animationSpeed={5}
        >
          Fluid Gradient Text
        </GradientText>
        
        <GradientText 
          className="text-lg md:text-xl font-medium tracking-wide"
          showBorder={true}
          colors={["#10b981", "#06b6d4", "#3b82f6", "#6366f1"]}
          animationSpeed={4}
          direction="diagonal"
        >
          With Glowing Gradient Border
        </GradientText>
      </div>
    </div>
  );
}
