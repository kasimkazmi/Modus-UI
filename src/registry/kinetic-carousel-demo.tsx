import { KineticCarousel } from "./kinetic-carousel";
import { Sparkles, Palette, Shield, Zap } from "lucide-react";

export default function KineticCarouselDemo() {
  const items = [
    <div key="1" className="flex h-64 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Fluid Animations</h3>
      <p className="text-sm text-muted-foreground">
        Physics-based transitions that feel natural and responsive to user input.
      </p>
    </div>,
    <div key="2" className="flex h-64 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Palette className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Themeable</h3>
      <p className="text-sm text-muted-foreground">
        Automatically adapts to your light and dark mode Tailwind configurations.
      </p>
    </div>,
    <div key="3" className="flex h-64 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Shield className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Accessible</h3>
      <p className="text-sm text-muted-foreground">
        Built-in keyboard navigation and ARIA attributes for screen readers.
      </p>
    </div>,
    <div key="4" className="flex h-64 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Zap className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Fast Setup</h3>
      <p className="text-sm text-muted-foreground">
        Drop into any Next.js project and instantly see results with zero configuration.
      </p>
    </div>,
  ];

  return (
    <div className="flex w-full items-center justify-center bg-background p-12">
      <KineticCarousel
        items={items}
        loop={true}
        baseWidth={320}
        autoplay={true}
        autoplayDelay={4000}
      />
    </div>
  );
}
