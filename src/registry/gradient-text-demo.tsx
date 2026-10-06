import { GradientText } from "./gradient-text";

export default function GradientTextDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background p-12">
      <div className="flex flex-col items-center gap-12">
        <GradientText
          className="text-4xl font-bold tracking-tighter md:text-6xl"
          colors={["#f43f5e", "#d946ef", "#8b5cf6", "#3b82f6"]}
          animationSpeed={5}
        >
          Fluid Gradient Text
        </GradientText>

        <GradientText
          className="text-lg font-medium tracking-wide md:text-xl"
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
