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
      <div className="min-h-screen bg-[#FAF9F7] text-[#37322F] relative font-sans">
        {/* Real page-level sticky Navbar */}
        <div className="sticky top-0 z-50">
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E0DEDB] bg-white/95 text-[#605A57] font-medium text-xs hover:text-[#37322F] shadow-md transition-all hover:bg-white hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Docs
          </Link>
        </div>

        {/* Beautiful full-width long scrollable editorial content */}
        <main className="max-w-4xl mx-auto px-6 py-24 space-y-24">
          <header className="space-y-6 pt-12">
            <h1 className="font-serif text-5xl md:text-7xl leading-tight text-[#37322F]">
              Seamless Page Navigation.
            </h1>
            <p className="text-xl text-[#605A57] leading-relaxed max-w-2xl font-light">
              Scroll down this standalone page to observe the sticky navbar morph natively. It shrinks, scales the logo, and transitions breadcrumbs out of view to focus on the active reading pane.
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-8 pt-8">
            <div className="p-8 border border-[#E0DEDB] rounded-2xl bg-white/60 space-y-4">
              <h3 className="font-serif text-2xl text-[#37322F]">Designed for Focus</h3>
              <p className="text-[#605A57] leading-relaxed text-sm">
                By collapsing extra options, headers avoid visual distraction during deep reading or operations sessions.
              </p>
            </div>
            <div className="p-8 border border-[#E0DEDB] rounded-2xl bg-white/60 space-y-4">
              <h3 className="font-serif text-2xl text-[#37322F]">Micro-State Transitions</h3>
              <p className="text-[#605A57] leading-relaxed text-sm">
                Smooth layout transforms backed by Framer Motion provide tactile feedback to users exploring information.
              </p>
            </div>
          </section>

          {/* Dummy high-end sections to ensure plenty of scroll length */}
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="p-12 border border-[#E0DEDB] rounded-3xl bg-white space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#37322F]/40">Article {i + 1}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#37322F]/20" />
                <span className="text-xs text-[#605A57]">{10 + i} min read</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-[#37322F]">The Art of Restraint in Modern Interface Engineering</h2>
              <p className="text-[#605A57] leading-relaxed">
                As applications grow more complex, true sophistication lies in what we hide rather than what we display. Standalone sandboxes let developers assess components in their absolute purist form, free of surrounding sidebar noise.
              </p>
              <div className="space-y-3 pt-4">
                <div className="h-3 w-full bg-[#F7F5F3] rounded" />
                <div className="h-3 w-5/6 bg-[#F7F5F3] rounded" />
                <div className="h-3 w-2/3 bg-[#F7F5F3] rounded" />
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground font-sans relative">
      {/* Floating Back Link Badge */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href={`/docs/${name}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-background/90 text-muted-foreground font-medium text-xs hover:text-foreground shadow-sm transition-all hover:bg-background hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Docs
        </Link>
      </div>

      {/* Completely full screen rendering of the demo component */}
      <div className="w-full flex-1 flex items-center justify-center min-h-screen">
        <DemoComponent />
      </div>
    </div>
  );
}
