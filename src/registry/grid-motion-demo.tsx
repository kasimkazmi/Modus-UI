import { GridMotion } from "./grid-motion";

export default function GridMotionDemo() {
  const items = [
    "Design", "Development", "Engineering", "Architecture",
    "Performance", "Accessibility", "Framer Motion", "Tailwind",
    "React", "Next.js", "Modus UI", "Components",
    "Interactive", "Responsive", "Accessible", "Fast",
    "Beautiful", "Modern", "Clean", "Simple",
    "Flexible", "Scalable", "Reliable", "Robust",
    "Elegant", "Seamless", "Fluid", "Dynamic"
  ];

  return (
    <div className="w-full h-[600px] border border-border rounded-xl overflow-hidden relative">
      <GridMotion items={items} gradientColor="hsl(var(--background))" />
    </div>
  );
}
