"use client";
// Ported from ThreeUI Community's Skeuomorphic Toggle (MIT, © 2026 Meng To).

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PointerEvent,
  type RefObject,
} from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type ToggleMode = "dark" | "light";
type ToggleModePreference = ToggleMode | "auto";
type SkeuomorphicToggleVariant = "classic" | "modern" | "glass" | "shader";

interface SkeuomorphicToggleProps {
  variant?: SkeuomorphicToggleVariant;
  mode?: ToggleModePreference;
  defaultOn?: boolean;
  label?: string;
  speed?: number;
  size?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  onChange?: (on: boolean) => void;
  className?: string;
}

interface VariantProps {
  mode: ToggleMode;
  on: boolean;
  flip: () => void;
  label: string;
  speed: number;
  size: number;
  still: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const SYSTEM_SANS =
  'ui-sans-serif, -apple-system, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/* ---------------------------------------------------------------------------
   Appearance: the site's data-theme / data-scheme / class wins, then the OS.
--------------------------------------------------------------------------- */

function readAutomaticToggleMode(): ToggleMode {
  if (typeof document === "undefined" || typeof window === "undefined") return "dark";
  const root = document.documentElement;
  const declared = root.dataset.theme ?? root.dataset.scheme;
  if (declared === "light" || declared === "dark") return declared;
  if (root.classList.contains("light")) return "light";
  if (root.classList.contains("dark")) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useToggleMode(preference: ToggleModePreference): ToggleMode {
  const enabled = preference === "auto";
  const [automatic, setAutomatic] = useState<ToggleMode>("dark");

  useEffect(() => {
    if (!enabled) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setAutomatic(readAutomaticToggleMode());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-scheme", "data-theme"],
    });
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, [enabled]);

  if (preference === "light" || preference === "dark") return preference;
  return automatic;
}

/* ---------------------------------------------------------------------------
   Frame driver shared by the WebGL variants: runs while on screen and the tab
   is visible; with reduced motion it only draws a settled frame on demand.
--------------------------------------------------------------------------- */

interface FrameScene {
  frame: (now: number, still: boolean) => void;
}

function useFrameLoop(
  hostRef: RefObject<HTMLDivElement | null>,
  sceneRef: MutableRefObject<FrameScene | null>,
  still: boolean,
) {
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let raf = 0;
    let visible = true;

    const tick = (now: number) => {
      raf = 0;
      const scene = sceneRef.current;
      if (!scene) return;
      scene.frame(now, still);
      if (!still && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (visible && !document.hidden) kick();
    };
    kickRef.current = kick;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      kickRef.current = () => {};
    };
  }, [hostRef, sceneRef, still]);

  return kickRef;
}

/* ---------------------------------------------------------------------------
   Classic: the original tactile export.
--------------------------------------------------------------------------- */

const CLASSIC = {
  light: {
    stage: "#f8fafc",
    onBg: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px), linear-gradient(180deg, #dbeafe 0%, #93c5fd 100%)",
    offBg:
      "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px), linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)",
    onShadow:
      "inset 0 4px 8px rgba(0,0,0,0.1), inset 0 -2px 4px rgba(255,255,255,0.7), 0 0 0 6px rgba(239, 246, 255, 0.8), 0 0 25px 5px rgba(96, 165, 250, 0.4)",
    offShadow:
      "inset 0 4px 8px rgba(0,0,0,0.12), inset 0 -2px 4px rgba(255,255,255,0.55), 0 0 0 6px rgba(241, 245, 249, 0.9), 0 0 18px 2px rgba(148, 163, 184, 0.25)",
    onBorder: "#60a5fa",
    offBorder: "#94a3b8",
    thumbBg: "linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%)",
    thumbBorder: "#e0edfa",
  },
  dark: {
    stage: "#0b1220",
    onBg: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.035) 2px, rgba(255,255,255,0.035) 4px), linear-gradient(180deg, #1e3a8a 0%, #172554 100%)",
    offBg:
      "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.025) 2px, rgba(255,255,255,0.025) 4px), linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
    onShadow:
      "inset 0 5px 10px rgba(0,0,0,0.52), inset 0 -2px 4px rgba(147,197,253,0.24), 0 0 0 6px rgba(15,23,42,0.96), 0 0 26px 5px rgba(59,130,246,0.42)",
    offShadow:
      "inset 0 5px 10px rgba(0,0,0,0.56), inset 0 -2px 4px rgba(148,163,184,0.12), 0 0 0 6px rgba(15,23,42,0.96), 0 0 18px 2px rgba(30,64,175,0.2)",
    onBorder: "#3b82f6",
    offBorder: "#334155",
    thumbBg: "linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)",
    thumbBorder: "#64748b",
  },
} as const;

const CLASSIC_ON_THUMB_SHADOW =
  "0 10px 20px -4px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(0,0,0,0.04), inset 0 3px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(96, 165, 250, 0.2)";
const CLASSIC_OFF_THUMB_SHADOW =
  "0 8px 16px -4px rgba(15, 23, 42, 0.18), 0 3px 5px -2px rgba(0,0,0,0.05), inset 0 3px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(148, 163, 184, 0.25)";

