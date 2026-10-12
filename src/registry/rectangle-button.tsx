"use client";
// Ported from ThreeUI Community's Rectangle Buttons (MIT, © 2026 Meng To).

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export const RECTANGLE_BUTTON_VARIANTS = [
  "dark-pill",
  "launch-button",
  "dot-border-button",
  "floating-dots-cta",
  "sliding-text-cta",
  "gradient-beam-cta",
  "gradient-pill-button",
  "generate-button",
  "glassmorphism-cta",
  "spinning-border-button",
  "gradient-cta",
  "lumen-cta",
  "lumen-cta-ghost",
  "trochil-signal",
  "attune-thermal",
  "tideform-outline",
  "understory-arrow-pill",
  "meridian-keycap-primary",
  "meridian-keycap-secondary",
  "halvorsen-arrow-pill",
  "aster-glass-access",
  "aster-glass-arrow",
] as const;

export type RectangleButtonVariant = (typeof RECTANGLE_BUTTON_VARIANTS)[number];

export interface RectangleButtonProps {
  /** Which of the 22 treatments to render. Every one is drawn from the theme tokens. */
  variant?: RectangleButtonVariant;
  /** Button text. Each variant has its own default copy when omitted. */
  label?: string;
  /** Second label the Generate variant resolves to while focused. */
  activeLabel?: string;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Stage background behind the button. Transparent by default, so it sits on its parent. */
  background?: string;
  /** Portrait shown in the Glassmorphism CTA. */
  avatarSrc?: string;
  avatarAlt?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const DEFAULT_LABELS: Record<RectangleButtonVariant, string> = {
  "dark-pill": "Explore",
  "launch-button": "Ship it",
  "dot-border-button": "Draft a layout",
  "floating-dots-cta": "Join the list",
  "sliding-text-cta": "Browse components",
  "gradient-beam-cta": "Install",
  "gradient-pill-button": "Read the docs",
  "generate-button": "Compose",
  "glassmorphism-cta": "Book a review",
  "spinning-border-button": "View source",
  "gradient-cta": "Send invite",
  "lumen-cta": "Get started",
  "lumen-cta-ghost": "Learn more",
  "trochil-signal": "Request access",
  "attune-thermal": "Continue",
  "tideform-outline": "Index",
  "understory-arrow-pill": "Next chapter",
  "meridian-keycap-primary": "Add to project",
  "meridian-keycap-secondary": "Copy command",
  "halvorsen-arrow-pill": "Open the kit",
  "aster-glass-access": "Sign in",
  "aster-glass-arrow": "Take a tour",
};

/* ------------------------------------------------------------------ *
 * Scoped styles. Every rule is prefixed `mrb-` so variants never leak.
 * Colours come only from the theme tokens (bare HSL channels), so each
 * treatment follows light/dark mode and the active palette.
 * ------------------------------------------------------------------ */
const STYLES = `
.mrb-stage { --mrb-sans: var(--font-body, ui-sans-serif), system-ui, sans-serif; --mrb-serif: var(--font-heading, ui-serif), Georgia, serif; --mrb-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; --mrb-tint: color-mix(in oklab, hsl(var(--primary)) 55%, white); --mrb-shade: color-mix(in oklab, hsl(var(--primary)) 62%, black); position: relative; display: grid; width: 100%; height: 100%; place-items: center; overflow: hidden; isolation: isolate; color: hsl(var(--foreground)); font-family: var(--mrb-sans); -webkit-font-smoothing: antialiased; }
.mrb-still, .mrb-still *, .mrb-still *::before, .mrb-still *::after { animation: none !important; transition: none !important; }
.mrb-stage button:focus-visible, .mrb-stage a:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 4px; }

/* Glass pill */
.mrb-glass-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 34px; overflow: hidden; border: 0; border-radius: 999px; color: hsl(var(--foreground) / .8); background: transparent; font-family: var(--mrb-serif); font-size: 21px; font-style: italic; line-height: 1; cursor: pointer; transition: color .3s, transform .2s; }
.mrb-glass-btn::before, .mrb-glass-btn::after { position: absolute; inset: 0; border-radius: inherit; content: ""; }
.mrb-glass-btn::before { background: hsl(var(--card) / .75); box-shadow: inset 2px 4px 16px hsl(var(--foreground) / .06), 0 10px 26px -14px hsl(var(--foreground) / .45); -webkit-backdrop-filter: blur(30px); backdrop-filter: blur(30px); }
.mrb-glass-btn::after { z-index: 2; border: 1px solid hsl(var(--border)); pointer-events: none; }
.mrb-glass-title { position: relative; z-index: 4; }
.mrb-glass-circle { position: absolute; z-index: 3; top: calc(50% - 100px); left: calc(50% - 100px); width: 200px; height: 200px; pointer-events: none; }
.mrb-glass-circle::before, .mrb-glass-circle::after { position: absolute; inset: 0; border-radius: 50%; content: ""; }
.mrb-glass-circle::before { background: conic-gradient(from 180deg, hsl(var(--primary) / .02) 180deg, hsl(var(--primary) / .28) 360deg); filter: blur(15px); animation: mrb-glass-circle 3.6s linear infinite; transition: opacity .5s; }
.mrb-glass-circle::after { inset: 30px; background: hsl(var(--primary) / .3); opacity: 0; filter: blur(6px); transform: scale(.5); transition: opacity .5s, transform .7s; -webkit-mask-image: radial-gradient(50% 50%, black, transparent); mask-image: radial-gradient(50% 50%, black, transparent); }
.mrb-glass-btn:hover { color: hsl(var(--foreground)); }
.mrb-glass-btn:hover .mrb-glass-circle::before { opacity: 0; }
.mrb-glass-btn:hover .mrb-glass-circle::after { opacity: 1; transform: scale(1); }
.mrb-glass-btn:active { transform: scale(.98); }
@keyframes mrb-glass-circle { 0% { transform: translate(0) rotate(0); } 25% { transform: translateX(-30px) rotate(90deg); } 50% { transform: translate(0) rotate(180deg); } 75% { transform: translateX(30px) rotate(270deg); } 100% { transform: translate(0) rotate(360deg); } }

/* Launch key */
.mrb-launch { position: relative; border: 0; background: none; padding: 0; cursor: pointer; font: inherit; }
.mrb-launch-glow { position: absolute; inset: -4px; border-radius: 14px; background: hsl(var(--primary) / .4); opacity: .4; filter: blur(8px); transition: opacity .5s; }
.mrb-launch:hover .mrb-launch-glow { opacity: .75; }
.mrb-launch-face { position: relative; display: flex; align-items: center; gap: 12px; padding: 15px 30px; border-radius: 12px; color: hsl(var(--primary-foreground)); background: linear-gradient(180deg, var(--mrb-tint), hsl(var(--primary)) 55%, var(--mrb-shade)); box-shadow: 0 0 0 1px hsl(var(--primary) / .5), 0 4px 0 var(--mrb-shade), 0 10px 15px -3px hsl(var(--foreground) / .35); font-family: var(--mrb-mono); font-size: 13px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; transition: transform .15s, box-shadow .15s; }
.mrb-launch:active .mrb-launch-face { transform: translateY(2px); box-shadow: 0 0 0 1px hsl(var(--primary) / .5), 0 2px 0 var(--mrb-shade); }
.mrb-launch svg { width: 18px; height: 18px; fill: hsl(var(--primary-foreground) / .2); stroke: currentColor; stroke-width: 1.5; }

/* Dot Border Button */
.mrb-db-wrapper { --dot-size: 8px; --line-weight: 1px; --line-distance: 0.8rem 1rem; --animation-speed: 0.35s; --dot-color: hsl(var(--primary)); --grid-color: hsl(var(--border)); position: relative; display: inline-flex; justify-content: center; align-items: center; padding: var(--line-distance); user-select: none; isolation: isolate; }
.mrb-db-wrapper::after { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit; pointer-events: none; background-image: repeating-linear-gradient(45deg, hsl(var(--primary) / .22) 0 1px, transparent 2px 5px); opacity: 0; z-index: -1; }
.mrb-db-wrapper:has(.mrb-db-btn:hover)::after { animation: mrb-db-opacity calc(var(--animation-speed) * 4) ease-in-out forwards; }
@keyframes mrb-db-opacity { 80% { opacity: 0; } 100% { opacity: 1; } }
.mrb-db-btn { position: relative; display: flex; justify-content: center; align-items: center; padding: 0.8rem 1.25rem; white-space: nowrap; background-color: hsl(var(--card)); border: 1px solid var(--grid-color); color: hsl(var(--foreground)); font-family: var(--mrb-sans); letter-spacing: -0.01em; font-size: 1rem; font-weight: 600; line-height: 1.5; border-radius: 6px; cursor: pointer; transition: transform .2s ease-in-out, letter-spacing .2s ease-in-out, background-color .2s, color .2s; }
.mrb-db-btn:hover, .mrb-db-btn:active { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); transform: scale(1.05); letter-spacing: .04em; }
.mrb-db-btn:active { transform: scale(.98); }
.mrb-db-svg { margin-left: .5rem; height: 24px; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; stroke: hsl(var(--muted-foreground)); fill: hsl(var(--muted)); transition: all .2s ease-in-out; }
.mrb-db-btn:hover .mrb-db-svg { stroke: hsl(var(--primary-foreground)); fill: hsl(var(--primary-foreground) / .2); }
.mrb-db-dot { position: absolute; width: var(--dot-size); aspect-ratio: 1; border-radius: 2px; background-color: var(--dot-color); transition: all .3s ease-in-out; opacity: 0; }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-dot.mrb-db-top.mrb-db-left { top: 50%; left: 20%; animation: mrb-db-tl var(--animation-speed) ease-in-out forwards; }
@keyframes mrb-db-tl { 90% { opacity: .6; } 100% { top: calc(var(--dot-size) * -0.5); left: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-dot.mrb-db-top.mrb-db-right { top: 50%; right: 20%; animation: mrb-db-tr var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * .6); }
@keyframes mrb-db-tr { 80% { opacity: .6; } 100% { top: calc(var(--dot-size) * -0.5); right: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-dot.mrb-db-bottom.mrb-db-right { bottom: 50%; right: 20%; animation: mrb-db-br var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 1.2); }
@keyframes mrb-db-br { 80% { opacity: .6; } 100% { bottom: calc(var(--dot-size) * -0.5); right: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-dot.mrb-db-bottom.mrb-db-left { bottom: 50%; left: 20%; animation: mrb-db-bl var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 1.8); }
@keyframes mrb-db-bl { 80% { opacity: .6; } 100% { bottom: calc(var(--dot-size) * -0.5); left: calc(var(--dot-size) * -0.5); opacity: 1; } }
.mrb-db-line { position: absolute; transition: all .3s ease-in-out; }
.mrb-db-line.mrb-db-h { height: var(--line-weight); width: 100%; background-image: repeating-linear-gradient(90deg, transparent 0 calc(var(--line-weight) * 2), var(--dot-color) calc(var(--line-weight) * 2) calc(var(--line-weight) * 4)); }
.mrb-db-line.mrb-db-top { top: calc(var(--line-weight) * -0.5); transform-origin: top left; transform: rotate(5deg) scaleX(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-top { animation: mrb-db-draw-top var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * .8); }
@keyframes mrb-db-draw-top { 100% { transform: rotate(0deg) scaleX(1); } }
.mrb-db-line.mrb-db-bottom { bottom: calc(var(--line-weight) * -0.5); transform-origin: bottom right; transform: rotate(5deg) scaleX(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-bottom { animation: mrb-db-draw-bottom var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 2); }
@keyframes mrb-db-draw-bottom { 100% { transform: rotate(0deg) scaleX(1); } }
.mrb-db-line.mrb-db-v { width: var(--line-weight); height: 100%; background-image: repeating-linear-gradient(0deg, transparent 0 calc(var(--line-weight) * 2), var(--dot-color) calc(var(--line-weight) * 2) calc(var(--line-weight) * 4)); }
.mrb-db-line.mrb-db-left { left: calc(var(--line-weight) * -0.5); transform-origin: bottom left; transform: rotate(0deg) scaleY(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-left { animation: mrb-db-draw-left var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 2.4); }
@keyframes mrb-db-draw-left { 100% { transform: rotate(0deg) scaleY(1); } }
.mrb-db-line.mrb-db-right { right: calc(var(--line-weight) * -0.5); transform-origin: top right; transform: rotate(5deg) scaleY(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-right { animation: mrb-db-draw-right var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 1.4); }
@keyframes mrb-db-draw-right { 100% { transform: rotate(0deg) scaleY(1); } }

/* Floating Dots CTA */
.mrb-fd { --mrb-fd-fill: radial-gradient(65% 65% at 50% 100%, color-mix(in oklab, var(--mrb-tint) 80%, transparent) 0%, transparent 100%), hsl(var(--primary)); cursor: pointer; position: relative; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.25s ease; background: var(--mrb-fd-fill); border-radius: 0.75rem; border: none; outline: none; padding: 12px 20px; min-height: 48px; min-width: 102px; font: inherit; }
.mrb-fd::before, .mrb-fd::after { content: ""; position: absolute; transition: all 0.5s ease-in-out; z-index: 0; }
.mrb-fd::before { inset: 1px; border-radius: calc(0.75rem - 1px); background: linear-gradient(178deg, rgb(255 255 255 / .22) 0%, transparent 100%); }
.mrb-fd::after { inset: 2px; border-radius: calc(0.75rem - 2px); background: var(--mrb-fd-fill); }
.mrb-fd:active { transform: scale(0.95); }
.mrb-fd-points { overflow: hidden; width: 100%; height: 100%; pointer-events: none; position: absolute; z-index: 1; }
.mrb-fd-point { bottom: -10px; position: absolute; animation: mrb-fd-floating infinite ease-in-out; pointer-events: none; width: 2px; height: 2px; background-color: hsl(var(--primary-foreground)); border-radius: 9999px; }
@keyframes mrb-fd-floating { 0% { transform: translateY(0); } 85% { opacity: 0; } 100% { transform: translateY(-55px); opacity: 0; } }
.mrb-fd-inner { z-index: 2; gap: 6px; position: relative; width: 100%; color: hsl(var(--primary-foreground)); display: inline-flex; align-items: center; justify-content: center; font-family: var(--mrb-sans); font-size: 16px; font-weight: 500; line-height: 1.5; }
.mrb-fd-icon { width: 18px; height: 18px; transition: transform 0.3s ease; stroke: currentColor; fill: none; }
.mrb-fd:hover .mrb-fd-icon { transform: translateX(2px); }
.mrb-fd:hover .mrb-fd-icon path { animation: mrb-fd-dash 0.8s linear forwards; }
@keyframes mrb-fd-dash { 0% { stroke-dasharray: 0, 20; stroke-dashoffset: 0; } 50% { stroke-dasharray: 10, 10; stroke-dashoffset: -5; } 100% { stroke-dasharray: 20, 0; stroke-dashoffset: -10; } }

/* Gradient Beam CTA */
@keyframes mrb-gb-spin { to { transform: rotate(360deg); } }
@keyframes mrb-gb-dots { 0% { background-position: 0 0; } 100% { background-position: 24px 24px; } }

/* Gradient Pill Button */
.mrb-gp::before { content: ""; position: absolute; inset: 0; padding: 1px; border-radius: 9999px; -webkit-mask: linear-gradient(black 0 0) content-box, linear-gradient(black 0 0); -webkit-mask-composite: xor; mask-composite: exclude; background: linear-gradient(180deg, hsl(var(--foreground) / .45), hsl(var(--foreground) / .06), hsl(var(--foreground) / .45)); pointer-events: none; }

/* Generate Button (inverted ink, glow from --primary) */
.mrb-gen-wrap { position: relative; display: inline-block; isolation: isolate; }
.mrb-gen { --border-radius: 24px; --padding: 4px; --transition: .4s; --gen-glow: hsl(var(--primary)); position: relative; user-select: none; display: flex; justify-content: center; align-items: center; padding: .55rem 1.1rem; font-family: var(--mrb-mono); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; line-height: 1.5; color: hsl(var(--background)); background-color: hsl(var(--foreground)); box-shadow: inset 0 1px 1px rgb(255 255 255 / .2), inset 0 2px 2px rgb(255 255 255 / .15), inset 0 4px 4px rgb(255 255 255 / .1), inset 0 8px 8px rgb(255 255 255 / .05), 0 -1px 1px rgb(0 0 0 / .02), 0 -2px 2px rgb(0 0 0 / .03), 0 -4px 4px rgb(0 0 0 / .05), 0 -8px 8px rgb(0 0 0 / .06); border: solid 1px hsl(var(--border) / .4); border-radius: var(--border-radius); cursor: pointer; outline: none; transition: box-shadow var(--transition), border var(--transition), background-color var(--transition); }
.mrb-gen::before { content: ""; position: absolute; top: calc(0px - var(--padding)); left: calc(0px - var(--padding)); width: calc(100% + var(--padding) * 2); height: calc(100% + var(--padding) * 2); border-radius: calc(var(--border-radius) + var(--padding)); pointer-events: none; background-image: linear-gradient(0deg, hsl(var(--foreground) / .12), hsl(var(--foreground) / .3)); z-index: -1; transition: box-shadow var(--transition); box-shadow: 1px 1px 1px rgb(255 255 255 / .13), 2px 2px 2px rgb(255 255 255 / .07), -1px -1px 1px rgb(0 0 0 / .13), -2px -2px 2px rgb(0 0 0 / .07); }
.mrb-gen::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background-image: linear-gradient(0deg, var(--mrb-tint), var(--gen-glow), color-mix(in oklab, var(--gen-glow) 50%, transparent), 8%, transparent); opacity: 0; transition: opacity var(--transition), filter var(--transition); }
.mrb-gen-letter { position: relative; display: inline-block; color: hsl(var(--background) / .4); animation: mrb-gen-letter 2s ease-in-out infinite; transition: color var(--transition), text-shadow var(--transition); }
@keyframes mrb-gen-letter { 50% { text-shadow: 0 0 3px hsl(var(--background) / .6); color: hsl(var(--background)); } }
.mrb-gen-svg { flex-grow: 1; height: 22px; margin-right: .5rem; fill: color-mix(in oklab, hsl(var(--primary)) 55%, hsl(var(--background))); animation: mrb-gen-flicker 2s linear infinite; animation-delay: .5s; filter: drop-shadow(0 0 2px hsl(var(--primary) / .6)); transition: fill var(--transition), filter var(--transition); }
@keyframes mrb-gen-flicker { 50% { opacity: .3; } }
.mrb-gen-txt { position: relative; display: flex; align-items: center; min-width: 8em; }
.mrb-gen-t1, .mrb-gen-t2 { position: absolute; }
.mrb-gen-t1 { animation: mrb-gen-appear 1s ease-in-out forwards; }
.mrb-gen-t2 { opacity: 0; }
@keyframes mrb-gen-appear { 0% { opacity: 0; } 100% { opacity: 1; } }
.mrb-gen:focus .mrb-gen-t1 { animation: mrb-gen-opacity .3s ease-in-out forwards; animation-delay: 1s; }
.mrb-gen:focus .mrb-gen-t2 { animation: mrb-gen-opacity .3s ease-in-out reverse forwards; animation-delay: 1s; }
@keyframes mrb-gen-opacity { 0% { opacity: 1; } 100% { opacity: 0; } }
.mrb-gen:focus .mrb-gen-letter { animation: mrb-gen-focused 1s ease-in-out forwards, mrb-gen-letter 1.2s ease-in-out infinite; }
@keyframes mrb-gen-focused { 0%, 100% { filter: blur(0px); } 50% { transform: scale(2); filter: blur(10px) brightness(150%) drop-shadow(-36px 12px 12px hsl(var(--primary))); } }
.mrb-gen:focus .mrb-gen-svg { animation-duration: 1.2s; animation-delay: .2s; }
.mrb-gen:focus::before { box-shadow: 0 -8px 12px -6px rgb(255 255 255 / .2) inset, 0 -16px 16px -8px hsl(var(--primary) / .2) inset; }
.mrb-gen:focus::after { opacity: .6; -webkit-mask-image: linear-gradient(0deg, black, transparent); mask-image: linear-gradient(0deg, black, transparent); }
.mrb-gen:active { border: solid 1px hsl(var(--primary) / .7); }
.mrb-gen:active::before { box-shadow: 0 -8px 12px -6px rgb(255 255 255 / .6) inset, 0 -16px 16px -8px hsl(var(--primary) / .8) inset; }
.mrb-gen:active::after { opacity: 1; -webkit-mask-image: linear-gradient(0deg, black, transparent); mask-image: linear-gradient(0deg, black, transparent); filter: brightness(160%); }
.mrb-gen:active .mrb-gen-letter { text-shadow: 0 0 1px hsl(var(--primary)); animation: none; }
.mrb-gen:hover { border: solid 1px hsl(var(--primary) / .5); }
.mrb-gen:hover::before { box-shadow: 0 -8px 8px -6px rgb(255 255 255 / .6) inset, 0 -16px 16px -8px hsl(var(--primary) / .35) inset; }
.mrb-gen:hover::after { opacity: 1; -webkit-mask-image: linear-gradient(0deg, black, transparent); mask-image: linear-gradient(0deg, black, transparent); }
.mrb-gen:hover .mrb-gen-svg { filter: drop-shadow(0 0 4px hsl(var(--primary))); animation: none; }

/* Glassmorphism CTA */
@keyframes mrb-gm-beam { 0% { transform: translate(-50%,-50%) rotate(0deg); } 100% { transform: translate(-50%,-50%) rotate(360deg); } }

/* Page buttons */
.mrb-pb { position: relative; display: inline-flex; align-items: center; justify-content: center; border: 0; font: inherit; text-decoration: none; white-space: nowrap; cursor: pointer; -webkit-font-smoothing: antialiased; }
.mrb-page::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(circle at 50% 50%, hsl(var(--primary) / .1), transparent 38%); }

.mrb-pb--trochil { height: 52px; padding: 0 30px; overflow: hidden; border: 1px solid hsl(var(--foreground) / .22); background: linear-gradient(180deg, hsl(var(--card)), hsl(var(--muted))); box-shadow: 0 14px 30px -10px hsl(var(--foreground) / .25), inset 0 1px hsl(var(--background) / .6); color: hsl(var(--foreground) / .82); font-family: var(--mrb-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; transition: border-color .28s ease, color .28s ease, transform .28s ease, box-shadow .28s ease; }
.mrb-pb--trochil::before { content: ""; position: absolute; inset: -1px; background: linear-gradient(105deg, transparent 17%, hsl(var(--primary) / .3) 48%, transparent 76%); transform: translateX(-125%); transition: transform .65s cubic-bezier(.22,.61,.36,1); }
.mrb-pb--trochil span { position: relative; }
.mrb-pb--trochil:hover { border-color: hsl(var(--primary) / .6); color: hsl(var(--foreground)); transform: translateY(-2px); box-shadow: 0 18px 38px -10px hsl(var(--foreground) / .3), 0 0 22px hsl(var(--primary) / .18); }
.mrb-pb--trochil:hover::before { transform: translateX(125%); }

.mrb-pb--attune { gap: 10px; height: 52px; padding: 0 22px; border-radius: 11px; background: linear-gradient(180deg, var(--mrb-tint) 0%, hsl(var(--primary)) 48%, var(--mrb-shade) 100%); box-shadow: inset 0 1px rgb(255 255 255 / .3), 0 8px 28px hsl(var(--primary) / .3); color: hsl(var(--primary-foreground)); font-family: var(--mrb-sans); font-size: 14px; font-weight: 650; letter-spacing: .012em; transition: filter .18s ease, transform .18s ease, box-shadow .18s ease; }
.mrb-pb--attune svg { width: 8px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.7; }
.mrb-pb--attune:hover { filter: brightness(1.08); transform: translateY(-2px); box-shadow: inset 0 1px rgb(255 255 255 / .38), 0 12px 34px hsl(var(--primary) / .4); }
.mrb-pb--attune:active { transform: translateY(1px); }

.mrb-pb--tideform { gap: 18px; padding: 17px 24px; border: 1px solid hsl(var(--foreground) / .25); background: hsl(var(--foreground) / .04); color: hsl(var(--foreground)); font-family: var(--mrb-mono); font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; transition: border-color .25s ease, background-color .25s ease, color .25s ease; }
.mrb-pb--tideform svg { width: 21px; height: 9px; fill: none; stroke: currentColor; stroke-width: 1.25; transition: transform .25s cubic-bezier(.2,.8,.2,1); }
.mrb-pb--tideform:hover { border-color: hsl(var(--primary)); color: hsl(var(--primary)); background: hsl(var(--primary) / .1); }
.mrb-pb--tideform:hover svg { transform: translateX(4px); }

.mrb-pb--arrow-pill { gap: 18px; height: 54px; padding: 0 11px 0 32px; border-radius: 999px; font-family: var(--mrb-serif); font-size: 21px; letter-spacing: -.005em; transition: background .3s ease, transform .3s ease, color .3s ease; }
.mrb-pb--arrow-pill .mrb-disc { display: grid; width: 32px; height: 32px; flex: none; place-items: center; border-radius: 50%; }
.mrb-pb--arrow-pill svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 2; transition: transform .3s ease; }
.mrb-pb--arrow-pill:hover { transform: translateY(-2px); }
.mrb-pb--arrow-pill:hover svg { transform: translateX(2px); }
.mrb-pb--understory { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); box-shadow: 0 14px 30px -8px hsl(var(--primary) / .45); }
.mrb-pb--understory .mrb-disc { background: hsl(var(--primary-foreground)); color: hsl(var(--primary)); }
.mrb-pb--understory:hover { filter: brightness(1.06); }
.mrb-pb--halvorsen { background: hsl(var(--foreground)); color: hsl(var(--background)); box-shadow: 0 14px 30px -8px hsl(var(--foreground) / .4); }
.mrb-pb--halvorsen .mrb-disc { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
.mrb-pb--halvorsen:hover { background: hsl(var(--foreground) / .9); }

.mrb-pb--meridian { height: 62px; padding: 0 30px; border-radius: 15px; flex-shrink: 0; background: hsl(var(--muted)); box-shadow: inset 0 0 0 1px hsl(var(--border)); }
.mrb-pb--meridian::before { content: ""; position: absolute; inset: 3px 4px 9px; border-radius: 12px; background: linear-gradient(180deg, hsl(var(--card)), color-mix(in oklab, hsl(var(--card)) 88%, hsl(var(--foreground)))); box-shadow: 0 5px 0 color-mix(in oklab, hsl(var(--border)) 70%, hsl(var(--foreground))), 0 9px 15px -2px hsl(var(--foreground) / .2), inset 0 1px hsl(var(--background) / .5); transition: transform .13s cubic-bezier(.22,.61,.36,1), box-shadow .13s cubic-bezier(.22,.61,.36,1); }
.mrb-pb--meridian > span:not(.mrb-led) { position: relative; z-index: 1; color: hsl(var(--foreground)); font-family: var(--mrb-mono); font-size: 12px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
.mrb-pb--meridian .mrb-led { position: absolute; z-index: 1; top: 12px; left: 50%; width: 4px; height: 4px; border-radius: 50%; background: hsl(var(--foreground) / .18); transform: translateX(-50%); transition: background .22s ease, box-shadow .22s ease; }
.mrb-pb--meridian:hover::before, .mrb-pb--meridian:active::before { transform: translateY(4px); box-shadow: 0 1px 0 color-mix(in oklab, hsl(var(--border)) 70%, hsl(var(--foreground))), 0 3px 8px -2px hsl(var(--foreground) / .2), inset 0 1px hsl(var(--background) / .5); }
.mrb-pb--meridian:hover .mrb-led { background: hsl(var(--primary)); box-shadow: 0 0 7px hsl(var(--primary)); }
.mrb-pb--meridian-primary { background: hsl(var(--primary) / .18); box-shadow: inset 0 0 0 1px hsl(var(--primary) / .3); }
.mrb-pb--meridian-primary::before { background: linear-gradient(180deg, var(--mrb-tint), hsl(var(--primary))); box-shadow: 0 5px 0 var(--mrb-shade), 0 9px 18px -2px hsl(var(--primary) / .45), inset 0 1px rgb(255 255 255 / .45); }
.mrb-pb--meridian-primary > span:not(.mrb-led) { color: hsl(var(--primary-foreground)); }
.mrb-pb--meridian-primary .mrb-led { background: hsl(var(--primary-foreground) / .35); }
.mrb-pb--meridian-primary:hover::before, .mrb-pb--meridian-primary:active::before { box-shadow: 0 1px 0 var(--mrb-shade), 0 3px 10px -2px hsl(var(--primary) / .4), inset 0 1px rgb(255 255 255 / .45); }
.mrb-pb--meridian-primary:hover .mrb-led { background: hsl(var(--primary-foreground)); box-shadow: 0 0 6px hsl(var(--primary-foreground)); }

.mrb-pb--aster { height: 52px; border-radius: 12px; isolation: isolate; background: hsl(var(--foreground) / .05); color: hsl(var(--foreground)); font-family: var(--mrb-sans); font-size: 16px; letter-spacing: -.004em; box-shadow: 0 12px 34px -22px hsl(var(--foreground) / .5); backdrop-filter: blur(16px) saturate(1.25); -webkit-backdrop-filter: blur(16px) saturate(1.25); transition: transform .5s cubic-bezier(.22,1,.36,1), background .4s ease, box-shadow .5s cubic-bezier(.22,1,.36,1); }
.mrb-pb--aster::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; padding: 1px; background: linear-gradient(148deg, hsl(var(--primary) / .8), hsl(var(--foreground) / .14) 34%, hsl(var(--foreground) / .05) 58%, hsl(var(--primary) / .4)); mask: linear-gradient(black 0 0) content-box, linear-gradient(black 0 0); mask-composite: exclude; -webkit-mask: linear-gradient(black 0 0) content-box, linear-gradient(black 0 0); -webkit-mask-composite: xor; pointer-events: none; transition: filter .45s cubic-bezier(.22,1,.36,1); }
.mrb-pb--aster::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: linear-gradient(180deg, hsl(var(--background) / .5), transparent 46%); pointer-events: none; }
.mrb-pb--aster > span { position: relative; z-index: 1; }
.mrb-pb--aster:hover { transform: translateY(-1px); background: hsl(var(--primary) / .12); box-shadow: 0 8px 26px -12px hsl(var(--primary) / .5); }
.mrb-pb--aster:hover::before { filter: saturate(1.4); }
.mrb-pb--aster:active { transform: translateY(0); }
.mrb-pb--aster-access { padding: 0 31px; }
.mrb-pb--aster-arrow { gap: 17px; padding: 0 7px 0 22px; }
.mrb-pb--aster-arrow .mrb-chip { position: relative; display: grid; width: 36px; height: 36px; flex: none; place-items: center; border-radius: 9px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
.mrb-pb--aster-arrow svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; transition: transform .5s cubic-bezier(.22,1,.36,1); }
.mrb-pb--aster-arrow:hover svg { transform: translateX(2px); }
`;

const FLOATING_POINTS: [string, number, number, number][] = [
  ["10%", 1, 2.35, 0.2],
  ["30%", 0.7, 2.5, 0.5],
  ["25%", 0.8, 2.2, 0.1],
  ["44%", 0.6, 2.05, 0],
  ["50%", 1, 1.9, 0],
  ["75%", 0.5, 1.5, 1.5],
  ["88%", 0.9, 2.2, 0.2],
  ["58%", 0.8, 2.25, 0.2],
  ["98%", 0.6, 2.6, 0.1],
  ["65%", 1, 2.5, 0.2],
];

const PAGE_VARIANTS = new Set<RectangleButtonVariant>([
  "trochil-signal",
  "attune-thermal",
  "tideform-outline",
  "understory-arrow-pill",
  "meridian-keycap-primary",
  "meridian-keycap-secondary",
  "halvorsen-arrow-pill",
  "aster-glass-access",
  "aster-glass-arrow",
]);

function ArrowRight({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function Chevron({ long = false }: { long?: boolean }) {
  return long ? (
    <svg viewBox="0 0 21 9" aria-hidden="true">
      <path d="M0 4.5h18M14.5 1.2 18.3 4.5l-3.8 3.3" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.5 8 6 3 10.5" />
    </svg>
  );
}

function Letters({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="mrb-gen-letter" style={{ animationDelay: `${i * 0.08}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

export function RectangleButton({
  variant = "meridian-keycap-primary",
  label,
  activeLabel = "Composing",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  avatarSrc = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop",
  avatarAlt = "Reviewer headshot",
  onClick,
  className,
}: RectangleButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const text = label ?? DEFAULT_LABELS[variant];
  const still = prefersReducedMotion ? "mrb-still" : undefined;
  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  let content: ReactNode = null;

  switch (variant) {
    case "dark-pill":
      content = (
        <button type="button" className="mrb-glass-btn" onClick={onClick}>
          <span className="mrb-glass-title">{text}</span>
          <span className="mrb-glass-circle" aria-hidden="true" />
        </button>
      );
      break;

    case "launch-button":
      content = (
        <button type="button" onClick={onClick} className="mrb-launch">
          <span className="mrb-launch-glow" aria-hidden="true" />
          <span className="mrb-launch-face">
            <span>{text}</span>
            <svg
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
          </span>
        </button>
      );
      break;

    case "dot-border-button":
      content = (
        <div className="mrb-db-wrapper">
          <div className="mrb-db-line mrb-db-h mrb-db-top" />
          <div className="mrb-db-line mrb-db-v mrb-db-right" />
          <div className="mrb-db-line mrb-db-h mrb-db-bottom" />
          <div className="mrb-db-line mrb-db-v mrb-db-left" />
          <div className="mrb-db-dot mrb-db-top mrb-db-left" />
          <div className="mrb-db-dot mrb-db-top mrb-db-right" />
          <div className="mrb-db-dot mrb-db-bottom mrb-db-right" />
          <div className="mrb-db-dot mrb-db-bottom mrb-db-left" />
          <button type="button" className="mrb-db-btn" onClick={onClick}>
            <span>{text}</span>
            <svg className="mrb-db-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.6744 11.4075L15.7691 17.1233C15.7072 17.309 15.5586 17.4529 15.3709 17.5087L3.69348 20.9803C3.22819 21.1186 2.79978 20.676 2.95328 20.2155L6.74467 8.84131C6.79981 8.67588 6.92419 8.54263 7.08543 8.47624L12.472 6.25822C12.696 6.166 12.9535 6.21749 13.1248 6.38876L17.5294 10.7935C17.6901 10.9542 17.7463 11.1919 17.6744 11.4075Z" />
              <path d="M3.2959 20.6016L9.65986 14.2376" />
              <path d="M17.7917 11.0557L20.6202 8.22724C21.4012 7.44619 21.4012 6.17986 20.6202 5.39881L18.4989 3.27749C17.7178 2.49645 16.4515 2.49645 15.6704 3.27749L12.842 6.10592" />
              <path d="M11.7814 12.1163C11.1956 11.5305 10.2458 11.5305 9.66004 12.1163C9.07426 12.7021 9.07426 13.6519 9.66004 14.2376C10.2458 14.8234 11.1956 14.8234 11.7814 14.2376C12.3671 13.6519 12.3671 12.7021 11.7814 12.1163Z" />
            </svg>
          </button>
        </div>
      );
      break;

    case "floating-dots-cta":
      content = (
        <button type="button" onClick={onClick} className="mrb-fd">
          <div className="mrb-fd-points">
            {FLOATING_POINTS.map(([left, opacity, duration, delay], index) => (
              <i
                key={index}
                className="mrb-fd-point"
                style={{
                  left,
                  opacity,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
          <span className="mrb-fd-inner">
            {text}
            <svg
              className="mrb-fd-icon"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </button>
      );
      break;

    case "sliding-text-cta":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="group relative inline-flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-card px-[22px] py-[12px] font-sans font-medium tracking-tight text-muted-foreground shadow-[0_3px_2px_hsl(var(--foreground)/0.08),0_7px_5px_hsl(var(--foreground)/0.08),0_12px_10px_hsl(var(--foreground)/0.1)] transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[3px] hover:text-foreground"
        >
          <span className="relative z-10 rounded-full transition-all duration-500 ease-out group-hover:translate-y-8 group-hover:opacity-0 group-hover:blur-md">
            {text}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 z-10 flex -translate-y-8 items-center justify-center rounded-full text-primary opacity-0 blur-md transition-all duration-300 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none"
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent blur-[1px] transition-all duration-[1000ms] group-hover:opacity-80"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-full rounded-full bg-gradient-to-t from-primary/10 via-primary/5 to-transparent transition-all duration-[1000ms] group-hover:opacity-60"
          />
        </button>
      );
      break;

    case "gradient-beam-cta":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="group relative isolate flex items-center justify-center overflow-hidden rounded-full px-12 py-5 font-mono text-xs uppercase tracking-[0.2em] text-foreground transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.6)] focus:outline-none"
        >
          <div className="absolute inset-0 -z-20 overflow-hidden rounded-full p-[1px]">
            <div
              className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_300deg,hsl(var(--primary))_360deg)]"
              style={{ animation: "mrb-gb-spin 3s linear infinite" }}
            />
            <div className="absolute inset-[1px] rounded-full bg-border" />
          </div>
          <div className="absolute inset-[2px] -z-10 overflow-hidden rounded-full bg-card">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/80 to-transparent" />
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(hsl(var(--foreground) / 0.5) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
                animation: "mrb-gb-dots 8s linear infinite",
              }}
            />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-1/2 w-2/3 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl transition-colors duration-500 group-hover:bg-primary/30" />
          </div>
          <span className="relative z-10">{text}</span>
          <ArrowRight className="relative z-10 ml-2 text-primary transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      );
      break;

    case "gradient-pill-button":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="mrb-gp relative flex items-center gap-2 rounded-full bg-gradient-to-b from-foreground/[0.08] via-foreground/[0.03] to-foreground/[0.08] px-6 py-3 font-sans text-sm font-medium text-foreground/75 shadow-[0_18px_35px_-12px_hsl(var(--foreground)/0.3)] transition-all hover:bg-primary/10 hover:text-foreground"
        >
          <span className="tracking-tight">{text}</span>
          <ArrowRight size={16} className="text-primary" />
        </button>
      );
      break;

    case "generate-button":
      content = (
        <div className="mrb-gen-wrap">
          <button
            type="button"
            aria-label={text}
            title={text}
            onClick={onClick}
            className="mrb-gen"
          >
            <svg
              className="mrb-gen-svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              aria-hidden="true"
            >
              <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
            <div className="mrb-gen-txt">
              <div className="mrb-gen-t1">
                <Letters text={text} />
              </div>
              <div className="mrb-gen-t2">
                <Letters text={activeLabel} />
              </div>
            </div>
          </button>
        </div>
      );
      break;

    case "glassmorphism-cta":
      content = (
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onClick?.(event);
          }}
          className="group relative isolate inline-flex cursor-pointer overflow-hidden rounded-full font-sans no-underline shadow-[0_8px_40px_hsl(var(--primary)/0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_hsl(var(--primary)/0.3)]"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-[-200%] h-[400%] w-[400%]">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 225deg, transparent 0, hsl(var(--primary) / 0.8) 90deg, transparent 90deg)",
                }}
              />
            </div>
          </div>
          <div className="absolute inset-[1px] rounded-full bg-foreground/5 backdrop-blur" />
          <div className="relative z-10 flex items-center gap-3 overflow-hidden rounded-full px-4 py-3 text-base font-medium text-foreground">
            <div
              style={{
                position: "absolute",
                width: "200%",
                height: "200%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.25), transparent)",
                animation: "mrb-gm-beam 4s infinite linear",
              }}
            />
            <div
              className="bg-card/90 backdrop-blur-md"
              style={{ position: "absolute", inset: 1, borderRadius: 9999 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt={avatarAlt}
              className="relative z-10 m-0 h-8 w-8 rounded-full object-cover ring-2 ring-primary/30"
            />
            <span className="relative z-10 whitespace-nowrap">{text}</span>
            <span className="relative z-10 ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
                <path d="m14 7 3 3" />
                <path d="M5 6v4" />
                <path d="M19 14v4" />
                <path d="M10 2v2" />
                <path d="M7 8H3" />
                <path d="M21 16h-4" />
                <path d="M11 3H9" />
              </svg>
            </span>
          </div>
        </a>
      );
      break;

    case "spinning-border-button":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_hsl(var(--primary)/0.25)]"
        >
          <span
            className="absolute inset-[-100%] animate-spin opacity-0 transition-all duration-300 group-hover:opacity-100"
            style={{
              animationDuration: "3s",
              background:
                "conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 75%, hsl(var(--primary)) 100%)",
            }}
          />
          <span className="absolute inset-0 rounded-full bg-border transition-all duration-300 group-hover:opacity-0" />
          <span className="relative flex h-full w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-card to-muted px-6 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground shadow-[inset_0_1px_0_hsl(var(--background)/0.6)] transition-all duration-300 group-hover:text-foreground">
            <span className="relative z-10">{text}</span>
            <ArrowRight
              size={14}
              className="relative z-10 text-primary transition-all duration-300 group-hover:translate-x-0.5"
            />
          </span>
        </button>
      );
      break;

    case "gradient-cta":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="group relative overflow-hidden rounded-full px-8 py-4 font-sans font-medium text-primary-foreground transition-all duration-300"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, hsl(var(--primary)) 70%, white), hsl(var(--primary)))",
            boxShadow:
              "0 15px 33px -12px hsl(var(--primary) / 0.8), inset 0 4px 6px rgb(255 255 255 / 0.3), inset 0 -5px 6px color-mix(in oklab, hsl(var(--primary)) 70%, black)",
          }}
        >
          <div className="absolute inset-0 translate-y-full bg-primary-foreground/15 transition-transform duration-300 group-hover:translate-y-0" />
          <span className="relative flex items-center gap-2">
            {text}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
              <path d="m21.854 2.147-10.94 10.939" />
            </svg>
          </span>
        </button>
      );
      break;

    case "lumen-cta":
    case "lumen-cta-ghost": {
      const ghost = variant === "lumen-cta-ghost";
      content = (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "relative inline-flex h-[45px] cursor-pointer appearance-none items-center gap-[10px] whitespace-nowrap rounded-full border-0 font-sans text-[15px] font-semibold leading-none outline outline-1 transition-[background,filter,outline-color] duration-200",
            ghost
              ? "bg-foreground/[0.03] px-[33px] text-foreground outline-foreground/20 backdrop-blur-[12px] hover:bg-primary/10 hover:outline-primary/50"
              : "px-[30px] text-primary-foreground outline-foreground/10 hover:brightness-110",
          )}
          style={
            ghost
              ? undefined
              : {
                  background:
                    "linear-gradient(90deg, color-mix(in oklab, hsl(var(--primary)) 35%, hsl(var(--foreground))) 0%, hsl(var(--primary)) 60%, color-mix(in oklab, hsl(var(--primary)) 55%, white) 100%)",
                  boxShadow:
                    "0 4px 22px hsl(var(--primary) / 0.35), inset 0 1px 0 rgb(255 255 255 / 0.18)",
                }
          }
        >
          {text}
          <i
            aria-hidden="true"
            className={cn(
              "h-[7px] w-[7px] flex-none rounded-full border-[1.3px] border-solid",
              ghost ? "border-primary" : "border-primary-foreground/90",
            )}
          />
        </button>
      );
      break;
    }

    case "trochil-signal":
      content = (
        <button type="button" onClick={onClick} className="mrb-pb mrb-pb--trochil">
          <span>{text}</span>
        </button>
      );
      break;
    case "attune-thermal":
      content = (
        <button type="button" onClick={onClick} className="mrb-pb mrb-pb--attune">
          <span>{text}</span>
          <Chevron />
        </button>
      );
      break;
    case "tideform-outline":
      content = (
        <button type="button" onClick={onClick} className="mrb-pb mrb-pb--tideform">
          <span>{text}</span>
          <Chevron long />
        </button>
      );
      break;
    case "understory-arrow-pill":
    case "halvorsen-arrow-pill":
      content = (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "mrb-pb mrb-pb--arrow-pill",
            variant === "understory-arrow-pill" ? "mrb-pb--understory" : "mrb-pb--halvorsen",
          )}
        >
          <span>{text}</span>
          <span className="mrb-disc">
            <Chevron />
          </span>
        </button>
      );
      break;
    case "meridian-keycap-primary":
    case "meridian-keycap-secondary":
      content = (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "mrb-pb mrb-pb--meridian",
            variant === "meridian-keycap-primary" && "mrb-pb--meridian-primary",
          )}
        >
          <span className="mrb-led" />
          <span>{text}</span>
        </button>
      );
      break;
    case "aster-glass-access":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="mrb-pb mrb-pb--aster mrb-pb--aster-access"
        >
          <span>{text}</span>
        </button>
      );
      break;
    case "aster-glass-arrow":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="mrb-pb mrb-pb--aster mrb-pb--aster-arrow"
        >
          <span>{text}</span>
          <span className="mrb-chip">
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 6h8M6.6 2.6 10 6 6.6 9.4" />
            </svg>
          </span>
        </button>
      );
      break;
  }

  return (
    <div
      className={cn("mrb-stage", PAGE_VARIANTS.has(variant) && "mrb-page", still, className)}
      data-variant={variant}
      style={{ background, filter } as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {content}
    </div>
  );
}
