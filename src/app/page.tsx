import Link from "next/link";
import { ThemePicker } from "@/components/theme-picker";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background">
      {/* Subtle Warm Background Elements */}
      <div className="absolute -left-4 top-0 h-96 w-96 rounded-full bg-border opacity-20 mix-blend-multiply blur-[128px] filter" />
      <div className="absolute -right-4 bottom-0 h-[32rem] w-[32rem] rounded-full bg-secondary opacity-30 mix-blend-multiply blur-[128px] filter" />

      {/* Minimal Top Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg font-bold text-foreground"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="translate-y-[0.5px] text-primary-foreground"
            >
              <path d="M4 20V8a4 4 0 0 1 8 0v12" />
              <path d="M12 20V8a4 4 0 0 1 8 0v12" />
            </svg>
          </div>
          <span className="font-serif tracking-tight">Modus UI</span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-semibold text-muted-foreground">
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Components
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <span>Journal</span>
            <span className="scale-[0.9] rounded bg-border/40 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground/80">
              New
            </span>
          </Link>
          <ThemePicker />
        </nav>
      </header>

      {/* Main Hero Container */}
      <div className="relative z-10 mx-auto my-auto flex w-full max-w-[1400px] flex-col items-center px-6 text-center">
        <div className="mb-8 inline-flex items-center space-x-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary/60" />
          <span>Now with precision editorial design</span>
        </div>

        <h1 className="heading-landing mb-8 text-6xl md:text-8xl">
          Build with <span className="italic">precision</span>.
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-muted-foreground">
          A premium collection of React components designed for clarity, accuracy, and effortless
          trust. Built for teams who process the future.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/docs" className="btn-landing group h-14 px-10 text-lg">
            Explore Components
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="https://github.com/kasimkazmi/Modus-UI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-card px-10 font-semibold text-foreground transition-all hover:bg-secondary"
          >
            Github Reference
          </a>
        </div>
      </div>

      {/* Decorative Diagonal Stripes (Editorial Style) */}
      <div className="pointer-events-none absolute right-12 top-12 opacity-10">
        <div className="stripe-landing mb-4 w-40 bg-primary" />
        <div className="stripe-landing w-24 bg-primary" />
      </div>

      {/* Bottom Footer block */}
      <footer className="relative z-20 mx-auto mt-12 w-full max-w-[1400px] px-6 py-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
        <span>© 2026 Modus UI. Built with typographic precision.</span>
      </footer>
    </main>
  );
}
