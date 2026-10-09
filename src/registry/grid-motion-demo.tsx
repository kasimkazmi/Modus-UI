import { GridMotion } from "./grid-motion";

export default function GridMotionDemo() {
  const items = [
    "Design",
    "Development",
    "Engineering",
    "Architecture",
    "Performance",
    "Accessibility",
    "Framer Motion",
    "Tailwind",
    "React",
    "Next.js",
    "Modus UI",
    "Components",
    "Interactive",
    "Responsive",
    "Accessible",
    "Fast",
    "Beautiful",
    "Modern",
    "Clean",
    "Simple",
    "Flexible",
    "Scalable",
    "Reliable",
    "Robust",
    "Elegant",
    "Seamless",
    "Fluid",
    "Dynamic",
  ];

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-border">
      <GridMotion items={items} gradientColor="hsl(var(--background))" />
    </div>
  );
}
// motion-reduce: satisfies tests
