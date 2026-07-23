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
  BookOpen
} from "lucide-react";

const DOC_CATEGORIES = [
  {
    title: "Headers",
    icon: PanelTop,
    items: [
      { title: "Morphing Navbar", href: "/docs/morphing-navbar" },
      { title: "Floating Dock", href: "/docs/floating-dock" },
    ]
  },
  {
    title: "Buttons",
    icon: MousePointer2,
    items: [
      { title: "Magic Button", href: "/docs/magic-button" },
      { title: "Animated Button", href: "/docs/animated-button" },
      { title: "Pulse Button", href: "/docs/pulse-button" },
    ]
  },
  {
    title: "Cards",
    icon: CreditCard,
    items: [
      { title: "Rotating Card", href: "/docs/rotating-card" },
      { title: "Tilt Card", href: "/docs/tilt-card" },
    ]
  },
  {
    title: "Footers",
    icon: PanelBottom,
    items: [
      { title: "Notch Footer", href: "/docs/notch-footer" },
    ]
  },
  {
    title: "Layout",
    icon: Layout,
    items: [
      { title: "Circuit Background", href: "/docs/circuit-background" },
    ]
  },
  {
    title: "Template",
    icon: LayoutTemplate,
    items: [
      { title: "Coming Soon", href: "/docs/coming-soon" },
    ]
  },
  {
    title: "Text",
    icon: Type,
    items: [
      { title: "Floating Text", href: "/docs/floating-text" },
    ]
  },
  {
    title: "Resources",
    icon: BookOpen,
    items: [
      { title: "Blog (Coming Soon)", href: "/blog" },
    ]
  }
];

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-[#37322F]">
      <aside className="w-64 border-r border-border bg-[#F7F5F3]/40 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto hidden md:block">
        <div className="p-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-bold text-[#37322F] mb-12"
          >
            <div className="w-9 h-9 rounded-full bg-[#37322F] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F7F5F3] translate-y-[1px]">
                <path d="M4 20V8a4 4 0 0 1 8 0v12" />
                <path d="M12 20V8a4 4 0 0 1 8 0v12" />
              </svg>
            </div>
            <span className="font-serif tracking-tight text-xl">Modus UI</span>
          </Link>
          
          <nav className="space-y-8">
            {DOC_CATEGORIES.map((category) => (
              <div key={category.title}>
                <div className="flex items-center gap-2 px-3 mb-3 text-[#605A57]/60">
                  <category.icon className="w-3.5 h-3.5" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    {category.title}
                  </h4>
                </div>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-4 py-2 text-[14px] font-medium rounded-lg text-[#605A57] hover:text-[#37322F] hover:bg-[#F0EDEA] transition-all"
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
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white/80 backdrop-blur-md flex items-center px-6 md:hidden sticky top-0 z-50">
           <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-[#37322F]">
            <div className="w-6 h-6 rounded-full bg-[#37322F] flex items-center justify-center shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F7F5F3] translate-y-[0.5px]">
                <path d="M4 20V8a4 4 0 0 1 8 0v12" />
                <path d="M12 20V8a4 4 0 0 1 8 0v12" />
              </svg>
            </div>
            <span>Modus UI</span>
          </Link>
        </header>
        <main className="flex-1 p-8 md:p-12 lg:p-16">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}