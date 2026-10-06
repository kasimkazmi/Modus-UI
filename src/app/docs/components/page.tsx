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
  { title: "Bounce Cards", href: "/docs/bounce-cards" },
  { title: "Floating Text", href: "/docs/floating-text" },
  { title: "Shimmer Text", href: "/docs/shimmer-text" },
  { title: "Scroll Velocity", href: "/docs/scroll-velocity" },
  { title: "Gravity Text Swap", href: "/docs/gravity-text-swap" },
  { title: "Blur Text", href: "/docs/blur-text" },
  { title: "Split Text", href: "/docs/split-text" },
  { title: "Decrypted Text", href: "/docs/decrypted-text" },
  { title: "Gradient Text", href: "/docs/gradient-text" },
  { title: "True Focus", href: "/docs/true-focus" },
  { title: "Text Pressure", href: "/docs/text-pressure" },
  { title: "Cursor Grid", href: "/docs/cursor-grid" },
  { title: "Animated Beam", href: "/docs/animated-beam" },
  { title: "Border Beam", href: "/docs/border-beam" },
  { title: "Orbiting Elements", href: "/docs/orbiting-elements" },
  { title: "Bento Grid", href: "/docs/bento-grid" },
  { title: "Decay Card", href: "/docs/decay-card" },
  { title: "Blob Cursor", href: "/docs/blob-cursor" },
  { title: "Fuzzy Text", href: "/docs/fuzzy-text" },
  { title: "Flip Words", href: "/docs/flip-words" },
  { title: "Scratch to Reveal", href: "/docs/scratch-to-reveal" },
  { title: "Liquid Tabs", href: "/docs/liquid-tabs" },
  { title: "Stack", href: "/docs/stack" },
  { title: "Magnet", href: "/docs/magnet" },
  { title: "Star Border", href: "/docs/star-border" },
  { title: "Tilted Card", href: "/docs/tilted-card" },
  { title: "Pixel Card", href: "/docs/pixel-card" },
  { title: "Spotlight Card", href: "/docs/spotlight-card" },
  { title: "Click Spark", href: "/docs/click-spark" },
  { title: "Border Glow", href: "/docs/border-glow" },
  { title: "Waves", href: "/docs/waves" },
  { title: "Letter Glitch", href: "/docs/letter-glitch" },
  { title: "Notch Footer", href: "/docs/notch-footer" },
  { title: "Flowing Menu", href: "/docs/flowing-menu" },
  { title: "Circuit Background", href: "/docs/circuit-background" },
  { title: "Coming Soon", href: "/docs/coming-soon", disabled: true },
];

export default function ComponentsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-8 flex items-center space-x-2 text-sm">
        <Link href="/docs" className="text-[#605A57]/50 transition-colors hover:text-[#37322F]">
          Docs
        </Link>
        <span className="font-light text-[#605A57]/30">/</span>
        <span className="font-medium text-[#37322F]">Components</span>
      </nav>

      <header className="mb-20">
        <h1 className="mb-6 font-serif text-5xl tracking-tight text-[#37322F] md:text-6xl">
          Components
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-[#605A57]">
          Explore our collection of premium React components designed for clarity, accuracy, and
          effortless trust. Built for modern editorial interfaces.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {COMPONENT_LIST.map((component) => (
          <div key={component.title} className="group relative">
            {component.disabled ? (
              <div className="flex cursor-not-allowed items-center justify-between border-b border-transparent py-2 text-[#605A57]/40">
                <span className="text-base font-medium">{component.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
                  Coming Soon
                </span>
              </div>
            ) : (
              <Link
                href={component.href}
                className="group flex items-center justify-between border-b border-[#E0DEDB]/40 py-2 transition-all duration-300 hover:border-[#37322F]"
              >
                <span className="text-base font-medium text-[#605A57] transition-colors group-hover:text-[#37322F]">
                  {component.title}
                </span>
                <MoveRight className="h-4 w-4 -translate-x-2 text-[#37322F] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            )}
          </div>
        ))}
      </div>

      <footer className="mt-32 flex items-center justify-between border-t border-[#E0DEDB]/40 pt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-[#605A57]/40">
        <span>Modus UI Library</span>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
}
