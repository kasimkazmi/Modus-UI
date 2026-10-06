import React from "react";
import Link from "next/link";
import {
  Layout,
  MousePointer2,
  Type,
  CreditCard,
  PanelTop,
  PanelBottom,
  Sparkles,
  LayoutTemplate,
  BookOpen,
} from "lucide-react";

const DOC_CATEGORIES = [
  {
    title: "Navigation",
    icon: PanelTop,
    items: [
      { title: "Liquid Tabs", href: "/docs/liquid-tabs" },
      { title: "Flowing Menu", href: "/docs/flowing-menu" },
      { title: "Morphing Navbar", href: "/docs/morphing-navbar" },
      { title: "Floating Dock", href: "/docs/floating-dock" },
      { title: "Notch Footer", href: "/docs/notch-footer" },
      { title: "Process Stepper", href: "/docs/process-stepper" },
    ],
  },
  {
    title: "Actions",
    icon: MousePointer2,
    items: [
      { title: "Magnet", href: "/docs/magnet" },
      { title: "Magic Button", href: "/docs/magic-button" },
      { title: "Animated Button", href: "/docs/animated-button" },
      { title: "Pulse Button", href: "/docs/pulse-button" },
    ],
  },
  {
    title: "Data Display",
    icon: Layout,
    items: [
      { title: "Bounce Cards", href: "/docs/bounce-cards" },
      { title: "Masonry Grid", href: "/docs/masonry-grid" },
      { title: "Animated List", href: "/docs/animated-list" },
      { title: "Kinetic Carousel", href: "/docs/kinetic-carousel" },
      { title: "Expandable Showcase", href: "/docs/expandable-showcase" },
      { title: "Focus Card", href: "/docs/focus-card" },
      { title: "Rotating Card", href: "/docs/rotating-card" },
      { title: "Tilt Card", href: "/docs/tilt-card" },
    ],
  },
  {
    title: "Backgrounds",
    icon: Sparkles,
    items: [
      { title: "Cursor Grid", href: "/docs/cursor-grid" },
      { title: "Waves", href: "/docs/waves" },
      { title: "Letter Glitch", href: "/docs/letter-glitch" },
      { title: "Aurora Background", href: "/docs/aurora-background" },
      { title: "Circuit Background", href: "/docs/circuit-background" },
      { title: "Orbiting Elements", href: "/docs/orbiting-elements" },
      { title: "Blob Cursor", href: "/docs/blob-cursor" },
      { title: "Magnet Lines", href: "/docs/magnet-lines" },
      { title: "Grid Motion", href: "/docs/grid-motion" },
    ],
  },
  {
    title: "Typography",
    icon: Type,
    items: [
      { title: "Gravity Text Swap", href: "/docs/gravity-text-swap" },
      { title: "Flip Words", href: "/docs/flip-words" },
      { title: "Fuzzy Text", href: "/docs/fuzzy-text" },
      { title: "Scroll Velocity", href: "/docs/scroll-velocity" },
      { title: "Text Pressure", href: "/docs/text-pressure" },
      { title: "True Focus", href: "/docs/true-focus" },
      { title: "Gradient Text", href: "/docs/gradient-text" },
      { title: "Blur Text", href: "/docs/blur-text" },
      { title: "Split Text", href: "/docs/split-text" },
      { title: "Decrypted Text", href: "/docs/decrypted-text" },
      { title: "Shimmer Text", href: "/docs/shimmer-text" },
      { title: "Floating Text", href: "/docs/floating-text" },
    ],
  },
  {
    title: "Components",
    icon: LayoutTemplate,
    items: [
      { title: "Animated Beam", href: "/docs/animated-beam" },
      { title: "Border Beam", href: "/docs/border-beam" },
      { title: "Bento Grid", href: "/docs/bento-grid" },
      { title: "Decay Card", href: "/docs/decay-card" },
      { title: "Animated Beam", href: "/docs/animated-beam" },
      { title: "Border Beam", href: "/docs/border-beam" },
      { title: "Bento Grid", href: "/docs/bento-grid" },
      { title: "Decay Card", href: "/docs/decay-card" },
      { title: "Scratch to Reveal", href: "/docs/scratch-to-reveal" },
      { title: "Stack", href: "/docs/stack" },
      { title: "Star Border", href: "/docs/star-border" },
      { title: "Tilted Card", href: "/docs/tilted-card" },
      { title: "Pixel Card", href: "/docs/pixel-card" },
      { title: "Click Spark", href: "/docs/click-spark" },
      { title: "Spotlight Card", href: "/docs/spotlight-card" },
      { title: "Border Glow", href: "/docs/border-glow" },
    ],
  },
  {
    title: "Resources",
    icon: BookOpen,
    items: [
      { title: "Coming Soon", href: "/docs/coming-soon" },
      { title: "Blog (Coming Soon)", href: "/blog" },
    ],
  },
];

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-[#37322F]">
      <aside className="sticky top-0 hidden h-screen w-64 overflow-y-auto border-r border-border bg-[#F7F5F3]/40 backdrop-blur-xl md:block">
        <div className="p-8">
          <Link href="/" className="mb-12 flex items-center gap-3 text-lg font-bold text-[#37322F]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#37322F] shadow-sm">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="translate-y-[1px] text-[#F7F5F3]"
              >
                <path d="M4 20V8a4 4 0 0 1 8 0v12" />
                <path d="M12 20V8a4 4 0 0 1 8 0v12" />
              </svg>
            </div>
            <span className="font-serif text-xl tracking-tight">Modus UI</span>
          </Link>

          <nav className="space-y-8">
            {DOC_CATEGORIES.map((category) => (
              <div key={category.title}>
                <div className="mb-3 flex items-center gap-2 px-3 text-[#605A57]/60">
                  <category.icon className="h-3.5 w-3.5" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    {category.title}
                  </h4>
                </div>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center rounded-lg px-4 py-2 text-[14px] font-medium text-[#605A57] transition-all hover:bg-[#F0EDEA] hover:text-[#37322F]"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-white/80 px-6 backdrop-blur-md md:hidden">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-xl font-bold text-[#37322F]"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#37322F] shadow-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="translate-y-[0.5px] text-[#F7F5F3]"
              >
                <path d="M4 20V8a4 4 0 0 1 8 0v12" />
                <path d="M12 20V8a4 4 0 0 1 8 0v12" />
              </svg>
            </div>
            <span>Modus UI</span>
          </Link>
        </header>
        <main className="flex-1 p-8 md:p-12 lg:p-16">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
