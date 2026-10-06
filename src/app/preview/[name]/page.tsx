"use client";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Sparkles } from "lucide-react";

// Import all Demo Components from registry
import { MagicButtonDemo } from "@/registry/magic-button-demo";
import { MorphingNavbarDemo } from "@/registry/morphing-navbar-demo";
import { AnimatedButtonDemo } from "@/registry/animated-button-demo";
import { PulseButtonDemo } from "@/registry/pulse-button-demo";
import { RotatingCardDemo } from "@/registry/rotating-card-demo";
import { FloatingTextDemo } from "@/registry/floating-text-demo";
import { NotchFooterDemo } from "@/registry/notch-footer-demo";
import { TiltCardDemo } from "@/registry/tilt-card-demo";
import { FloatingDockDemo } from "@/registry/floating-dock-demo";
import { CircuitBackgroundDemo } from "@/registry/circuit-background-demo";
import FocusCardDemo from "@/registry/focus-card-demo";
import ExpandableShowcaseDemo from "@/registry/expandable-showcase-demo";
import ShimmerTextDemo from "@/registry/shimmer-text-demo";
import KineticCarouselDemo from "@/registry/kinetic-carousel-demo";
import ProcessStepperDemo from "@/registry/process-stepper-demo";
import AnimatedListDemo from "@/registry/animated-list-demo";
import MasonryGridDemo from "@/registry/masonry-grid-demo";
import AuroraBackgroundDemo from "@/registry/aurora-background-demo";
import GridMotionDemo from "@/registry/grid-motion-demo";
import BlurTextDemo from "@/registry/blur-text-demo";
import SplitTextDemo from "@/registry/split-text-demo";
import DecryptedTextDemo from "@/registry/decrypted-text-demo";
import BounceCardsDemo from "@/registry/bounce-cards-demo";
import FlowingMenuDemo from "@/registry/flowing-menu-demo";
import TrueFocusDemo from "@/registry/true-focus-demo";
import BorderGlowDemo from "@/registry/border-glow-demo";
import GradientTextDemo from "@/registry/gradient-text-demo";
import ClickSparkDemo from "@/registry/click-spark-demo";
import SpotlightCardDemo from "@/registry/spotlight-card-demo";
import TextPressureDemo from "@/registry/text-pressure-demo";
import WavesDemo from "@/registry/waves-demo";
import LetterGlitchDemo from "@/registry/letter-glitch-demo";
import PixelCardDemo from "@/registry/pixel-card-demo";
import TiltedCardDemo from "@/registry/tilted-card-demo";
import MagnetDemo from "@/registry/magnet-demo";
import StackDemo from "@/registry/stack-demo";
import StarBorderDemo from "@/registry/star-border-demo";
import CursorGridDemo from "@/registry/cursor-grid-demo";
import ScrollVelocityDemo from "@/registry/scroll-velocity-demo";
import LiquidTabsDemo from "@/registry/liquid-tabs-demo";
import ScratchToRevealDemo from "@/registry/scratch-to-reveal-demo";

// Recreate sticky page-level Navbar specifically for standalone live viewing
import { MorphingNavbar } from "@/registry/morphing-navbar";

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  "magic-button": MagicButtonDemo,
  "animated-button": AnimatedButtonDemo,
  "pulse-button": PulseButtonDemo,
  "rotating-card": RotatingCardDemo,
  "floating-text": FloatingTextDemo,
  "notch-footer": NotchFooterDemo,
  "tilt-card": TiltCardDemo,
  "floating-dock": FloatingDockDemo,
  "circuit-background": CircuitBackgroundDemo,
  "focus-card": FocusCardDemo,
  "expandable-showcase": ExpandableShowcaseDemo,
  "shimmer-text": ShimmerTextDemo,
  "kinetic-carousel": KineticCarouselDemo,
  "process-stepper": ProcessStepperDemo,
  "animated-list": AnimatedListDemo,
  "masonry-grid": MasonryGridDemo,
  "aurora-background": AuroraBackgroundDemo,
  "grid-motion": GridMotionDemo,
  "blur-text": BlurTextDemo,
  "split-text": SplitTextDemo,
  "decrypted-text": DecryptedTextDemo,
  "bounce-cards": BounceCardsDemo,
  "flowing-menu": FlowingMenuDemo,
  "true-focus": TrueFocusDemo,
  "border-glow": BorderGlowDemo,
  "gradient-text": GradientTextDemo,
  "click-spark": ClickSparkDemo,
  "spotlight-card": SpotlightCardDemo,
  "text-pressure": TextPressureDemo,
  waves: WavesDemo,
  "letter-glitch": LetterGlitchDemo,
  "pixel-card": PixelCardDemo,
  "tilted-card": TiltedCardDemo,
  magnet: MagnetDemo,
  stack: StackDemo,
  "star-border": StarBorderDemo,
  "cursor-grid": CursorGridDemo,
  "scroll-velocity": ScrollVelocityDemo,
  "liquid-tabs": LiquidTabsDemo,
  "scratch-to-reveal": ScratchToRevealDemo,
};

