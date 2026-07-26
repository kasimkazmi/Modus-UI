import Link from "next/link";
import { ArrowRight, Sparkles, Terminal, Compass, Layout } from "lucide-react";

export default function HomePage() {
  const marqueeItems = [
    "DYNAMIC INTERACTION",
    "KINETIC MOTION",
    "BRUTALIST ALIGNMENT",
    "FLAT GEOMETRY",
    "KINETIC TYPOGRAPHY",
    "ACCENT CONTRAST",
  ];

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-background text-[#FAFAFA] font-sans">
      {/* Noise Texture Overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Kinetic Accent Corner Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#DFE104] translate-x-12 -translate-y-12 rotate-45 select-none pointer-events-none z-30" />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-[95vw] mx-auto px-4 py-8 flex items-center justify-between border-b-2 border-[#3F3F46] bg-black">
        <Link href="/" className="flex items-center gap-3 font-sans text-xl font-bold uppercase tracking-tighter text-[#FAFAFA] hover:text-[#DFE104] transition-colors">
          <div className="w-8 h-8 bg-[#DFE104] text-black flex items-center justify-center font-bold text-lg select-none">
            M
          </div>
          <span>Modus UI</span>
        </Link>

        <nav className="flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">
          <Link href="/docs" className="hover:text-[#DFE104] transition-colors">COMPONENTS</Link>
          <a href="https://github.com/kasimkazmi/Modus-UI" target="_blank" rel="noopener noreferrer" className="hover:text-[#DFE104] transition-colors">GITHUB</a>
        </nav>
      </header>

      {/* Hero Body Section */}
      <div className="relative z-10 w-full max-w-[95vw] mx-auto px-4 py-20 flex flex-col items-start text-left my-auto gap-8">
        <div className="inline-flex items-center space-x-2 border-2 border-[#DFE104] bg-[#DFE104] text-black px-4 py-1 text-xs font-bold uppercase tracking-widest select-none">
          <Sparkles className="w-4 h-4 fill-black" />
          <span>KINETIC MOTION INTERFACES</span>
        </div>

        {/* Viewport-responsive massive typography */}
        <h1 className="heading-landing text-[clamp(3.5rem,11.5vw,13rem)] font-bold uppercase tracking-tighter leading-[0.8] text-left">
          BUILD WITH<br />
          <span className="text-[#DFE104]">PRECISION.</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-8 w-full items-start mt-4">
          <p className="text-xl md:text-2xl text-[#A1A1AA] leading-relaxed max-w-2xl font-medium tracking-tight">
            A premium collection of high-energy, brutalist React components designed for layout drama and kinetic rhythm. Zero rounding. Zero drop shadows. Maximum impact.
          </p>

          <div className="flex flex-wrap gap-4 md:justify-end">
            <Link
              href="/docs"
              className="btn-landing h-16 px-10 text-base"
            >
              EXPLORE COMPONENTS
              <ArrowRight className="ml-2 w-5 h-5 stroke-[3px]" />
            </Link>
            <a
              href="https://github.com/kasimkazmi/Modus-UI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-16 px-10 border-2 border-[#3F3F46] bg-transparent text-[#FAFAFA] text-base font-bold uppercase tracking-tighter transition-all hover:bg-[#FAFAFA] hover:text-black hover:border-[#FAFAFA] active:scale-95"
            >
              GITHUB REFERENCE
            </a>
          </div>
        </div>
      </div>

      {/* Infinite Scrolling Marquee */}
      <div className="relative z-10 w-full my-6 select-none pointer-events-none">
        <div className="marquee-container">
          <div className="marquee-content font-sans font-bold text-3xl md:text-5xl uppercase tracking-tighter text-[#FAFAFA]">
            {Array.from({ length: 4 }).flatMap(() => marqueeItems).map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-6">
                <span>{item}</span>
                <span className="text-[#DFE104]">★</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Connected brutalist features grid */}
      <div className="relative z-10 w-full max-w-[95vw] mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-[#3F3F46] border-2 border-[#3F3F46] mb-12">
        <div className="p-8 bg-black hover:bg-[#DFE104] text-[#FAFAFA] hover:text-black transition-colors duration-300 group">
          <div className="w-12 h-12 border-2 border-[#3F3F46] group-hover:border-black flex items-center justify-center mb-6">
            <Terminal className="w-6 h-6 text-[#DFE104] group-hover:text-black" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">01 / STACK Snappy</h3>
          <p className="text-xs text-[#A1A1AA] group-hover:text-black/80 leading-relaxed">
            All hover triggers execute instantly to deliver sharp brutalist tactile feedback on interactive buttons and navigation cells.
          </p>
        </div>

        <div className="p-8 bg-black hover:bg-[#DFE104] text-[#FAFAFA] hover:text-black transition-colors duration-300 group">
          <div className="w-12 h-12 border-2 border-[#3F3F46] group-hover:border-black flex items-center justify-center mb-6">
            <Compass className="w-6 h-6 text-[#DFE104] group-hover:text-black" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">02 / Apple Magnify</h3>
          <p className="text-xs text-[#A1A1AA] group-hover:text-black/80 leading-relaxed">
            Apple-style magnification dock calculates cursor proximity dynamically to animate icons elegantly using spring dynamics.
          </p>
        </div>

        <div className="p-8 bg-black hover:bg-[#DFE104] text-[#FAFAFA] hover:text-black transition-colors duration-300 group">
          <div className="w-12 h-12 border-2 border-[#3F3F46] group-hover:border-black flex items-center justify-center mb-6">
            <Layout className="w-6 h-6 text-[#DFE104] group-hover:text-black" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tighter mb-2">03 / Fluid Scaling</h3>
          <p className="text-xs text-[#A1A1AA] group-hover:text-black/80 leading-relaxed">
            Viewport clamp settings guarantee readable display grids and aggressive font hierarchy proportions from mobile up to desktop.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-[95vw] mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between border-t-2 border-[#3F3F46] text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest gap-4">
        <span>© 2026 MODUS UI. ALL RIGHTS RESERVED.</span>
        <span className="text-[#DFE104] hover:underline cursor-pointer">KINETIC DESIGN SYSTEMS</span>
      </footer>
    </main>
  );
}