function ClassicToggle({ mode, on, flip, label, size, still }: VariantProps) {
  const palette = CLASSIC[mode];
  const ease = still ? "none" : undefined;
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: palette.stage, fontFamily: SYSTEM_SANS }}
    >
      <div
        role="switch"
        aria-checked={on}
        aria-label={label}
        tabIndex={0}
        onClick={flip}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            flip();
          }
        }}
        className="relative z-10 box-border h-16 w-48 cursor-pointer select-none rounded-full p-1.5"
        style={{
          background: on ? palette.onBg : palette.offBg,
          boxShadow: on ? palette.onShadow : palette.offShadow,
          border: `1px solid ${on ? palette.onBorder : palette.offBorder}`,
          transform: size === 1 ? undefined : `scale(${clamp(size, 0.35, 2.5)})`,
          transition:
            ease ?? "background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease",
        }}
      >
        <div
          className="absolute left-1.5 top-1.5 box-border flex h-[calc(100%-0.75rem)] w-[116px] items-center justify-center rounded-full"
          style={{
            background: palette.thumbBg,
            boxShadow: on ? CLASSIC_ON_THUMB_SHADOW : CLASSIC_OFF_THUMB_SHADOW,
            border: `1px solid ${palette.thumbBorder}`,
            /* clientWidth 190 - thumb clientWidth 114 - 12 = 64px travel, as the original measures it. */
            transform: `translateX(${on ? 64 : 0}px)`,
            transition:
              ease ?? "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease",
          }}
        >
          <span
            className="text-sm font-normal tracking-wide"
            style={{
              textShadow: "0 1px 1px rgba(255,255,255,0.9)",
              opacity: on ? 1 : 0.72,
              color: on ? "#1e293b" : "#475569",
              transition: ease ?? "color 0.35s ease, opacity 0.35s ease",
            }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Modern: flat switch with a sprung, squashing knob.
--------------------------------------------------------------------------- */

const MODERN = {
  light: {
    track: "#e6e8ec",
    trackOn: "#2f6bff",
    edge: "rgba(9, 12, 20, 0.09)",
    edgeOn: "rgba(9, 12, 20, 0.06)",
    thumb: "#ffffff",
    thumbShadow: "0 1px 1px rgba(9, 12, 20, 0.1), 0 6px 14px -4px rgba(9, 12, 20, 0.28)",
    mark: "#2f6bff",
    caption: "rgba(15, 20, 32, 0.42)",
    captionOn: "rgba(15, 20, 32, 0.7)",
    focus: "rgba(47, 107, 255, 0.32)",
    stage: "#f7f8fa",
    stageTop: "#ffffff",
    stageBottom: "#eceff4",
    halo: "rgba(47, 107, 255, 0.1)",
  },
  dark: {
    track: "#22262f",
    trackOn: "#3b7bff",
    edge: "rgba(255, 255, 255, 0.1)",
    edgeOn: "rgba(255, 255, 255, 0.16)",
    thumb: "#f2f4f8",
    thumbShadow: "0 1px 1px rgba(0, 0, 0, 0.5), 0 8px 18px -6px rgba(0, 0, 0, 0.7)",
    mark: "#1f5cf0",
    caption: "rgba(232, 237, 247, 0.4)",
    captionOn: "rgba(232, 237, 247, 0.74)",
    focus: "rgba(94, 145, 255, 0.4)",
    stage: "#0c0e13",
    stageTop: "#14171f",
    stageBottom: "#06070a",
    halo: "rgba(59, 123, 255, 0.16)",
  },
} as const;

const SPRING_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function ModernToggle({ mode, on, flip, label, size, still }: VariantProps) {
  const palette = MODERN[mode];
  const switchRef = useRef<HTMLButtonElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const motion = useRef({ value: on ? 1 : 0, velocity: 0 });
  const [focused, setFocused] = useState(false);

  /* A light spring: the knob leans into the travel, trails a little squash
     and settles with one small overshoot (damping ratio ~0.67). */
  useEffect(() => {
    const control = switchRef.current;
    const thumb = thumbRef.current;
    if (!control || !thumb) return undefined;
    const target = on ? 1 : 0;
    const state = motion.current;
    let handle = 0;
    let last = performance.now();

    const apply = (progress: number, speed: number) => {
      const travel = Math.max(0, control.clientWidth - thumb.offsetLeft * 2 - thumb.offsetWidth);
      const lean = Math.min(1, Math.abs(speed) / 6);
      const scaleX = 1 + lean * 0.16;
      const scaleY = 1 - lean * 0.1;
      thumb.style.transformOrigin = speed >= 0 ? "right center" : "left center";
      thumb.style.transform = `translate3d(${(progress * travel).toFixed(2)}px, 0, 0) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
    };

    const settle = () => {
      state.value = target;
      state.velocity = 0;
      apply(target, 0);
    };

    if (still) {
      settle();
      const observer = new ResizeObserver(settle);
      observer.observe(control);
      return () => observer.disconnect();
    }

    const step = (now: number) => {
      const delta = Math.min(0.032, (now - last) / 1000);
      last = now;
      const stiffness = 210;
      const damping = 19.5;
      state.velocity += ((target - state.value) * stiffness - state.velocity * damping) * delta;
      state.value += state.velocity * delta;
      apply(state.value, state.velocity);
      if (Math.abs(target - state.value) < 0.0006 && Math.abs(state.velocity) < 0.006) {
        settle();
        return;
      }
      handle = requestAnimationFrame(step);
    };

    handle = requestAnimationFrame(step);
    const observer = new ResizeObserver(() => apply(state.value, 0));
    observer.observe(control);
    return () => {
      cancelAnimationFrame(handle);
      observer.disconnect();
    };
  }, [on, still]);

  const t = (value: string) => (still ? "none" : value);
  const markBase: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    transition: t(`opacity 0.28s ease, transform 0.34s ${SPRING_EASE}`),
  };

  return (
    <div
      className="relative box-border grid h-full w-full place-items-center overflow-hidden"
      style={{
        isolation: "isolate",
        containerType: "size",
        background: `linear-gradient(180deg, ${palette.stageTop} 0%, ${palette.stage} 62%, ${palette.stageBottom} 100%)`,
        colorScheme: mode,
        fontFamily: SYSTEM_SANS,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: "min(72cqw, 620px)",
          height: "min(72cqh, 380px)",
          background: `radial-gradient(closest-side, ${palette.halo}, transparent 72%)`,
          opacity: on ? 1 : 0,
          transform: on ? "scale(1)" : "scale(0.86)",
          transition: t(`opacity 0.5s ease, transform 0.6s ${SPRING_EASE}`),
        }}
      />
      <div
        className="relative grid justify-items-center"
        style={{ gap: "clamp(12px, 2.4cqh, 24px)", transform: `scale(${clamp(size, 0.35, 2.5)})` }}
      >
        <button
          ref={switchRef}
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          onClick={flip}
          onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
          onBlur={() => setFocused(false)}
          className="relative block cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 outline-none"
          style={{
            width: "clamp(104px, min(18cqw, 33cqh), 330px)",
            aspectRatio: "44 / 25",
            containerType: "inline-size",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{
              background: on ? palette.trackOn : palette.track,
              boxShadow: `inset 0 0 0 1px ${on ? palette.edgeOn : palette.edge}${focused ? `, 0 0 0 4px ${palette.focus}` : ""}`,
              transition: t(`background 0.46s ${SPRING_EASE}, box-shadow 0.46s ease`),
            }}
          />
          <span
            ref={thumbRef}
            aria-hidden="true"
            className="absolute grid place-items-center rounded-full"
            style={{
              top: "4.6cqw",
              left: "4.6cqw",
              width: "47.6cqw",
              height: "47.6cqw",
              background: palette.thumb,
              boxShadow: palette.thumbShadow,
              willChange: "transform",
            }}
          >
            <span className="relative h-[36%] w-[36%]" style={{ color: palette.mark }}>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  ...markBase,
                  opacity: on ? 1 : 0,
                  transform: on ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-18deg)",
                }}
              >
                <path d="M5 12.8 9.6 17.4 19 8" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  ...markBase,
                  opacity: on ? 0 : 0.34,
                  transform: on ? "scale(0.6)" : "scale(1)",
                }}
              >
                <path d="M6.5 12h11" />
              </svg>
            </span>
          </span>
        </button>
        <p
          className="m-0 flex items-baseline uppercase"
          style={{
            gap: "0.55em",
            fontSize: "clamp(11px, 0.85cqw, 16px)",
            letterSpacing: "0.08em",
            color: on ? palette.captionOn : palette.caption,
            transition: t("color 0.4s ease"),
          }}
        >
          <span>{label}</span>
          <b className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
            {on ? "On" : "Off"}
          </b>
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Glass: Three.js transmission capsule with a lit filament and a lens knob.
--------------------------------------------------------------------------- */

type GlassPalette = {
  backdrop: number;
  backdropFloor: number;
  shadow: number;
  glass: number;
  attenuationOff: number;
  attenuationOn: number;
  knob: number;
  knobTransmission: number;
  knobEnv: number;
  shellEmissive: number;
  filamentOn: number;
  filamentOff: number;
  key: number;
  keyIntensity: number;
  ambient: number;
  envSkyTop: number;
  envSkyBottom: number;
  envFloor: number;
  envSoftbox: number;
  envIntensity: number;
};

const GLASS_PALETTES: Record<ToggleMode, GlassPalette> = {
  light: {
    backdrop: 0xe9ecf1,
    backdropFloor: 0xdfe3ea,
    shadow: 0.3,
    glass: 0xf4f8ff,
    attenuationOff: 0xdfe8f5,
    attenuationOn: 0x2f6bff,
    knob: 0xfdfeff,
    knobTransmission: 0.78,
    knobEnv: 1.3,
    shellEmissive: 0.02,
    filamentOn: 0x2f6bff,
    filamentOff: 0xc4ccd8,
    key: 0xffffff,
    keyIntensity: 0.18,
    ambient: 0.015,
    envSkyTop: 0xffffff,
    envSkyBottom: 0x9aa4b4,
    envFloor: 0x2a3040,
    envSoftbox: 0xffffff,
    envIntensity: 1.0,
  },
  dark: {
    backdrop: 0x0a0b0f,
    backdropFloor: 0x06070a,
    shadow: 0.55,
    glass: 0xe8eefb,
    attenuationOff: 0x7f93b8,
    attenuationOn: 0x2f6bff,
    knob: 0xf2f6ff,
    knobTransmission: 0.58,
    knobEnv: 2.3,
    shellEmissive: 0.62,
    filamentOn: 0x3b7bff,
    filamentOff: 0x161a24,
    key: 0xd8e4ff,
    keyIntensity: 0.12,
    ambient: 0.006,
    envSkyTop: 0xdde6f5,
    envSkyBottom: 0x1a2030,
    envFloor: 0x04050a,
    envSoftbox: 0xffffff,
    envIntensity: 0.9,
  },
};

const GLASS_STAGE: Record<ToggleMode, string> = { light: "#eef1f6", dark: "#08090d" };

const TRACK_RADIUS = 0.6;
const TRACK_LENGTH = 1.2;
const THUMB_RADIUS = TRACK_RADIUS - 0.225;
const TRAVEL = (TRACK_LENGTH / 2) * 0.8;
const CONTROL_WIDTH = TRACK_LENGTH + TRACK_RADIUS * 2;
const VIEW_HEIGHT = (TRACK_RADIUS * 2) / 0.13;
const WIDTH_SHARE = 0.18;
/* The original ran three r149 legacy lights; physical lights need a PI factor. */
const LEGACY_LIGHT = Math.PI;

/* Hex colours enter three's linear working space through ColorManagement. */
const linear = (hex: number) => new THREE.Color(hex);

type Softbox = {
  u: number;
  v: number;
  halfWidth: number;
  halfHeight: number;
  intensity: number;
  feather: number;
  warm: number;
};

/* An HDR studio: the softboxes run far above the sky so the tone mapper blows
   them into hard specular streaks that make the surface read as glass. */
const SOFTBOXES: readonly Softbox[] = [
  { u: 0.3, v: 0.2, halfWidth: 0.155, halfHeight: 0.135, intensity: 19, feather: 0.86, warm: 0.04 },
  { u: 0.52, v: 0.115, halfWidth: 0.17, halfHeight: 0.04, intensity: 15, feather: 0.9, warm: 0 },
  {
    u: 0.86,
    v: 0.31,
    halfWidth: 0.085,
    halfHeight: 0.09,
    intensity: 10,
    feather: 0.92,
    warm: -0.06,
  },
  { u: 0.25, v: 0.5, halfWidth: 0.1, halfHeight: 0.2, intensity: 6.5, feather: 0.8, warm: 0 },
  {
    u: 0.95,
    v: 0.21,
    halfWidth: 0.028,
    halfHeight: 0.032,
    intensity: 70,
    feather: 0.45,
    warm: 0.02,
  },
  { u: 0.5, v: 0.82, halfWidth: 0.5, halfHeight: 0.22, intensity: 0.5, feather: 1, warm: 0.02 },
];

function smoothFalloff(distance: number, extent: number, feather: number) {
  const inner = extent * (1 - feather);
  if (distance <= inner) return 1;
  if (distance >= extent) return 0;
  const t = (distance - inner) / (extent - inner);
  return 1 - t * t * (3 - 2 * t);
}

function buildEnvironmentTexture(palette: GlassPalette) {
  const width = 512;
  const height = 256;
  const data = new Float32Array(width * height * 4);
  const skyTop = linear(palette.envSkyTop);
  const skyBottom = linear(palette.envSkyBottom);
  const floor = linear(palette.envFloor);
  const box = linear(palette.envSoftbox);

  for (let y = 0; y < height; y += 1) {
    const v = 1 - y / (height - 1);
    const ground = smoothFalloff(Math.max(0, 0.62 - v), 0.34, 1);
    const skyMix = Math.min(1, v / 0.56);
    const skyR = skyTop.r + (skyBottom.r - skyTop.r) * skyMix;
    const skyG = skyTop.g + (skyBottom.g - skyTop.g) * skyMix;
    const skyB = skyTop.b + (skyBottom.b - skyTop.b) * skyMix;
    const fade = 1 - Math.max(0, v - 0.62) * 1.1;
    const baseR = skyR + (floor.r * fade - skyR) * ground;
    const baseG = skyG + (floor.g * fade - skyG) * ground;
    const baseB = skyB + (floor.b * fade - skyB) * ground;

    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      let r = baseR;
      let g = baseG;
      let b = baseB;
      for (const light of SOFTBOXES) {
        let du = Math.abs(u - light.u);
        if (du > 0.5) du = 1 - du;
        const dv = Math.abs(v - light.v);
        const radial = Math.sqrt(
          (du / light.halfWidth) * (du / light.halfWidth) +
            (dv / light.halfHeight) * (dv / light.halfHeight),
        );
        if (radial >= 1) continue;
        const strength = smoothFalloff(radial, 1, light.feather) * light.intensity;
        r += box.r * strength * (1 + light.warm);
        g += box.g * strength;
        b += box.b * strength * (1 - light.warm);
      }
      const index = (y * width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 1;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function buildMicroTextures() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const image = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);
  let seed = 0x9e3779b9;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 100000) / 100000;
  };

  const coarse = new Float32Array(64 * 64);
  for (let i = 0; i < coarse.length; i += 1) coarse[i] = random();
  const at64 = (ax: number, ay: number) => coarse[(ay & 63) * 64 + (ax & 63)];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * 64;
      const v = (y / size) * 64;
      const x0 = Math.floor(u);
      const y0 = Math.floor(v);
      const fx = u - x0;
      const fy = v - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const a = at64(x0, y0);
      const b = at64(x0 + 1, y0);
      const c = at64(x0, y0 + 1);
      const d = at64(x0 + 1, y0 + 1);
      const value = (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
      const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      height[y * size + x] = value * 0.86 + (grain - Math.floor(grain)) * 0.14;
    }
  }

  for (let i = 0; i < height.length; i += 1) {
    const value = 168 + height[i] * 78;
    image.data[i * 4] = value;
    image.data[i * 4 + 1] = value;
    image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const roughness = new THREE.CanvasTexture(canvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext("2d");
  if (!normalCtx) return { roughness, normal: null };
  const normalImage = normalCtx.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = at(x + 1, y) - at(x - 1, y);
      const dy = at(x, y + 1) - at(x, y - 1);
      const index = (y * size + x) * 4;
      normalImage.data[index] = 128 + dx * 110;
      normalImage.data[index + 1] = 128 - dy * 110;
      normalImage.data[index + 2] = 255;
      normalImage.data[index + 3] = 255;
    }
  }
  normalCtx.putImageData(normalImage, 0, 0);
  const normal = new THREE.CanvasTexture(normalCanvas);
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  return { roughness, normal };
}

const BACKDROP_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const BACKDROP_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uAspect;
uniform float uShadow;
uniform vec3 uBackdrop;
uniform vec3 uFloor;

void main() {
  vec2 p = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
  vec3 color = mix(uFloor, uBackdrop, smoothstep(-0.42, 0.16, p.y));

  vec2 core = (p - vec2(0.0, -0.052)) / vec2(0.148, 0.038);
  vec2 spread = (p - vec2(0.0, -0.062)) / vec2(0.28, 0.1);
  float occlusion = exp(-dot(core, core) * 0.9) * 0.72 + exp(-dot(spread, spread) * 0.8) * 0.42;
  color *= 1.0 - clamp(occlusion, 0.0, 1.0) * uShadow;

  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) * 0.0035;

  gl_FragColor = vec4(color, 1.0);
}
`;

interface ToggleScene extends FrameScene {
  setMode: (mode: ToggleMode) => void;
  setSpeed: (speed: number) => void;
  setSize: (size: number) => void;
  setOn: (on: boolean) => void;
  setPointer: (x: number, y: number) => void;
  resize: (width: number, height: number) => void;
  measureSwitch: () => { width: number; height: number };
  dispose: () => void;
}

function createGlassScene(
  canvas: HTMLCanvasElement,
  mode: ToggleMode,
  speed: number,
  on: boolean,
): ToggleScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 40);
  camera.position.set(0, 0.22, 9.4);
  camera.lookAt(0, 0, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const backdropUniforms = {
    uAspect: { value: 1 },
    uShadow: { value: GLASS_PALETTES[mode].shadow },
    uBackdrop: { value: linear(GLASS_PALETTES[mode].backdrop) },
    uFloor: { value: linear(GLASS_PALETTES[mode].backdropFloor) },
  };

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: backdropUniforms,
      vertexShader: BACKDROP_VERTEX,
      fragmentShader: BACKDROP_FRAGMENT,
      depthWrite: false,
    }),
  );
  backdrop.position.z = -3.2;
  backdrop.renderOrder = -1;
  scene.add(backdrop);

  const micro = buildMicroTextures();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  if (micro?.roughness) {
    micro.roughness.anisotropy = maxAnisotropy;
    micro.roughness.repeat.set(3, 2);
  }
  if (micro?.normal) {
    micro.normal.anisotropy = maxAnisotropy;
    micro.normal.repeat.set(3, 2);
  }

  const rig = new THREE.Group();
  rig.rotation.set(-0.05, 0.13, 0);
  scene.add(rig);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: linear(GLASS_PALETTES[mode].glass),
    metalness: 0,
    roughness: 0.115,
    transmission: 1,
    ior: 1.62,
    clearcoat: 1,
    clearcoatRoughness: 0.008,
    attenuationColor: linear(GLASS_PALETTES[mode].attenuationOff),
    attenuationDistance: 6,
    envMapIntensity: GLASS_PALETTES[mode].envIntensity,
    specularIntensity: 1,
    roughnessMap: micro?.roughness ?? null,
    clearcoatNormalMap: micro?.normal ?? null,
    clearcoatNormalScale: new THREE.Vector2(0.13, 0.13),
    thickness: 1.25,
    iridescence: 0.2,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 420],
    emissive: linear(GLASS_PALETTES[mode].filamentOn),
    emissiveIntensity: 0,
  });

  const track = new THREE.Mesh(
    new THREE.CapsuleGeometry(TRACK_RADIUS, TRACK_LENGTH, 64, 192),
    glassMaterial,
  );
  track.rotation.z = Math.PI / 2;
  track.scale.set(1, 1, 0.82);
  rig.add(track);

  const filamentMaterial = new THREE.MeshStandardMaterial({
    color: linear(GLASS_PALETTES[mode].filamentOff),
    emissive: linear(GLASS_PALETTES[mode].filamentOn),
    emissiveIntensity: on ? 1 : 0,
    roughness: 0.34,
    metalness: 0,
  });
  const filament = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.105, TRACK_LENGTH + 0.16, 16, 64),
    filamentMaterial,
  );
  filament.rotation.z = Math.PI / 2;
  filament.position.set(0, -0.31, -0.04);
  rig.add(filament);

  const knobMaterial = new THREE.MeshPhysicalMaterial({
    color: linear(GLASS_PALETTES[mode].knob),
    metalness: 0,
    roughness: 0.125,
    transmission: GLASS_PALETTES[mode].knobTransmission,
    ior: 1.47,
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    attenuationColor: linear(GLASS_PALETTES[mode].attenuationOff),
    attenuationDistance: 3,
    envMapIntensity: GLASS_PALETTES[mode].envIntensity * GLASS_PALETTES[mode].knobEnv,
    roughnessMap: micro?.roughness ?? null,
    clearcoatNormalMap: micro?.normal ?? null,
    clearcoatNormalScale: new THREE.Vector2(0.1, 0.1),
    thickness: 0.62,
    iridescence: 0.12,
    iridescenceIOR: 1.25,
    iridescenceThicknessRange: [100, 380],
  });

  const knob = new THREE.Mesh(new THREE.SphereGeometry(THUMB_RADIUS, 160, 96), knobMaterial);
  knob.position.z = TRACK_RADIUS * 0.82;
  rig.add(knob);

  const ambient = new THREE.AmbientLight(0xffffff, GLASS_PALETTES[mode].ambient * LEGACY_LIGHT);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(
    linear(GLASS_PALETTES[mode].key),
    GLASS_PALETTES[mode].keyIntensity * LEGACY_LIGHT,
  );
  key.position.set(2.2, 3.4, 4);
  scene.add(key);

  let environmentTarget: THREE.WebGLRenderTarget | null = null;
  function applyEnvironment(next: ToggleMode) {
    const source = buildEnvironmentTexture(GLASS_PALETTES[next]);
    const nextTarget = pmrem.fromEquirectangular(source);
    source.dispose();
    environmentTarget?.dispose();
    environmentTarget = nextTarget;
    scene.environment = nextTarget.texture;
  }
  applyEnvironment(mode);

  let currentMode = mode;
  let currentSpeed = speed;
  let target = on ? 1 : 0;
  let progress = target;
  let velocity = 0;
  let onGlow = target;
  const attenuationOffColor = linear(GLASS_PALETTES[mode].attenuationOff);
  const attenuationOnColor = linear(GLASS_PALETTES[mode].attenuationOn);
  const filamentOffColor = linear(GLASS_PALETTES[mode].filamentOff);
  const filamentOnColor = linear(GLASS_PALETTES[mode].filamentOn);
  const pointer = new THREE.Vector2(0, 0);
  const smoothedPointer = new THREE.Vector2(0, 0);
  let width = 1;
  let height = 1;
  let baseDistance = camera.position.z;
  let sizeScale = 1;
  let last = performance.now();

  function applyPalette(next: ToggleMode) {
    const palette = GLASS_PALETTES[next];
    backdropUniforms.uBackdrop.value = linear(palette.backdrop);
    backdropUniforms.uFloor.value = linear(palette.backdropFloor);
    backdropUniforms.uShadow.value = palette.shadow;
    glassMaterial.color = linear(palette.glass);
    glassMaterial.envMapIntensity = palette.envIntensity;
    knobMaterial.color = linear(palette.knob);
    knobMaterial.attenuationColor = linear(palette.attenuationOff);
    knobMaterial.transmission = palette.knobTransmission;
    knobMaterial.envMapIntensity = palette.envIntensity * palette.knobEnv;
    attenuationOffColor.copy(linear(palette.attenuationOff));
    attenuationOnColor.copy(linear(palette.attenuationOn));
    filamentOffColor.copy(linear(palette.filamentOff));
    filamentOnColor.copy(linear(palette.filamentOn));
    filamentMaterial.emissive = linear(palette.filamentOn);
    glassMaterial.emissive = linear(palette.filamentOn);
    ambient.intensity = palette.ambient * LEGACY_LIGHT;
    key.color = linear(palette.key);
    key.intensity = palette.keyIntensity * LEGACY_LIGHT;
    applyEnvironment(next);
  }

  function resize(nextWidth: number, nextHeight: number) {
    width = Math.max(1, Math.round(nextWidth));
    height = Math.max(1, Math.round(nextHeight));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    /* Frame the control by moving the camera rather than scaling the meshes:
       glass thickness is in world units. */
    const halfFov = (camera.fov * Math.PI) / 360;
    const visibleHeight =
      Math.max(VIEW_HEIGHT, CONTROL_WIDTH / (WIDTH_SHARE * camera.aspect)) / sizeScale;
    baseDistance = visibleHeight / (2 * Math.tan(halfFov));
    camera.position.z = baseDistance;
    camera.updateProjectionMatrix();
    const backdropHeight = 2 * (baseDistance - backdrop.position.z) * Math.tan(halfFov);
    backdrop.scale.set(backdropHeight * camera.aspect * 1.08, backdropHeight * 1.08, 1);
    backdropUniforms.uAspect.value = camera.aspect;
  }

  function measureSwitch() {
    const halfWidth = TRACK_LENGTH / 2 + TRACK_RADIUS;
    const left = new THREE.Vector3(-halfWidth, 0, 0).project(camera);
    const right = new THREE.Vector3(halfWidth, 0, 0).project(camera);
    const top = new THREE.Vector3(0, TRACK_RADIUS, 0).project(camera);
    const bottom = new THREE.Vector3(0, -TRACK_RADIUS, 0).project(camera);
    return {
      width: Math.abs(right.x - left.x) * 0.5 * width,
      height: Math.abs(top.y - bottom.y) * 0.5 * height,
    };
  }

  function frame(now: number, still: boolean) {
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (still) {
      progress = target;
      velocity = 0;
      onGlow = target;
      smoothedPointer.copy(pointer);
    } else {
      /* Critically damped travel: a heavy glass object should not wobble. */
      const stiffness = 150;
      const damping = 2 * Math.sqrt(stiffness);
      velocity += (target - progress) * stiffness * delta - velocity * damping * delta;
      progress += velocity * delta;
      onGlow += (target - onGlow) * Math.min(1, delta * 6);
      smoothedPointer.lerp(pointer, Math.min(1, delta * 3.2));
    }
    void currentSpeed;

    knob.position.x = (progress * 2 - 1) * TRAVEL;
    knob.rotation.z = -progress * Math.PI * 0.9;
    knob.rotation.y = smoothedPointer.x * 0.3;

    filamentMaterial.emissiveIntensity = onGlow * (currentMode === "dark" ? 3.2 : 1.4);
    filamentMaterial.color.copy(filamentOffColor).lerp(filamentOnColor, onGlow * 0.85);
    glassMaterial.attenuationColor.copy(attenuationOffColor).lerp(attenuationOnColor, onGlow);
    glassMaterial.attenuationDistance = 6 - onGlow * 4.8;
    glassMaterial.emissiveIntensity = onGlow * GLASS_PALETTES[currentMode].shellEmissive;

    camera.position.set(smoothedPointer.x * 0.5, 0.22 + smoothedPointer.y * 0.32, baseDistance);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  return {
    frame,
    setMode(next) {
      if (next === currentMode) return;
      currentMode = next;
      applyPalette(next);
    },
    setSpeed(next) {
      currentSpeed = next;
    },
    setSize(next) {
      sizeScale = next;
      resize(width, height);
    },
    setOn(next) {
      target = next ? 1 : 0;
    },
    setPointer(x, y) {
      pointer.set(x, y);
    },
    resize,
    measureSwitch,
    dispose() {
      environmentTarget?.dispose();
      pmrem.dispose();
      micro?.roughness?.dispose();
      micro?.normal?.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material.dispose();
      });
      renderer.dispose();
    },
  };
}