interface PreviewPageProps {
  params: {
    name: string;
  };
}

export default function StandalonePreviewPage({ params }: PreviewPageProps) {
  const { name } = params;

  // Custom Full-Page scroll template for Navbar
  if (name === "morphing-navbar") {
    return (
      <div className="relative min-h-screen bg-[#FAF9F7] font-sans text-[#37322F]">
        {/* Real page-level sticky Navbar */}
        <div className="sticky top-0 z-50" data-preview-stage>
          <MorphingNavbar
            title="Morphing Navbar"
            logo={GraduationCap}
            breadcrumbSteps={[{ label: "Live Demo" }, { label: "Full View" }]}
          />
        </div>

        {/* Back Link Floating Badge */}
        <div className="fixed bottom-6 left-6 z-50">
          <Link
            href="/docs/morphing-navbar"
            className="flex items-center gap-2 rounded-full border border-[#E0DEDB] bg-white/95 px-4 py-2.5 text-xs font-medium text-[#605A57] shadow-md transition-all hover:scale-105 hover:bg-white hover:text-[#37322F] active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Docs
          </Link>
        </div>

        {/* Beautiful full-width long scrollable editorial content */}
        <main className="mx-auto max-w-4xl space-y-24 px-6 py-24">
          <header className="space-y-6 pt-12">
            <h1 className="font-serif text-5xl leading-tight text-[#37322F] md:text-7xl">
              Seamless Page Navigation.
            </h1>
            <p className="max-w-2xl text-xl font-light leading-relaxed text-[#605A57]">
              Scroll down this standalone page to observe the sticky navbar morph natively. It
              shrinks, scales the logo, and transitions breadcrumbs out of view to focus on the
              active reading pane.
            </p>
          </header>

          <section className="grid gap-8 pt-8 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-[#E0DEDB] bg-white/60 p-8">
              <h3 className="font-serif text-2xl text-[#37322F]">Designed for Focus</h3>
              <p className="text-sm leading-relaxed text-[#605A57]">
                By collapsing extra options, headers avoid visual distraction during deep reading or
                operations sessions.
              </p>
            </div>
            <div className="space-y-4 rounded-2xl border border-[#E0DEDB] bg-white/60 p-8">
              <h3 className="font-serif text-2xl text-[#37322F]">Micro-State Transitions</h3>
              <p className="text-sm leading-relaxed text-[#605A57]">
                Smooth layout transforms backed by Framer Motion provide tactile feedback to users
                exploring information.
              </p>
            </div>
          </section>

          {/* Dummy high-end sections to ensure plenty of scroll length */}
          {Array.from({ length: 6 }).map((_, i) => (
            <article
              key={i}
              className="space-y-6 rounded-3xl border border-[#E0DEDB] bg-white p-12 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#37322F]/40">
                  Article {i + 1}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#37322F]/20" />
                <span className="text-xs text-[#605A57]">{10 + i} min read</span>
              </div>
              <h2 className="font-serif text-3xl text-[#37322F] md:text-4xl">
                The Art of Restraint in Modern Interface Engineering
              </h2>
              <p className="leading-relaxed text-[#605A57]">
                As applications grow more complex, true sophistication lies in what we hide rather
                than what we display. Standalone sandboxes let developers assess components in their
                absolute purist form, free of surrounding sidebar noise.
              </p>
              <div className="space-y-3 pt-4">
                <div className="h-3 w-full rounded bg-[#F7F5F3]" />
                <div className="h-3 w-5/6 rounded bg-[#F7F5F3]" />
                <div className="h-3 w-2/3 rounded bg-[#F7F5F3]" />
              </div>
            </article>
          ))}
        </main>
      </div>
    );
  }

  const DemoComponent = COMPONENT_MAP[name];

  if (!DemoComponent) {
    notFound();
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background font-sans text-foreground">
      {/* Floating Back Link Badge */}
      <div className="fixed left-6 top-6 z-50">
        <Link
          href={`/docs/${name}`}
          className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:scale-105 hover:bg-background hover:text-foreground active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Docs
        </Link>
      </div>

      {/* Completely full screen rendering of the demo component */}
      <div
        className="flex min-h-screen w-full flex-1 items-center justify-center"
        data-preview-stage
      >
        <DemoComponent />
      </div>
    </div>
  );
}
