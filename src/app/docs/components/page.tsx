import React from "react";
import Link from "next/link";
import { MoveRight } from "lucide-react";

const COMPONENT_LIST = [
  { title: "Morphing Navbar", href: "/docs/morphing-navbar" },
  { title: "Floating Dock", href: "/docs/floating-dock" },
  { title: "Magic Button", href: "/docs/magic-button" },
  { title: "Animated Button", href: "/docs/animated-button" },
  { title: "Grid Motion", href: "/docs/grid-motion" },
  { title: "Pulse Button", href: "/docs/pulse-button" },
  { title: "Masonry Grid", href: "/docs/masonry-grid" },
  { title: "Aurora Background", href: "/docs/aurora-background" },
  { title: "Kinetic Carousel", href: "/docs/kinetic-carousel" },
  { title: "Process Stepper", href: "/docs/process-stepper" },
  { title: "Animated List", href: "/docs/animated-list" },
  { title: "Focus Card", href: "/docs/focus-card" },
  { title: "Expandable Showcase", href: "/docs/expandable-showcase" },
  { title: "Rotating Card", href: "/docs/rotating-card" },
  { title: "Tilt Card", href: "/docs/tilt-card" },
  { title: "Floating Text", href: "/docs/floating-text" },
  { title: "Shimmer Text", href: "/docs/shimmer-text" },
  { title: "Blur Text", href: "/docs/blur-text" },
  { title: "Split Text", href: "/docs/split-text" },
  { title: "Decrypted Text", href: "/docs/decrypted-text" },
  { title: "Notch Footer", href: "/docs/notch-footer" },
  { title: "Circuit Background", href: "/docs/circuit-background" },
  { title: "Coming Soon", href: "/docs/coming-soon", disabled: true },
];

export default function ComponentsPage() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <nav className="flex items-center space-x-2 text-sm mb-8">
        <Link href="/docs" className="text-[#605A57]/50 hover:text-[#37322F] transition-colors">Docs</Link>
        <span className="text-[#605A57]/30 font-light">/</span>
        <span className="text-[#37322F] font-medium">Components</span>
      </nav>

      <header className="mb-20">
        <h1 className="text-5xl md:text-6xl font-serif text-[#37322F] mb-6 tracking-tight">
          Components
        </h1>
        <p className="text-[#605A57] text-lg max-w-2xl leading-relaxed">
          Explore our collection of premium React components designed for clarity, 
          accuracy, and effortless trust. Built for modern editorial interfaces.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
        {COMPONENT_LIST.map((component) => (
          <div key={component.title} className="group relative">
            {component.disabled ? (
              <div className="flex items-center justify-between py-2 border-b border-transparent text-[#605A57]/40 cursor-not-allowed">
                <span className="text-base font-medium">{component.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Coming Soon</span>
              </div>
            ) : (
              <Link
                href={component.href}
                className="flex items-center justify-between py-2 border-b border-[#E0DEDB]/40 hover:border-[#37322F] transition-all duration-300 group"
              >
                <span className="text-base font-medium text-[#605A57] group-hover:text-[#37322F] transition-colors">
                  {component.title}
                </span>
                <MoveRight className="w-4 h-4 text-[#37322F] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </Link>
            )}
          </div>
        ))}
      </div>

      <footer className="mt-32 pt-8 border-t border-[#E0DEDB]/40 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#605A57]/40">
        <span>Modus UI Library</span>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
}
