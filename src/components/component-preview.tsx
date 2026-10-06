import React from "react";
import { getRegistryComponent } from "@/lib/registry";
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
import { ComponentPreviewClient } from "./component-preview-client";
import { CodeBlock } from "./code-block";

// Map of components for the preview sandbox
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  "magic-button": MagicButtonDemo,
  "morphing-navbar": MorphingNavbarDemo,
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
  "waves": WavesDemo,
  "letter-glitch": LetterGlitchDemo,
  "pixel-card": PixelCardDemo,
  "tilted-card": TiltedCardDemo,
  "magnet": MagnetDemo,
  "stack": StackDemo,
  "star-border": StarBorderDemo,
  "cursor-grid": CursorGridDemo,
  "scroll-velocity": ScrollVelocityDemo,
};

interface ComponentPreviewProps {
  name: string;
}

export const ComponentPreview = async ({ name }: ComponentPreviewProps) => {
  const component = getRegistryComponent(name);
  const Preview = COMPONENT_MAP[name];

  if (!component || !Preview) {
    return (
      <div className="text-red-500 p-8 border border-red-200 rounded-2xl bg-red-50/50 font-medium text-sm">
        Component &quot;{name}&quot; not found in the registry map.
      </div>
    );
  }

  const filePath = component.files[0] || `components/ui/${name}.tsx`;

  return (
    <ComponentPreviewClient
      name={name}
      preview={<Preview />}
      code={component.content}
      filePath={filePath}
      highlightedCode={<CodeBlock code={component.content} lang="tsx" minimal={true} />}
    />
  );
};