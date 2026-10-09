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
import ReflectiveCardDemo from "./reflective-card-demo";
import FluidGlassDemo from "./fluid-glass-demo";
import DomeGalleryDemo from "./dome-gallery-demo";
import ChromaGridDemo from "./chroma-grid-demo";
import BellToggleDemo from "./bell-toggle-demo";
import BranchedMenuDemo from "./branched-menu-demo";
import CallChipDemo from "./call-chip-demo";
import CodeSlotsDemo from "./code-slots-demo";
import CometDialDemo from "./comet-dial-demo";
import DodgeFieldDemo from "./dodge-field-demo";
import FlipCardDemo from "./flip-card-demo";
import FolderFloatDemo from "./folder-float-demo";
import FuseButtonDemo from "./fuse-button-demo";
import GlideSelectDemo from "./glide-select-demo";
import HoldButtonDemo from "./hold-button-demo";
import JellyRadioDemo from "./jelly-radio-demo";
import LatticeLoaderDemo from "./lattice-loader-demo";
import PaperCrumpleDemo from "./paper-crumple-demo";
import PeekRatingDemo from "./peek-rating-demo";
import PromptBarDemo from "./prompt-bar-demo";
import PulseHeartDemo from "./pulse-heart-demo";
import RefineFrameDemo from "./refine-frame-demo";
import RubberSegmentDemo from "./rubber-segment-demo";
import ScrubFieldDemo from "./scrub-field-demo";
import ShredderDemo from "./shredder-demo";
import SlideCommitDemo from "./slide-commit-demo";
import SlingButtonDemo from "./sling-button-demo";
import SloshGaugeDemo from "./slosh-gauge-demo";
import SpringCheckDemo from "./spring-check-demo";
import SquishSwitchDemo from "./squish-switch-demo";
import StatusMarkDemo from "./status-mark-demo";
import SwipeRowDemo from "./swipe-row-demo";
import SwipeToastDemo from "./swipe-toast-demo";
import TearTicketDemo from "./tear-ticket-demo";
import ThoughtLineDemo from "./thought-line-demo";
import VoicePillDemo from "./voice-pill-demo";
import WakeSliderDemo from "./wake-slider-demo";
import WarmTooltipDemo from "./warm-tooltip-demo";
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
  "reflective-card": ReflectiveCardDemo,
  "fluid-glass": FluidGlassDemo,
  "dome-gallery": DomeGalleryDemo,
  "chroma-grid": ChromaGridDemo,
  "bell-toggle": BellToggleDemo,
  "branched-menu": BranchedMenuDemo,
  "call-chip": CallChipDemo,
  "code-slots": CodeSlotsDemo,
  "comet-dial": CometDialDemo,
  "dodge-field": DodgeFieldDemo,
  "flip-card": FlipCardDemo,
  "folder-float": FolderFloatDemo,
  "fuse-button": FuseButtonDemo,
  "glide-select": GlideSelectDemo,
  "hold-button": HoldButtonDemo,
  "jelly-radio": JellyRadioDemo,
  "lattice-loader": LatticeLoaderDemo,
  "paper-crumple": PaperCrumpleDemo,
  "peek-rating": PeekRatingDemo,
  "prompt-bar": PromptBarDemo,
  "pulse-heart": PulseHeartDemo,
  "refine-frame": RefineFrameDemo,
  "rubber-segment": RubberSegmentDemo,
  "scrub-field": ScrubFieldDemo,
  shredder: ShredderDemo,
  "slide-commit": SlideCommitDemo,
  "sling-button": SlingButtonDemo,
  "slosh-gauge": SloshGaugeDemo,
  "spring-check": SpringCheckDemo,
  "squish-switch": SquishSwitchDemo,
  "status-mark": StatusMarkDemo,
  "swipe-row": SwipeRowDemo,
  "swipe-toast": SwipeToastDemo,
  "tear-ticket": TearTicketDemo,
  "thought-line": ThoughtLineDemo,
  "voice-pill": VoicePillDemo,
  "wake-slider": WakeSliderDemo,
  "warm-tooltip": WarmTooltipDemo,
};

/** Looks up a demo by a slug from the URL, which may not be a known component. */
export function getDemo(name: string): ComponentType | undefined {
  return Object.hasOwn(demos, name) ? demos[name as ComponentName] : undefined;
}
