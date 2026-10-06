import type { ComponentType } from "react";
import { MagicButtonDemo } from "./magic-button-demo";
import { MorphingNavbarDemo } from "./morphing-navbar-demo";
import { AnimatedButtonDemo } from "./animated-button-demo";
import { PulseButtonDemo } from "./pulse-button-demo";
import { RotatingCardDemo } from "./rotating-card-demo";
import { FloatingTextDemo } from "./floating-text-demo";
import { NotchFooterDemo } from "./notch-footer-demo";
import { TiltCardDemo } from "./tilt-card-demo";
import { FloatingDockDemo } from "./floating-dock-demo";
import { CircuitBackgroundDemo } from "./circuit-background-demo";
import FocusCardDemo from "./focus-card-demo";
import ExpandableShowcaseDemo from "./expandable-showcase-demo";
import ShimmerTextDemo from "./shimmer-text-demo";
import KineticCarouselDemo from "./kinetic-carousel-demo";
import ProcessStepperDemo from "./process-stepper-demo";
import AnimatedListDemo from "./animated-list-demo";
import MasonryGridDemo from "./masonry-grid-demo";
import AuroraBackgroundDemo from "./aurora-background-demo";
import GridMotionDemo from "./grid-motion-demo";
import BlurTextDemo from "./blur-text-demo";
import SplitTextDemo from "./split-text-demo";
import DecryptedTextDemo from "./decrypted-text-demo";
import BounceCardsDemo from "./bounce-cards-demo";
import FlowingMenuDemo from "./flowing-menu-demo";
import TrueFocusDemo from "./true-focus-demo";
import BorderGlowDemo from "./border-glow-demo";
import GradientTextDemo from "./gradient-text-demo";
import ClickSparkDemo from "./click-spark-demo";
import SpotlightCardDemo from "./spotlight-card-demo";
import TextPressureDemo from "./text-pressure-demo";
import WavesDemo from "./waves-demo";
import LetterGlitchDemo from "./letter-glitch-demo";
import PixelCardDemo from "./pixel-card-demo";
import TiltedCardDemo from "./tilted-card-demo";
import MagnetDemo from "./magnet-demo";
import StackDemo from "./stack-demo";
import StarBorderDemo from "./star-border-demo";
import CursorGridDemo from "./cursor-grid-demo";
import ScrollVelocityDemo from "./scroll-velocity-demo";
import LiquidTabsDemo from "./liquid-tabs-demo";
import ScratchToRevealDemo from "./scratch-to-reveal-demo";
import AnimatedBeamDemo from "./animated-beam-demo";
import GravityTextSwapDemo from "./gravity-text-swap-demo";
import BorderBeamDemo from "./border-beam-demo";
import OrbitingElementsDemo from "./orbiting-elements-demo";
import BentoGridDemo from "./bento-grid-demo";
import FlipWordsDemo from "./flip-words-demo";
import DecayCardDemo from "./decay-card-demo";
import BlobCursorDemo from "./blob-cursor-demo";
import FuzzyTextDemo from "./fuzzy-text-demo";
import MagnetLinesDemo from "./magnet-lines-demo";
import ComparisonSliderDemo from "./comparison-slider-demo";
import DockDemo from "./dock-demo";
import ProgressRingDemo from "./progress-ring-demo";
import MarqueeDemo from "./marquee-demo";
import type { ComponentName } from "./index";

/** The demo rendered for each component in docs and standalone previews. */
export const demos: Record<ComponentName, ComponentType> = {
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
  "animated-beam": AnimatedBeamDemo,
  "gravity-text-swap": GravityTextSwapDemo,
  "border-beam": BorderBeamDemo,
  "orbiting-elements": OrbitingElementsDemo,
  "bento-grid": BentoGridDemo,
  "flip-words": FlipWordsDemo,
  "decay-card": DecayCardDemo,
  "blob-cursor": BlobCursorDemo,
  "fuzzy-text": FuzzyTextDemo,
  "magnet-lines": MagnetLinesDemo,
  "comparison-slider": ComparisonSliderDemo,
  dock: DockDemo,
  "progress-ring": ProgressRingDemo,
  marquee: MarqueeDemo,
};

/** Looks up a demo by a slug from the URL, which may not be a known component. */
export function getDemo(name: string): ComponentType | undefined {
  return Object.hasOwn(demos, name) ? demos[name as ComponentName] : undefined;
}
