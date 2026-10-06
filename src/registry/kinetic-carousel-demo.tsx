import { KineticCarousel } from "./kinetic-carousel";
import { Sparkles, Palette, Shield, Zap } from "lucide-react";

export default function KineticCarouselDemo() {
  const items = [
    <div key="1" className="p-6 h-64 flex flex-col items-center justify-center text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Fluid Animations</h3>
      <p className="text-sm text-muted-foreground">Physics-based transitions that feel natural and responsive to user input.</p>
    </div>,
    <div key="2" className="p-6 h-64 flex flex-col items-center justify-center text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Palette className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Themeable</h3>
      <p className="text-sm text-muted-foreground">Automatically adapts to your light and dark mode Tailwind configurations.</p>
    </div>,
    <div key="3" className="p-6 h-64 flex flex-col items-center justify-center text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Shield className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Accessible</h3>
      <p className="text-sm text-muted-foreground">Built-in keyboard navigation and ARIA attributes for screen readers.</p>
    </div>,
    <div key="4" className="p-6 h-64 flex flex-col items-center justify-center text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Fast Setup</h3>
      <p className="text-sm text-muted-foreground">Drop into any Next.js project and instantly see results with zero configuration.</p>
    </div>
  ];

  return (
    <div className="flex w-full items-center justify-center p-12 bg-background">
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