/* ---------------------------------------------------------------------------
   Shader: one fragment shader draws the whole control.
--------------------------------------------------------------------------- */

const SHADER_STAGE: Record<ToggleMode, string> = { light: "#f4f6fa", dark: "#06070b" };

const SHADER_VERTEX = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const SHADER_FRAGMENT_BODY = `
precision highp float;

uniform vec2 uRes;
uniform float uUnit;
uniform float uTime;
uniform float uOn;
uniform float uProgress;
uniform float uMode;
uniform vec2 uPointer;

const float R = 1.0;
const float L = 1.35;
const float TH = 0.78;
const float PI = 3.14159265359;

float hash11(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

vec2 hash21(float n) {
  return fract(sin(vec2(n * 127.1, n * 311.7)) * 43758.5453123);
}

float hash22(vec2 co) {
  return fract(sin(dot(mod(co, 512.0), vec2(12.9898, 78.233))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash11(i.x + i.y * 57.0);
  float b = hash11(i.x + 1.0 + i.y * 57.0);
  float c = hash11(i.x + (i.y + 1.0) * 57.0);
  float d = hash11(i.x + 1.0 + (i.y + 1.0) * 57.0);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * valueNoise(p);
    p = p * 2.03 + 11.3;
    amplitude *= 0.5;
  }
  return value;
}

float ridged(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(valueNoise(p) * 2.0 - 1.0);
    value += amplitude * n * n;
    p = p * 2.11 + 7.7;
    amplitude *= 0.5;
  }
  return value;
}

vec2 warp(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.12)), fbm(p + vec2(5.2, 1.3) - t * 0.09));
  vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2)), fbm(p + 3.4 * q + vec2(8.3, 2.8)));
  return p + 0.42 * r;
}

float sdCapsule(vec2 p, float halfLength, float radius) {
  p.x -= clamp(p.x, -halfLength, halfLength);
  return length(p) - radius;
}

float fw(float d) {
#ifdef HAS_DERIVATIVES
  return max(fwidth(d), 1e-5);
#else
  return 1.6 / uUnit;
#endif
}

float fill(float d) {
  float w = fw(d) * 0.72;
  return smoothstep(w, -w, d);
}

float stroke(float d, float halfWidth) {
  float w = fw(d) * 0.8;
  return smoothstep(halfWidth + w, halfWidth - w, abs(d));
}

float capsuleHalo(vec2 p, float spread) {
  return exp(-max(0.0, sdCapsule(p, L, R)) * spread);
}

void main() {
  vec2 frag = gl_FragCoord.xy - 0.5 * uRes;
  vec2 p = frag / uUnit;
  vec2 screen = frag / max(uRes.x, uRes.y);

  float dark = uMode;
  float energy = mix(0.16, 1.0, uOn);

  vec3 accent = mix(vec3(0.09, 0.32, 0.95), vec3(0.24, 0.55, 1.0), dark);
  vec3 accentWarm = mix(vec3(0.55, 0.18, 0.86), vec3(0.62, 0.32, 1.0), dark);
  vec3 accentCool = mix(vec3(0.06, 0.62, 0.92), vec3(0.36, 0.86, 1.0), dark);
  vec3 sparkColor = mix(vec3(0.15, 0.62, 0.98), vec3(0.55, 0.86, 1.0), dark);
  vec3 dormant = mix(vec3(0.66, 0.69, 0.75), vec3(0.16, 0.19, 0.25), dark);

  vec3 skyTop = mix(vec3(0.965, 0.972, 0.984), vec3(0.055, 0.062, 0.086), dark);
  vec3 skyBottom = mix(vec3(0.886, 0.906, 0.941), vec3(0.016, 0.019, 0.031), dark);
  vec3 color = mix(skyBottom, skyTop, smoothstep(-0.55, 0.55, screen.y));

  vec2 lattice = fract(p * 1.8) - 0.5;
  float dots = smoothstep(0.09, 0.02, length(lattice));
  color += dots * mix(-0.05, 0.05, dark) * mix(vec3(0.32, 0.4, 0.62), accent, dark);

  float haloR = capsuleHalo(p * 0.985, 1.35);
  float haloG = capsuleHalo(p, 1.5);
  float haloB = capsuleHalo(p * 1.015, 1.65);
  vec3 halo = vec3(haloR, haloG, haloB) * mix(accent, accentWarm, 0.35);
  color += halo * energy * mix(0.045, 0.3, dark);

  float d = sdCapsule(p, L, R);
  float inside = fill(d);

  vec2 flowP = vec2(p.x * 0.72 - uTime * 0.3, p.y * 1.25);
  vec2 w = warp(flowP, uTime);
  float plasma = fbm(w * 1.5);
  float threads = ridged(vec2(w.x * 2.2, w.y * 3.4 + uTime * 0.16));

  float brushed = 0.5 + 0.5 * sin(p.y * 74.0 + fbm(w * 3.0) * 9.0);
  brushed *= 0.5 + 0.5 * valueNoise(vec2(p.x * 26.0, p.y * 4.0));

  float caustic = pow(abs(sin(w.x * 3.6 - uTime * 1.5 + threads * 2.4)), 9.0);

  vec2 cell = fract(p * vec2(22.0, 19.0)) - 0.5;
  float micro = stroke(length(cell) - 0.2, 0.035);

  float streak = pow(max(0.0, sin(p.x * 2.1 - uTime * 2.6 + plasma * 3.4)), 7.0);

  vec3 interior = mix(dormant, mix(accent, accentWarm, plasma * 0.42), uOn);
  interior *= mix(0.24, 0.86, plasma) * energy;
  interior += mix(accentCool, vec3(1.0), 0.25) * threads * threads * uOn * 0.15;
  interior += mix(accent, vec3(1.0), 0.35) * caustic * uOn * 0.2;
  interior += accentCool * micro * mix(0.018, 0.05, dark) * energy;
  interior *= 0.82 + 0.18 * brushed;
  interior += mix(accent, vec3(1.0), 0.35) * streak * uOn * 0.34;

  vec3 restColor = dormant * mix(0.6, 0.2, dark) * (0.72 + 0.4 * plasma);
  restColor += accentCool * micro * mix(0.02, 0.045, dark);
  restColor *= 0.88 + 0.12 * brushed;
  interior = mix(restColor, interior, uOn);

  float trough = smoothstep(-R, R * 0.35, p.y);
  interior *= mix(0.42, 1.2, trough);

  color = mix(color, interior, inside);

  color *= 1.0 - stroke(d - 0.028, 0.026) * mix(0.16, 0.3, dark);
  vec3 rimColor = mix(accent, vec3(1.0), mix(0.5, 0.28, dark));
  color += rimColor * stroke(d, 0.013) * mix(0.34, 0.66, dark) * energy;
  float bevel = stroke(d + 0.062, 0.02) * smoothstep(-0.35, 0.85, p.y / R);
  color += mix(accentCool, vec3(1.0), 0.5) * bevel * mix(0.2, 0.34, dark) * energy;
  color += rimColor * exp(-abs(d) * 18.0) * mix(0.06, 0.13, dark) * energy * inside;

  vec3 sparks = vec3(0.0);
  for (int i = 0; i < 64; i++) {
    float fi = float(i);
    vec2 h = hash21(fi + 3.7);
    float phase = hash11(fi * 7.13 + 1.7);
    float weight = hash11(fi * 3.31 + 5.9);
    float life = fract(uTime * (0.2 + h.x * 0.42) * mix(0.35, 1.0, uOn) + phase);
    float x = mix(-L - R * 0.55, L + R * 0.55, life);
    float y = (h.y - 0.5) * 1.52 * (0.32 + 0.68 * sin(life * PI)) + sin(life * 6.4 + fi) * 0.06;
    vec2 sp = p - vec2(x, y);
    sp.x *= 0.45;
    float fade = sin(life * PI);
    float grain = 1500.0 + 5200.0 * weight;
    float core = exp(-dot(sp, sp) * grain * 3.0);
    float tail = exp(-dot(sp, sp) * grain);
    float brightness = 0.35 + 0.65 * weight;
    sparks += mix(sparkColor, vec3(1.0), 0.6 * fade) * (tail * 0.55 + core) * fade * brightness;
  }
  color += sparks * mix(0.3, 1.15, uOn) * mix(0.85, 1.15, dark) * inside;

  float thumbX = mix(-L, L, uProgress);
  vec2 tp = p - vec2(thumbX, 0.0);
  float td = length(tp) - TH;
  float thumbIn = fill(td);
  vec2 disc = tp / TH;
  float discLength = min(1.0, length(disc));
  vec3 normal = normalize(vec3(disc, sqrt(max(1e-4, 1.0 - discLength * discLength))));

  vec2 shellUv = vec2(atan(normal.y, normal.x) * 1.6, normal.z * 2.4);
  float relief = valueNoise(shellUv * 15.0) * 0.6 + valueNoise(shellUv * 41.0) * 0.4;
  vec3 bumped = normalize(normal + vec3((relief - 0.5) * 0.035, (relief - 0.5) * 0.035, 0.0));

  vec3 light = normalize(vec3(-0.42 + uPointer.x * 0.35, 0.58 + uPointer.y * 0.35, 0.8));
  vec3 fillDir = normalize(vec3(0.62, -0.28, 0.55));
  vec3 rimDir = normalize(vec3(0.34, 0.5, -0.72));
  float diffuse = max(0.0, dot(bumped, light));
  float specular = pow(max(0.0, dot(reflect(-light, bumped), vec3(0.0, 0.0, 1.0))), 120.0);
  vec3 stretched = normalize(vec3(bumped.x * 0.28, bumped.y, bumped.z));
  float sheen = pow(max(0.0, dot(reflect(-light, stretched), vec3(0.0, 0.0, 1.0))), 16.0);
  float fillTerm = max(0.0, dot(bumped, fillDir));
  float rimTerm = pow(max(0.0, dot(bumped, rimDir)), 2.2) * pow(1.0 - max(0.0, normal.z), 1.6);
  float fresnel = pow(1.0 - max(0.0, normal.z), 2.6);

  vec3 thumbBase = mix(vec3(0.96, 0.97, 0.99), vec3(0.78, 0.82, 0.9), dark);
  vec3 thumbColor = thumbBase * (0.17 + 0.86 * diffuse * diffuse);
  thumbColor += thumbBase * mix(accentCool, vec3(1.0), 0.35) * fillTerm * 0.3;
  thumbColor += mix(accentCool, vec3(1.0), 0.5) * rimTerm * mix(0.3, 0.55, dark);
  thumbColor *= 0.975 + 0.05 * relief;
  thumbColor += mix(accent, accentWarm, 0.4) * fresnel * mix(0.34, 0.6, dark) * energy;
  thumbColor += vec3(1.0) * specular * 1.6;
  thumbColor += mix(vec3(1.0), accentCool, 0.35) * sheen * 0.13;
  thumbColor += mix(accent, accentWarm, 0.6) * uOn * 0.1;
  thumbColor += accentCool * smoothstep(0.2, -0.9, disc.y) * uOn * mix(0.1, 0.16, dark);
  thumbColor = thumbColor / (1.0 + thumbColor * 0.22);

  float contact = exp(-dot(tp * vec2(0.8, 1.6), tp * vec2(0.8, 1.6)) * 1.9);
  color *= 1.0 - contact * 0.42 * inside;

  color = mix(color, thumbColor, thumbIn);
  color += mix(vec3(1.0), accentCool, 0.4) * stroke(td, 0.01) * mix(0.15, 0.26, dark);
  color += mix(accent, accentWarm, 0.35) * exp(-max(0.0, td) * 7.0) * uOn * 0.22 * inside;

  color *= mix(0.86, 1.0, smoothstep(1.0, 0.2, length(screen * vec2(1.0, 1.25))));
  float grain = hash22(gl_FragCoord.xy + vec2(mod(uTime * 61.0, 512.0), mod(uTime * 37.0, 512.0)));
  color += (grain - 0.5) * mix(0.014, 0.03, dark);

  gl_FragColor = vec4(max(color, 0.0), 1.0);
}
`;

const SHADER_TRACK_HALF_LENGTH = 1.35;
const SHADER_TRACK_RADIUS = 1;
const HEIGHT_SHARE = 0.13;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader could not be created.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log ?? "unknown error"}`);
  }
  return shader;
}

function createShaderScene(
  canvas: HTMLCanvasElement,
  mode: ToggleMode,
  speed: number,
  size: number,
  on: boolean,
): ToggleScene {
  const context = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!context) throw new Error("WebGL is unavailable.");
  const gl = context;
  const hasDerivatives = Boolean(gl.getExtension("OES_standard_derivatives"));

  const program = gl.createProgram();
  if (!program) throw new Error("Program could not be created.");
  const prefix = hasDerivatives
    ? "#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES\n"
    : "";
  const vertex = compileShader(gl, gl.VERTEX_SHADER, SHADER_VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, prefix + SHADER_FRAGMENT_BODY);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program) ?? "unknown error"}`);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    res: gl.getUniformLocation(program, "uRes"),
    unit: gl.getUniformLocation(program, "uUnit"),
    time: gl.getUniformLocation(program, "uTime"),
    on: gl.getUniformLocation(program, "uOn"),
    progress: gl.getUniformLocation(program, "uProgress"),
    mode: gl.getUniformLocation(program, "uMode"),
    pointer: gl.getUniformLocation(program, "uPointer"),
  };

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let width = 1;
  let height = 1;
  let unit = 1;
  let sizeScale = size;
  let currentMode = mode;
  let currentSpeed = speed;
  let target = on ? 1 : 0;
  let progress = target;
  let velocity = 0;
  let glow = target;
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let elapsed = 0;
  let last = performance.now();

  function layout() {
    unit =
      Math.min(
        (height * HEIGHT_SHARE) / (SHADER_TRACK_RADIUS * 2),
        (width * WIDTH_SHARE) / ((SHADER_TRACK_HALF_LENGTH + SHADER_TRACK_RADIUS) * 2),
      ) * sizeScale;
  }

  function resize(nextWidth: number, nextHeight: number) {
    width = Math.max(1, Math.round(nextWidth));
    height = Math.max(1, Math.round(nextHeight));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    layout();
  }

  function frame(now: number, still: boolean) {
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (still) {
      progress = target;
      velocity = 0;
      glow = target;
      smoothX = pointerX;
      smoothY = pointerY;
    } else {
      elapsed += delta * currentSpeed;
      const stiffness = 165;
      const damping = 2 * Math.sqrt(stiffness);
      velocity += (target - progress) * stiffness * delta - velocity * damping * delta;
      progress += velocity * delta;
      glow += (target - glow) * Math.min(1, delta * 5.5);
      smoothX += (pointerX - smoothX) * Math.min(1, delta * 3.4);
      smoothY += (pointerY - smoothY) * Math.min(1, delta * 3.4);
    }

    gl.uniform2f(uniforms.res, canvas.width, canvas.height);
    gl.uniform1f(uniforms.unit, unit * pixelRatio);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform1f(uniforms.on, glow);
    gl.uniform1f(uniforms.progress, progress);
    gl.uniform1f(uniforms.mode, currentMode === "dark" ? 1 : 0);
    gl.uniform2f(uniforms.pointer, smoothX, smoothY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return {
    frame,
    setMode(next) {
      currentMode = next;
    },
    setSpeed(next) {
      currentSpeed = next;
    },
    setSize(next) {
      sizeScale = next;
      layout();
    },
    setOn(next) {
      target = next ? 1 : 0;
    },
    setPointer(x, y) {
      pointerX = x;
      pointerY = y;
    },
    resize,
    measureSwitch() {
      return {
        width: unit * (SHADER_TRACK_HALF_LENGTH + SHADER_TRACK_RADIUS) * 2,
        height: unit * SHADER_TRACK_RADIUS * 2,
      };
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

/* ---------------------------------------------------------------------------
   Shared stage for the two WebGL variants.
--------------------------------------------------------------------------- */

const STAGE_TEXT = {
  light: {
    caption: "rgba(17, 22, 34, 0.5)",
    captionOn: "rgba(17, 22, 34, 0.78)",
    focus: "rgba(58, 120, 255, 0.45)",
  },
  dark: {
    caption: "rgba(233, 238, 250, 0.46)",
    captionOn: "rgba(233, 238, 250, 0.82)",
    focus: "rgba(122, 168, 255, 0.5)",
  },
} as const;

function CanvasToggle({
  kind,
  mode,
  on,
  flip,
  label,
  speed,
  size,
  still,
}: VariantProps & { kind: "glass" | "shader" }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<ToggleScene | null>(null);
  const [supported, setSupported] = useState(true);
  const [focused, setFocused] = useState(false);
  const text = STAGE_TEXT[mode];
  const kickRef = useFrameLoop(hostRef, sceneRef as MutableRefObject<FrameScene | null>, still);
  const initial = useRef({ mode, speed, size, on });

  const syncSwitchFootprint = useCallback(() => {
    const control = switchRef.current;
    const footprint = sceneRef.current?.measureSwitch();
    if (!control || !footprint) return;
    control.style.width = `${Math.round(footprint.width)}px`;
    control.style.height = `${Math.round(footprint.height)}px`;
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;
    const start = initial.current;
    let scene: ToggleScene;
    try {
      scene =
        kind === "glass"
          ? createGlassScene(canvas, start.mode, clamp(start.speed, 0, 3), start.on)
          : createShaderScene(
              canvas,
              start.mode,
              clamp(start.speed, 0, 3),
              clamp(start.size, 0.35, 2.5),
              start.on,
            );
    } catch {
      setSupported(false);
      return undefined;
    }
    if (kind === "glass") scene.setSize(clamp(start.size, 0.35, 2.5));
    sceneRef.current = scene;

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      scene.resize(box.width, box.height);
      syncSwitchFootprint();
      kickRef.current();
    });
    observer.observe(host);
    scene.resize(host.clientWidth, host.clientHeight);
    syncSwitchFootprint();
    kickRef.current();

    return () => {
      observer.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, [kind, kickRef, syncSwitchFootprint]);

  useEffect(() => {
    sceneRef.current?.setMode(mode);
    kickRef.current();
  }, [mode, kickRef]);

  useEffect(() => {
    sceneRef.current?.setSpeed(clamp(speed, 0, 3));
  }, [speed]);

  useEffect(() => {
    sceneRef.current?.setSize(clamp(size, 0.35, 2.5));
    syncSwitchFootprint();
    kickRef.current();
  }, [size, syncSwitchFootprint, kickRef]);

  useEffect(() => {
    sceneRef.current?.setOn(on);
    kickRef.current();
  }, [on, kickRef]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const host = hostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    sceneRef.current?.setPointer(clamp(x, -1, 1), clamp(-y, -1, 1));
    kickRef.current();
  };

  return (
    <div
      ref={hostRef}
      className="relative box-border block h-full w-full cursor-pointer overflow-hidden"
      style={{
        isolation: "isolate",
        containerType: "size",
        background: kind === "glass" ? GLASS_STAGE[mode] : SHADER_STAGE[mode],
        colorScheme: mode,
        fontFamily: SYSTEM_SANS,
        WebkitTapHighlightColor: "transparent",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        sceneRef.current?.setPointer(0, 0);
        kickRef.current();
      }}
      onClick={flip}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <button
        ref={switchRef}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className="absolute left-1/2 top-1/2 h-[112px] w-[200px] -translate-x-1/2 -translate-y-1/2 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 outline-none"
        style={{ boxShadow: focused ? `0 0 0 4px ${text.focus}` : undefined }}
        onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setFocused(false)}
        onClick={(event) => {
          /* The whole stage is clickable, so keep the button from toggling twice. */
          event.stopPropagation();
          flip();
        }}
      />
      <p
        className="pointer-events-none absolute left-1/2 m-0 flex -translate-x-1/2 items-baseline uppercase"
        style={{
          top: "calc(50% + max(52px, 11cqh))",
          gap: "0.55em",
          fontSize: "clamp(11px, 1.9cqw, 14px)",
          letterSpacing: "0.08em",
          color: on ? text.captionOn : text.caption,
          transition: still ? "none" : "color 0.45s ease",
        }}
      >
        <span>{label}</span>
        <b className="font-medium">{on ? "On" : "Off"}</b>
      </p>
      {supported ? null : (
        <p
          className="absolute inset-0 m-0 grid place-items-center p-6 text-center text-[13px] leading-normal"
          style={{ color: text.caption }}
        >
          This variant needs WebGL, which this browser did not provide.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Public component.
--------------------------------------------------------------------------- */

export function SkeuomorphicToggle({
  variant = "classic",
  mode = "auto",
  defaultOn = true,
  label = "Live Sync",
  speed = 1,
  size = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  onChange,
  className,
}: SkeuomorphicToggleProps) {
  const prefersReducedMotion = useReducedMotion();
  const resolvedMode = useToggleMode(mode);
  const [on, setOn] = useState(defaultOn);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const flip = useCallback(() => {
    setOn((current) => !current);
  }, []);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onChangeRef.current?.(on);
  }, [on]);

  const shared: VariantProps = {
    mode: resolvedMode,
    on,
    flip,
    label,
    speed,
    size,
    still: Boolean(prefersReducedMotion),
  };

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ opacity: clamp(opacity, 0.05, 1), filter }}
    >
      {variant === "modern" ? (
        <ModernToggle {...shared} />
      ) : variant === "glass" ? (
        <CanvasToggle key="glass" kind="glass" {...shared} />
      ) : variant === "shader" ? (
        <CanvasToggle key="shader" kind="shader" {...shared} />
      ) : (
        <ClassicToggle {...shared} />
      )}
    </div>
  );
}
