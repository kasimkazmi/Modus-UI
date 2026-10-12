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
  /** Which of the 22 authored treatments to render. */
  variant?: RectangleButtonVariant;
  /** Ground the treatment is drawn on. */
  mode?: "light" | "dark";
  /** Button text. Each variant has its own authored copy when omitted. */
  label?: string;
  /** Second label the Generate variant resolves to while focused. */
  activeLabel?: string;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Overrides the stage background behind the button. */
  background?: string;
  /** Portrait shown in the Glassmorphism CTA. */
  avatarSrc?: string;
  avatarAlt?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const SYSTEM_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const DEFAULT_LABELS: Record<RectangleButtonVariant, string> = {
  "dark-pill": "Sign up",
  "launch-button": "Initialize Launch",
  "dot-border-button": "Start Creating",
  "floating-dots-cta": "Sign Up",
  "sliding-text-cta": "Download Mac app",
  "gradient-beam-cta": "Start Building",
  "gradient-pill-button": "Demo Lesson",
  "generate-button": "Generate",
  "glassmorphism-cta": "Generate My Site",
  "spinning-border-button": "Request Demo",
  "gradient-cta": "Start Free Pilot",
  "lumen-cta": "Get your card",
  "lumen-cta-ghost": "Get your card",
  "trochil-signal": "Request access",
  "attune-thermal": "Start free",
  "tideform-outline": "See the work",
  "understory-arrow-pill": "Begin",
  "meridian-keycap-primary": "Start free",
  "meridian-keycap-secondary": "Book a walkthrough",
  "halvorsen-arrow-pill": "See the work",
  "aster-glass-access": "Get access",
  "aster-glass-arrow": "Start free",
};

/* ------------------------------------------------------------------ *
 * Scoped styles. Every rule is prefixed `mrb-` so variants never leak.
 * ------------------------------------------------------------------ */
const STYLES = `
.mrb-stage { position: relative; display: grid; width: 100%; height: 100%; place-items: center; overflow: hidden; isolation: isolate; -webkit-font-smoothing: antialiased; }
.mrb-still, .mrb-still *, .mrb-still *::before, .mrb-still *::after { animation: none !important; transition: none !important; }

/* Dark Glass (section-elements.css) */
.mrb-glass { color: rgba(255,255,255,.95); background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; container-type: size; }
.mrb-glass::before { position: absolute; top: 50%; left: 50%; width: min(62cqw, 440px); height: min(50cqh, 240px); border-radius: 50%; background: rgba(255,255,255,.02); filter: blur(54px); transform: translate(-50%,-50%); content: ""; }
.mrb-glass-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: clamp(144px, 23cqw, 288px); height: clamp(52px, 8.3cqw, 104px); padding: 0 32px; overflow: hidden; border: 0; border-radius: 999px; color: rgba(255,255,255,.7); background: transparent; font: inherit; font-size: clamp(14px, 2.25cqw, 28px); font-weight: 600; line-height: 1.4; cursor: pointer; }
.mrb-glass-btn::before, .mrb-glass-btn::after { position: absolute; inset: 0; border-radius: inherit; content: ""; }
.mrb-glass-btn::before { background: rgba(23,23,23,.7); box-shadow: inset 2px 4px 16px rgba(255,255,255,.06); -webkit-backdrop-filter: blur(50px); backdrop-filter: blur(50px); }
.mrb-glass-btn::after { z-index: 2; border: 1px solid rgba(255,255,255,.25); opacity: .25; pointer-events: none; -webkit-mask-image: linear-gradient(170deg, #000, transparent 50%); mask-image: linear-gradient(170deg, #000, transparent 50%); }
.mrb-glass-title { position: relative; z-index: 4; }
.mrb-glass-circle { position: absolute; z-index: 3; top: calc(50% - 100px); left: calc(50% - 100px); width: 200px; height: 200px; }
.mrb-glass-circle::before, .mrb-glass-circle::after { position: absolute; inset: 0; border-radius: 50%; content: ""; }
.mrb-glass-circle::before { background: conic-gradient(from 180deg, rgba(255,255,255,.012) 180deg, rgba(255,255,255,.05) 360deg); filter: blur(15px); animation: mrb-glass-circle 3.6s linear infinite; transition: opacity .5s; }
.mrb-glass-circle::after { inset: 30px; background: rgba(255,255,255,.12); opacity: 0; filter: blur(5px); transform: scale(.5); transition: opacity .5s, transform .7s; -webkit-mask-image: radial-gradient(50% 50%, #000, rgba(23,23,23,0)); mask-image: radial-gradient(50% 50%, #000, rgba(23,23,23,0)); }
.mrb-glass-btn:hover .mrb-glass-circle::before { opacity: 0; }
.mrb-glass-btn:hover .mrb-glass-circle::after { opacity: 1; transform: scale(1); }
.mrb-glass-btn:active { transform: scale(.98); }
@keyframes mrb-glass-circle { 0% { transform: translate(0) rotate(0); } 25% { transform: translateX(-30px) rotate(90deg); } 50% { transform: translate(0) rotate(180deg); } 75% { transform: translateX(30px) rotate(270deg); } 100% { transform: translate(0) rotate(360deg); } }
.mrb-glass[data-mode="light"] { background: #eeedeb; color: rgba(17,17,17,.95); }
.mrb-glass[data-mode="light"]::before { background: rgba(17,17,17,.06); }
.mrb-glass[data-mode="light"] .mrb-glass-btn { color: rgba(17,17,17,.72); }
.mrb-glass[data-mode="light"] .mrb-glass-btn::before { background: rgba(255,255,255,.72); box-shadow: inset 2px 4px 16px rgba(17,17,17,.05), 0 10px 26px -12px rgba(17,17,17,.4); }
.mrb-glass[data-mode="light"] .mrb-glass-btn::after { border-color: rgba(17,17,17,.34); opacity: .45; }
.mrb-glass[data-mode="light"] .mrb-glass-circle::before { background: conic-gradient(from 180deg, rgba(17,17,17,.012) 180deg, rgba(17,17,17,.07) 360deg); }
.mrb-glass[data-mode="light"] .mrb-glass-circle::after { background: rgba(17,17,17,.12); }

/* Dot Border Button */
.mrb-db-wrapper { --dot-size: 8px; --line-weight: 1px; --line-distance: 0.8rem 1rem; --animation-speed: 0.35s; position: relative; display: inline-flex; justify-content: center; align-items: center; padding: var(--line-distance); user-select: none; isolation: isolate; }
.mrb-db-wrapper::after { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit; pointer-events: none; background-image: repeating-linear-gradient(45deg, var(--grid-color) 0 1px, transparent 2px 5px); opacity: 0; z-index: -1; }
.mrb-db-wrapper:has(.mrb-db-btn:hover)::after { animation: mrb-db-opacity calc(var(--animation-speed) * 4) ease-in-out forwards; }
@keyframes mrb-db-opacity { 80% { opacity: 0; } 100% { opacity: 1; } }
.mrb-db-btn { position: relative; display: flex; justify-content: center; align-items: center; padding: 0.8rem 1.25rem; background-color: #fff0; border: 1px solid var(--grid-color); color: var(--label-color); font-family: "Inter", sans-serif; letter-spacing: -0.01em; font-size: 1rem; font-weight: 600; line-height: 1.5; text-transform: capitalize; border-radius: 6px; cursor: pointer; transition: transform .2s ease-in-out, letter-spacing .2s ease-in-out; }
.mrb-db-btn:hover { background-color: #25358b; color: #fff; transform: scale(1.05); letter-spacing: .06em; }
.mrb-db-btn:active { background-color: #25358b; transform: scale(.98); letter-spacing: .02em; }
.mrb-db-svg { margin-left: .5rem; height: 24px; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; stroke: var(--svg-stroke); fill: var(--svg-fill); transition: all .2s ease-in-out; }
.mrb-db-btn:hover .mrb-db-svg { stroke: var(--dot-color); fill: var(--grid-color); }
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
.mrb-db-line.mrb-db-h { height: var(--line-weight); width: 100%; background-image: repeating-linear-gradient(90deg, #0000 0 calc(var(--line-weight) * 2), var(--dot-color) calc(var(--line-weight) * 2) calc(var(--line-weight) * 4)); }
.mrb-db-line.mrb-db-top { top: calc(var(--line-weight) * -0.5); transform-origin: top left; transform: rotate(5deg) scaleX(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-top { animation: mrb-db-draw-top var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * .8); }
@keyframes mrb-db-draw-top { 100% { transform: rotate(0deg) scaleX(1); } }
.mrb-db-line.mrb-db-bottom { bottom: calc(var(--line-weight) * -0.5); transform-origin: bottom right; transform: rotate(5deg) scaleX(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-bottom { animation: mrb-db-draw-bottom var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 2); }
@keyframes mrb-db-draw-bottom { 100% { transform: rotate(0deg) scaleX(1); } }
.mrb-db-line.mrb-db-v { width: var(--line-weight); height: 100%; background-image: repeating-linear-gradient(0deg, #0000 0 calc(var(--line-weight) * 2), var(--dot-color) calc(var(--line-weight) * 2) calc(var(--line-weight) * 4)); }
.mrb-db-line.mrb-db-left { left: calc(var(--line-weight) * -0.5); transform-origin: bottom left; transform: rotate(0deg) scaleY(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-left { animation: mrb-db-draw-left var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 2.4); }
@keyframes mrb-db-draw-left { 100% { transform: rotate(0deg) scaleY(1); } }
.mrb-db-line.mrb-db-right { right: calc(var(--line-weight) * -0.5); transform-origin: top right; transform: rotate(5deg) scaleY(0); }
.mrb-db-wrapper:has(.mrb-db-btn:hover) .mrb-db-line.mrb-db-right { animation: mrb-db-draw-right var(--animation-speed) ease-in-out forwards; animation-delay: calc(var(--animation-speed) * 1.4); }
@keyframes mrb-db-draw-right { 100% { transform: rotate(0deg) scaleY(1); } }

/* Floating Dots CTA */
.mrb-fd { cursor: pointer; position: relative; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.25s ease; background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(34,211,238,0.8) 0%, rgba(34,211,238,0) 100%), linear-gradient(0deg, #2563eb, #2563eb); border-radius: 0.75rem; border: none; outline: none; padding: 12px 18px; min-height: 48px; min-width: 102px; font: inherit; }
.mrb-fd::before, .mrb-fd::after { content: ""; position: absolute; transition: all 0.5s ease-in-out; z-index: 0; }
.mrb-fd::before { inset: 1px; border-radius: calc(0.75rem - 1px); background: linear-gradient(177.95deg, rgba(255,255,255,0.19) 0%, rgba(255,255,255,0) 100%); }
.mrb-fd::after { inset: 2px; border-radius: calc(0.75rem - 2px); background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(34,211,238,0.8) 0%, rgba(34,211,238,0) 100%), linear-gradient(0deg, #2563eb, #2563eb); }
.mrb-fd:active { transform: scale(0.95); }
.mrb-fd-points { overflow: hidden; width: 100%; height: 100%; pointer-events: none; position: absolute; z-index: 1; }
.mrb-fd-point { bottom: -10px; position: absolute; animation: mrb-fd-floating infinite ease-in-out; pointer-events: none; width: 2px; height: 2px; background-color: #fff; border-radius: 9999px; }
@keyframes mrb-fd-floating { 0% { transform: translateY(0); } 85% { opacity: 0; } 100% { transform: translateY(-55px); opacity: 0; } }
.mrb-fd-inner { z-index: 2; gap: 6px; position: relative; width: 100%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; line-height: 1.5; transition: color 0.2s ease-in-out; }
.mrb-fd-icon { width: 18px; height: 18px; transition: transform 0.3s ease; stroke: white; fill: none; }
.mrb-fd:hover .mrb-fd-icon { transform: translateX(2px); }
.mrb-fd:hover .mrb-fd-icon path { animation: mrb-fd-dash 0.8s linear forwards; }
@keyframes mrb-fd-dash { 0% { stroke-dasharray: 0, 20; stroke-dashoffset: 0; } 50% { stroke-dasharray: 10, 10; stroke-dashoffset: -5; } 100% { stroke-dasharray: 20, 0; stroke-dashoffset: -10; } }

/* Gradient Beam CTA */
@keyframes mrb-gb-spin { to { transform: rotate(360deg); } }
@keyframes mrb-gb-dots { 0% { background-position: 0 0; } 100% { background-position: 24px 24px; } }

/* Gradient Pill Button */
.mrb-gp::before { content: ""; position: absolute; inset: 0; padding: 1px; border-radius: 9999px; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(0,0,0,0.4), rgba(255,255,255,0.8)); pointer-events: none; }

/* Generate Button */
.mrb-gen-wrap { position: relative; display: inline-block; font-family: ${SYSTEM_FONT}; isolation: isolate; }
.mrb-gen { --border-radius: 24px; --padding: 4px; --transition: .4s; position: relative; user-select: none; display: flex; justify-content: center; align-items: center; padding: .5rem 1rem; font: inherit; font-size: 16px; line-height: 1.5; color: #fff; background-color: var(--button-color); box-shadow: inset 0px 1px 1px rgba(255,255,255,.2), inset 0px 2px 2px rgba(255,255,255,.15), inset 0px 4px 4px rgba(255,255,255,.1), inset 0px 8px 8px rgba(255,255,255,.05), inset 0px 16px 16px rgba(255,255,255,.05), 0px -1px 1px rgba(0,0,0,.02), 0px -2px 2px rgba(0,0,0,.03), 0px -4px 4px rgba(0,0,0,.05), 0px -8px 8px rgba(0,0,0,.06), 0px -16px 16px rgba(0,0,0,.08); border: solid 1px #ffffff22; border-radius: var(--border-radius); cursor: pointer; outline: none; transition: box-shadow var(--transition), border var(--transition), background-color var(--transition); }
.mrb-gen::before { content: ""; position: absolute; top: calc(0px - var(--padding)); left: calc(0px - var(--padding)); width: calc(100% + var(--padding) * 2); height: calc(100% + var(--padding) * 2); border-radius: calc(var(--border-radius) + var(--padding)); pointer-events: none; background-image: linear-gradient(0deg, #0004, #000a); z-index: -1; transition: box-shadow var(--transition), filter var(--transition); box-shadow: 0 -8px 8px -6px #0000 inset, 0 -16px 16px -8px #00000000 inset, 1px 1px 1px #fff2, 2px 2px 2px #fff1, -1px -1px 1px #0002, -2px -2px 2px #0001; }
.mrb-gen::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background-image: linear-gradient(0deg, #fff, hsl(var(--gen-hue),100%,70%), hsla(var(--gen-hue),100%,70%,50%), 8%, transparent); background-position: 0 0; opacity: 0; transition: opacity var(--transition), filter var(--transition); }
.mrb-gen-letter { position: relative; display: inline-block; color: #ffffff55; animation: mrb-gen-letter 2s ease-in-out infinite; transition: color var(--transition), text-shadow var(--transition), opacity var(--transition); }
@keyframes mrb-gen-letter { 50% { text-shadow: 0 0 3px #ffffff88; color: #fff; } }
.mrb-gen-svg { flex-grow: 1; height: 24px; margin-right: .5rem; fill: #e8e8e8; animation: mrb-gen-flicker 2s linear infinite; animation-delay: .5s; filter: drop-shadow(0 0 2px #ffffff99); transition: fill var(--transition), filter var(--transition), opacity var(--transition); }
@keyframes mrb-gen-flicker { 50% { opacity: .3; } }
.mrb-gen-txt { position: relative; display: flex; align-items: center; min-width: 6.4em; }
.mrb-gen-t1, .mrb-gen-t2 { position: absolute; word-spacing: -1em; }
.mrb-gen-t1 { animation: mrb-gen-appear 1s ease-in-out forwards; }
.mrb-gen-t2 { opacity: 0; }
@keyframes mrb-gen-appear { 0% { opacity: 0; } 100% { opacity: 1; } }
.mrb-gen:focus .mrb-gen-t1 { animation: mrb-gen-opacity .3s ease-in-out forwards; animation-delay: 1s; }
.mrb-gen:focus .mrb-gen-t2 { animation: mrb-gen-opacity .3s ease-in-out reverse forwards; animation-delay: 1s; }
@keyframes mrb-gen-opacity { 0% { opacity: 1; } 100% { opacity: 0; } }
.mrb-gen:focus .mrb-gen-letter { animation: mrb-gen-focused 1s ease-in-out forwards, mrb-gen-letter 1.2s ease-in-out infinite; }
@keyframes mrb-gen-focused { 0%, 100% { filter: blur(0px); } 50% { transform: scale(2); filter: blur(10px) brightness(150%) drop-shadow(-36px 12px 12px hsl(var(--gen-hue),100%,70%)); } }
.mrb-gen:focus .mrb-gen-svg { animation-duration: 1.2s; animation-delay: .2s; }
.mrb-gen:focus::before { box-shadow: 0 -8px 12px -6px #fff3 inset, 0 -16px 16px -8px hsla(var(--gen-hue),100%,70%,20%) inset, 1px 1px 1px #fff3, 2px 2px 2px #fff1, -1px -1px 1px #0002, -2px -2px 2px #0001; }
.mrb-gen:focus::after { opacity: .6; -webkit-mask-image: linear-gradient(0deg, #fff, transparent); mask-image: linear-gradient(0deg, #fff, transparent); filter: brightness(100%); }
.mrb-gen:active { border: solid 1px hsla(var(--gen-hue),100%,80%,.7); background-color: hsla(var(--gen-hue),50%,20%,.5); }
.mrb-gen:active::before { box-shadow: 0 -8px 12px -6px #fffa inset, 0 -16px 16px -8px hsla(var(--gen-hue),100%,70%,.8) inset, 1px 1px 1px #fff4, 2px 2px 2px #fff2, -1px -1px 1px #0002, -2px -2px 2px #0001; }
.mrb-gen:active::after { opacity: 1; -webkit-mask-image: linear-gradient(0deg, #fff, transparent); mask-image: linear-gradient(0deg, #fff, transparent); filter: brightness(200%); }
.mrb-gen:active .mrb-gen-letter { text-shadow: 0 0 1px hsla(var(--gen-hue),100%,90%,.9); animation: none; }
.mrb-gen:hover { border: solid 1px hsla(var(--gen-hue),100%,80%,.4); }
.mrb-gen:hover::before { box-shadow: 0 -8px 8px -6px #fffa inset, 0 -16px 16px -8px hsla(var(--gen-hue),100%,70%,.3) inset, 1px 1px 1px #fff2, 2px 2px 2px #fff1, -1px -1px 1px #0002, -2px -2px 2px #0001; }
.mrb-gen:hover::after { opacity: 1; -webkit-mask-image: linear-gradient(0deg, #fff, transparent); mask-image: linear-gradient(0deg, #fff, transparent); }
.mrb-gen:hover .mrb-gen-svg { fill: #fff; filter: drop-shadow(0 0 3px hsl(var(--gen-hue),100%,70%)) drop-shadow(0 -4px 6px #0009); animation: none; }

/* Glassmorphism CTA */
@keyframes mrb-gm-beam { 0% { transform: translate(-50%,-50%) rotate(0deg); } 100% { transform: translate(-50%,-50%) rotate(360deg); } }

/* Selected-page buttons (RectangleButtons.tsx) */
.mrb-page { --mrb-ink: #fff; background: #050505; color: var(--mrb-ink); font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; }
.mrb-page::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.mrb-pb { position: relative; display: inline-flex; align-items: center; justify-content: center; border: 0; font: inherit; text-decoration: none; white-space: nowrap; cursor: pointer; -webkit-font-smoothing: antialiased; }
.mrb-pb:focus-visible { outline: 2px solid var(--mrb-ink); outline-offset: 5px; }
.mrb-page--trochil { background: #030303; }
.mrb-page--trochil::before { background: radial-gradient(circle at 71% 49%, rgba(251,215,54,.18), transparent 31%); opacity: .72; }
.mrb-pb--trochil { height: 52px; padding: 0 30px; overflow: hidden; border: 1px solid rgba(255,255,255,.27); background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.36)); box-shadow: 0 15px 36px rgba(0,0,0,.48), inset 0 1px rgba(255,255,255,.08); color: rgba(255,255,255,.82); font-size: 14px; font-weight: 500; transition: border-color .28s ease, color .28s ease, transform .28s ease, box-shadow .28s ease; }
.mrb-pb--trochil::before { content: ""; position: absolute; inset: -1px; background: linear-gradient(105deg, transparent 17%, rgba(251,215,54,.25) 48%, transparent 76%); transform: translateX(-125%); transition: transform .65s cubic-bezier(.22,.61,.36,1); }
.mrb-pb--trochil span { position: relative; }
.mrb-pb--trochil:hover { border-color: rgba(251,215,54,.58); color: #fff; transform: translateY(-2px); box-shadow: 0 18px 42px rgba(0,0,0,.58), 0 0 24px rgba(251,215,54,.12); }
.mrb-pb--trochil:hover::before { transform: translateX(125%); }
.mrb-page--attune { background: #070709; }
.mrb-page--attune::before { background: radial-gradient(circle at 50% 50%, rgba(255,122,20,.12), transparent 32%); }
.mrb-pb--attune { gap: 10px; height: 52px; padding: 0 22px; border-radius: 11px; background: linear-gradient(180deg, #ffa347 0%, #ff7a14 48%, #f2610a 100%); box-shadow: inset 0 1px rgba(255,255,255,.26), 0 8px 28px rgba(255,122,20,.28); color: #1a0e04; font-size: 14px; font-weight: 650; letter-spacing: .012em; transition: filter .18s ease, transform .18s ease, box-shadow .18s ease; }
.mrb-pb--attune svg { width: 8px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.7; }
.mrb-pb--attune:hover { filter: brightness(1.09); transform: translateY(-2px); box-shadow: inset 0 1px rgba(255,255,255,.34), 0 12px 34px rgba(255,122,20,.36); }
.mrb-pb--attune:active { transform: translateY(1px); }
.mrb-page--tideform { background: #16181a; font-family: "Roboto Mono", "SFMono-Regular", Consolas, monospace; }
.mrb-page--tideform::before { background: radial-gradient(ellipse at 76% 44%, rgba(255,122,24,.12), transparent 34%); }
.mrb-pb--tideform { gap: 18px; padding: 17px 24px; border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.055); box-shadow: inset 0 1px rgba(255,255,255,.035); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; transition: border-color .25s ease, background-color .25s ease, color .25s ease; }
.mrb-pb--tideform svg { width: 21px; height: 9px; fill: none; stroke: currentColor; stroke-width: 1.25; transition: transform .25s cubic-bezier(.2,.8,.2,1); }
.mrb-pb--tideform:hover { border-color: #ff7a18; color: #ff7a18; background: rgba(255,122,24,.14); }
.mrb-pb--tideform:hover svg { transform: translateX(4px); }
.mrb-page--understory { --mrb-ink: #27222d; background: #f2efe7; color: #27222d; }
.mrb-page--understory::before { background: none; }
.mrb-pb--arrow-pill { gap: 18px; height: 54px; padding: 0 11px 0 36px; border-radius: 999px; font-size: 17px; letter-spacing: -.005em; transition: background .3s ease, transform .3s ease, color .3s ease; }
.mrb-pb--arrow-pill .mrb-disc { display: grid; width: 32px; height: 32px; flex: none; place-items: center; border-radius: 50%; }
.mrb-pb--arrow-pill svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 2; transition: transform .3s ease; }
.mrb-pb--arrow-pill:hover { transform: translateY(-2px); }
.mrb-pb--arrow-pill:hover svg { transform: translateX(2px); }
.mrb-pb--understory { background: #9b78d0; color: #fff; box-shadow: 0 14px 30px rgba(82,53,112,.18); }
.mrb-pb--understory .mrb-disc { background: #f6f3ed; color: #9b78d0; }
.mrb-pb--understory:hover { background: #8d69c5; }
.mrb-page--halvorsen { background: #111113; }
.mrb-page--halvorsen::before { background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.06), transparent 35%); }
.mrb-pb--halvorsen { background: #f0eee7; color: #111113; box-shadow: 0 14px 34px rgba(0,0,0,.32); }
.mrb-pb--halvorsen .mrb-disc { background: #111113; color: #f0eee7; }
.mrb-pb--halvorsen:hover { background: #fff; }
.mrb-page--meridian { background: #04070d; }
.mrb-page--meridian::before { background: radial-gradient(circle at 50% 44%, rgba(77,163,255,.13), transparent 34%); }
.mrb-pb--meridian { height: 62px; padding: 0 30px; border-radius: 15px; flex-shrink: 0; background: #0c1017; box-shadow: inset 0 0 0 1px rgba(255,255,255,.07); }
.mrb-pb--meridian::before { content: ""; position: absolute; inset: 3px 4px 9px; border-radius: 12px; background: linear-gradient(180deg, #2a3142, #1c2230); box-shadow: 0 5px 0 #080b11, 0 9px 15px -2px rgba(0,0,0,.62), inset 0 1px rgba(255,255,255,.11); transition: transform .13s cubic-bezier(.22,.61,.36,1), box-shadow .13s cubic-bezier(.22,.61,.36,1); }
.mrb-pb--meridian > span:not(.mrb-led) { position: relative; z-index: 1; color: #dde5f2; font-size: 14.5px; font-weight: 600; letter-spacing: -.005em; }
.mrb-pb--meridian .mrb-led { position: absolute; z-index: 1; top: 12px; left: 50%; width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,.16); transform: translateX(-50%); transition: background .22s ease, box-shadow .22s ease; }
.mrb-pb--meridian:hover::before { transform: translateY(4px); box-shadow: 0 1px 0 #080b11, 0 3px 8px -2px rgba(0,0,0,.55), inset 0 1px rgba(255,255,255,.11); }
.mrb-pb--meridian:hover .mrb-led { background: #4da3ff; box-shadow: 0 0 7px #4da3ff; }
.mrb-pb--meridian-primary { background: #050f1c; box-shadow: inset 0 0 0 1px rgba(77,163,255,.22); }
.mrb-pb--meridian-primary::before { background: linear-gradient(180deg, #6db6ff, #2e85e8); box-shadow: 0 5px 0 #0b4a86, 0 9px 18px -2px rgba(21,88,158,.5), inset 0 1px rgba(255,255,255,.5); }
.mrb-pb--meridian-primary > span:not(.mrb-led) { color: #04182f; }
.mrb-pb--meridian-primary .mrb-led { background: rgba(4,24,47,.3); }
.mrb-pb--meridian-primary:hover::before { box-shadow: 0 1px 0 #0b4a86, 0 3px 10px -2px rgba(21,88,158,.45), inset 0 1px rgba(255,255,255,.5); }
.mrb-pb--meridian-primary:hover .mrb-led { background: #04182f; box-shadow: 0 0 6px rgba(4,24,47,.55); }
.mrb-page--aster { background: #101010; font-family: "Roboto Flex", "Arial Narrow", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; }
.mrb-page--aster::before { background: radial-gradient(circle at 64% 42%, rgba(255,255,255,.07), transparent 21%), radial-gradient(circle at 38% 62%, rgba(255,255,255,.035), transparent 27%); }
.mrb-pb--aster { height: 52px; border-radius: 12px; isolation: isolate; background: rgba(255,255,255,.055); color: #f1f1f1; font-size: 17px; font-variation-settings: "wdth" 100, "opsz" 14; letter-spacing: -.004em; box-shadow: 0 12px 34px -22px rgba(255,255,255,.35); backdrop-filter: blur(16px) saturate(1.25); -webkit-backdrop-filter: blur(16px) saturate(1.25); transition: transform .5s cubic-bezier(.22,1,.36,1), background .4s ease, color .4s ease, box-shadow .5s cubic-bezier(.22,1,.36,1); }
.mrb-pb--aster::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; padding: 1px; background: linear-gradient(148deg, rgba(255,255,255,.72), rgba(255,255,255,.16) 34%, rgba(255,255,255,.05) 58%, rgba(255,255,255,.34)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; pointer-events: none; transition: filter .45s cubic-bezier(.22,1,.36,1); }
.mrb-pb--aster::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: linear-gradient(180deg, rgba(255,255,255,.13), transparent 46%); pointer-events: none; }
.mrb-pb--aster > span { position: relative; z-index: 1; }
.mrb-pb--aster:hover { transform: translateY(-1px); background: rgba(255,255,255,.15); color: #fff; box-shadow: 0 8px 26px -12px rgba(255,255,255,.42); }
.mrb-pb--aster:hover::before { filter: brightness(1.55); }
.mrb-pb--aster:active { transform: translateY(0); }
.mrb-pb--aster-access { padding: 0 31px; }
.mrb-pb--aster-arrow { gap: 17px; padding: 0 7px 0 22px; }
.mrb-pb--aster-arrow .mrb-chip { display: grid; width: 34px; height: 34px; flex: none; place-items: center; border-radius: 9px; background: rgba(255,255,255,.10); }
.mrb-pb--aster-arrow .mrb-chip::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; background: linear-gradient(150deg, rgba(255,255,255,.75), rgba(255,255,255,.10) 62%, rgba(255,255,255,.42)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; pointer-events: none; }
.mrb-pb--aster-arrow svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; transition: transform .5s cubic-bezier(.22,1,.36,1); }
.mrb-pb--aster-arrow:hover svg { transform: translateX(2px); }

/* The other ground */
.mrb-page[data-mode="light"] { --mrb-ink: #14161a; }
.mrb-page--trochil[data-mode="light"] { background: #f5f3ee; }
.mrb-page--trochil[data-mode="light"]::before { background: radial-gradient(circle at 71% 49%, rgba(196,142,6,.22), transparent 31%); opacity: .9; }
.mrb-page--trochil[data-mode="light"] .mrb-pb--trochil { border-color: rgba(20,19,14,.22); background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(20,19,14,.05)); box-shadow: 0 14px 30px rgba(20,19,14,.13), inset 0 1px rgba(255,255,255,.9); color: rgba(20,19,14,.78); }
.mrb-page--trochil[data-mode="light"] .mrb-pb--trochil::before { background: linear-gradient(105deg, transparent 17%, rgba(196,142,6,.3) 48%, transparent 76%); }
.mrb-page--trochil[data-mode="light"] .mrb-pb--trochil:hover { border-color: rgba(176,126,4,.62); color: #14130e; box-shadow: 0 18px 38px rgba(20,19,14,.17), 0 0 22px rgba(196,142,6,.2); }
.mrb-page--attune[data-mode="light"] { background: #faf4ee; }
.mrb-page--attune[data-mode="light"]::before { background: radial-gradient(circle at 50% 50%, rgba(255,122,20,.18), transparent 32%); }
.mrb-page--attune[data-mode="light"] .mrb-pb--attune { box-shadow: inset 0 1px rgba(255,255,255,.5), 0 8px 24px rgba(226,92,6,.28); }
.mrb-page--attune[data-mode="light"] .mrb-pb--attune:hover { box-shadow: inset 0 1px rgba(255,255,255,.58), 0 12px 30px rgba(226,92,6,.34); }
.mrb-page--tideform[data-mode="light"] { background: #eeece7; --mrb-ink: #16181a; }
.mrb-page--tideform[data-mode="light"]::before { background: radial-gradient(ellipse at 76% 44%, rgba(214,96,12,.16), transparent 34%); }
.mrb-page--tideform[data-mode="light"] .mrb-pb--tideform { border-color: rgba(22,24,26,.26); background: rgba(22,24,26,.035); box-shadow: inset 0 1px rgba(255,255,255,.7); color: #16181a; }
.mrb-page--tideform[data-mode="light"] .mrb-pb--tideform:hover { border-color: #c25a0c; background: rgba(194,90,12,.1); color: #b4530b; }
.mrb-page--understory[data-mode="dark"] { --mrb-ink: #ece7e0; background: #17141b; color: #ece7e0; }
.mrb-page--understory[data-mode="dark"]::before { background: radial-gradient(circle at 50% 50%, rgba(155,120,208,.16), transparent 34%); }
.mrb-page--understory[data-mode="dark"] .mrb-pb--understory { background: #a482d9; box-shadow: 0 16px 34px rgba(0,0,0,.5); }
.mrb-page--understory[data-mode="dark"] .mrb-pb--understory:hover { background: #b08fe2; }
.mrb-page--halvorsen[data-mode="light"] { background: #eeece5; }
.mrb-page--halvorsen[data-mode="light"]::before { background: radial-gradient(circle at 50% 50%, rgba(17,17,19,.05), transparent 35%); }
.mrb-page--halvorsen[data-mode="light"] .mrb-pb--halvorsen { background: #111113; box-shadow: 0 14px 30px rgba(17,17,19,.22); color: #f0eee7; }
.mrb-page--halvorsen[data-mode="light"] .mrb-pb--halvorsen .mrb-disc { background: #f0eee7; color: #111113; }
.mrb-page--halvorsen[data-mode="light"] .mrb-pb--halvorsen:hover { background: #000; }
.mrb-page--meridian[data-mode="light"] { background: #e9eef5; --mrb-ink: #04070d; }
.mrb-page--meridian[data-mode="light"]::before { background: radial-gradient(circle at 50% 44%, rgba(46,133,232,.2), transparent 34%); }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian { background: #dfe5ee; box-shadow: inset 0 0 0 1px rgba(4,7,13,.09); }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian::before { background: linear-gradient(180deg, #fbfcfe, #e3e8f1); box-shadow: 0 5px 0 #bcc5d3, 0 9px 15px -2px rgba(4,7,13,.2), inset 0 1px #fff; }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian > span:not(.mrb-led) { color: #1d2532; }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian .mrb-led { background: rgba(4,7,13,.18); }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian:hover::before { box-shadow: 0 1px 0 #bcc5d3, 0 3px 8px -2px rgba(4,7,13,.18), inset 0 1px #fff; }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian:hover .mrb-led { background: #2e85e8; box-shadow: 0 0 7px #2e85e8; }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian-primary { background: #dbe7f6; box-shadow: inset 0 0 0 1px rgba(46,133,232,.3); }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian-primary::before { background: linear-gradient(180deg, #6db6ff, #2e85e8); box-shadow: 0 5px 0 #1d6dc4, 0 9px 18px -2px rgba(21,88,158,.32), inset 0 1px rgba(255,255,255,.5); }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian-primary > span:not(.mrb-led) { color: #04182f; }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian-primary .mrb-led { background: rgba(4,24,47,.3); }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian-primary:hover::before { box-shadow: 0 1px 0 #1d6dc4, 0 3px 10px -2px rgba(21,88,158,.3), inset 0 1px rgba(255,255,255,.5); }
.mrb-page--meridian[data-mode="light"] .mrb-pb--meridian-primary:hover .mrb-led { background: #04182f; box-shadow: 0 0 6px rgba(4,24,47,.55); }
.mrb-page--aster[data-mode="light"] { background: #eceae7; --mrb-ink: #101010; }
.mrb-page--aster[data-mode="light"]::before { background: radial-gradient(circle at 64% 42%, rgba(16,16,16,.06), transparent 21%), radial-gradient(circle at 38% 62%, rgba(16,16,16,.035), transparent 27%); }
.mrb-page--aster[data-mode="light"] .mrb-pb--aster { background: rgba(16,16,16,.05); box-shadow: 0 14px 34px -22px rgba(16,16,16,.55); color: #16181a; }
.mrb-page--aster[data-mode="light"] .mrb-pb--aster::before { background: linear-gradient(148deg, rgba(16,16,16,.45), rgba(16,16,16,.12) 34%, rgba(16,16,16,.05) 58%, rgba(16,16,16,.26)); }
.mrb-page--aster[data-mode="light"] .mrb-pb--aster::after { background: linear-gradient(180deg, rgba(255,255,255,.8), transparent 46%); }
.mrb-page--aster[data-mode="light"] .mrb-pb--aster:hover { background: rgba(16,16,16,.1); box-shadow: 0 8px 26px -12px rgba(16,16,16,.3); color: #000; }
.mrb-page--aster[data-mode="light"] .mrb-pb--aster:hover::before { filter: brightness(.68); }
.mrb-page--aster[data-mode="light"] .mrb-pb--aster-arrow .mrb-chip { background: rgba(16,16,16,.07); }
.mrb-page--aster[data-mode="light"] .mrb-pb--aster-arrow .mrb-chip::before { background: linear-gradient(150deg, rgba(16,16,16,.5), rgba(16,16,16,.1) 62%, rgba(16,16,16,.3)); }
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

const DOT_BORDER_INK = {
  dark: { dot: "#fffa", grid: "#fff3", label: "#fffd", stroke: "#fff4", fill: "#fff2" },
  light: { dot: "#111a", grid: "#1113", label: "#111d", stroke: "#1114", fill: "#1112" },
};

const LUMEN_GRADIENT =
  "linear-gradient(90deg, #050014 0%, #0d0029 20%, #1e0066 40%, #2f00ab 60%, #5227c0 75%, #9470d9 100%)";

const PAGE_THEME: Partial<Record<RectangleButtonVariant, string>> = {
  "trochil-signal": "trochil",
  "attune-thermal": "attune",
  "tideform-outline": "tideform",
  "understory-arrow-pill": "understory",
  "meridian-keycap-primary": "meridian",
  "meridian-keycap-secondary": "meridian",
  "halvorsen-arrow-pill": "halvorsen",
  "aster-glass-access": "aster",
  "aster-glass-arrow": "aster",
};

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
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

export function RectangleButton({
  variant = "dark-pill",
  mode = "dark",
  label,
  activeLabel = "Generating",
  hue = 0,
  saturation = 1,
  brightness = 1,
  background,
  avatarSrc = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop",
  avatarAlt = "Advisor headshot",
  onClick,
  className,
}: RectangleButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const text = label ?? DEFAULT_LABELS[variant];
  const light = mode === "light";
  const still = prefersReducedMotion ? "mrb-still" : undefined;
  const grade = `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)})`;
  const level = clamp(brightness, 0.35, 1.65);
  const filter = `${grade} brightness(${level})`;

  let stageClass = "";
  let stageBackground: string | undefined = light ? "#f4f7fb" : "#111318";
  let stageFont: string | undefined = SYSTEM_FONT;
  let stageFilter: string | undefined = filter;
  let content: ReactNode = null;

  switch (variant) {
    case "dark-pill":
      stageClass = "mrb-glass";
      stageBackground = undefined;
      stageFont = undefined;
      content = (
        <button type="button" className="mrb-glass-btn" onClick={onClick}>
          <span className="mrb-glass-title">{text}</span>
          <span className="mrb-glass-circle" aria-hidden="true" />
        </button>
      );
      break;

    case "launch-button":
      content = (
        <button type="button" onClick={onClick} className="group/btn relative">
          <div className="absolute -inset-1 rounded-xl bg-amber-500/40 opacity-40 blur transition duration-500 group-hover/btn:opacity-75" />
          <div className="relative flex items-center gap-3 rounded-xl bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 px-8 py-4 text-amber-950 shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_4px_0_#b45309,0_10px_15px_-3px_rgba(0,0,0,0.5)] transition-all duration-150 active:translate-y-[2px] active:shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_2px_0_#b45309]">
            <span className="text-lg font-medium tracking-tight">{text}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 fill-amber-950/20 stroke-[1.5]"
              aria-hidden="true"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
          </div>
        </button>
      );
      break;

    case "dot-border-button": {
      const ink = DOT_BORDER_INK[mode];
      content = (
        <div
          className="mrb-db-wrapper"
          style={
            {
              "--dot-color": ink.dot,
              "--grid-color": ink.grid,
              "--label-color": ink.label,
              "--svg-stroke": ink.stroke,
              "--svg-fill": ink.fill,
            } as CSSProperties
          }
        >
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
    }

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
          className="group relative inline-flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-neutral-600 bg-neutral-800 px-[20px] py-[12px] font-semibold tracking-tight text-neutral-400 shadow-[0_2.8px_2.2px_rgba(0,0,0,0.3),_0_6.7px_5.3px_rgba(0,0,0,0.35),_0_12.5px_10px_rgba(0,0,0,0.4)] transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[3px] hover:text-white"
        >
          <span className="relative z-10 rounded-full font-medium transition-all duration-500 ease-out group-hover:translate-y-8 group-hover:opacity-0 group-hover:blur-md">
            {text}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 z-10 flex -translate-y-8 items-center justify-center rounded-full font-medium opacity-0 blur-md transition-all duration-300 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none"
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent blur-[2px] transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] group-hover:opacity-80"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-full rounded-full bg-gradient-to-t from-white/20 via-white/10 to-transparent transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] group-hover:opacity-60"
          />
        </button>
      );
      break;

    case "gradient-beam-cta":
      content = (
        <button
          type="button"
          onClick={onClick}
          className="group relative isolate flex items-center justify-center overflow-hidden rounded-full px-12 py-5 text-sm font-medium uppercase tracking-widest text-white transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)] focus:outline-none"
        >
          <div className="absolute inset-0 -z-20 overflow-hidden rounded-full p-[1px]">
            <div
              className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#ea580c_360deg)]"
              style={{ animation: "mrb-gb-spin 3s linear infinite" }}
            />
            <div className="absolute inset-[1px] rounded-full bg-black" />
          </div>
          <div className="absolute inset-[2px] -z-10 overflow-hidden rounded-full bg-zinc-950">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/60 to-transparent" />
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
                animation: "mrb-gb-dots 8s linear infinite",
              }}
            />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-1/2 w-2/3 -translate-x-1/2 rounded-full bg-orange-500/10 blur-2xl transition-colors duration-500 group-hover:bg-orange-500/30" />
          </div>
          <span className="relative z-10 text-white/90 transition-colors group-hover:text-white">
            {text}
          </span>
          <ArrowRight className="relative z-10 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      );
      break;

    case "gradient-pill-button":
      content = (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "mrb-gp relative flex items-center gap-2 rounded-full bg-gradient-to-b px-6 py-3 text-sm font-medium transition-all",
            light
              ? "from-black/10 via-black/20 to-black/10 hover:bg-slate-50"
              : "from-white/[0.16] via-white/[0.07] to-white/[0.16] hover:bg-white/10",
          )}
          style={{
            boxShadow: "0 18px 35px rgba(31, 41, 55, 0.25), 0 0 0 1px rgba(209, 213, 219, 0.3)",
            color: "#e5e7eb",
          }}
        >
          <span
            className={cn(
              "text-sm font-medium tracking-tight",
              light ? "text-black/60" : "text-white/70",
            )}
          >
            {text}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={light ? "#666" : "#e5e7eb"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      );
      break;

    case "generate-button":
      // The authored button keeps its own hue knob (210deg); the shared hue grade rotates from there.
      content = (
        <div className="mrb-gen-wrap">
          <button
            type="button"
            aria-label={text}
            title={text}
            onClick={onClick}
            className="mrb-gen"
            style={{ "--gen-hue": "210deg", "--button-color": "#101010" } as CSSProperties}
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
          className="group relative isolate inline-flex cursor-pointer overflow-hidden rounded-full shadow-[0_8px_40px_rgba(129,140,248,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(129,140,248,0.35)]"
          style={{
            fontFamily:
              'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          }}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-[-200%] h-[400%] w-[400%]">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 225deg, transparent 0, rgba(255,255,255,0.6) 90deg, transparent 90deg)",
                }}
              />
            </div>
          </div>
          <div className="absolute inset-[1px] rounded-full bg-white/5 backdrop-blur" />
          <div className="relative z-10 flex items-center gap-3 overflow-hidden rounded-full px-4 py-3 text-base font-medium text-white">
            <div
              style={{
                position: "absolute",
                width: "200%",
                height: "200%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.2), rgba(255,255,255,0.2), rgba(255,255,255,0.2), transparent)",
                animation: "mrb-gm-beam 4s infinite linear",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 1,
                background: "rgba(10, 11, 20, 0.8)",
                borderRadius: 9999,
                backdropFilter: "blur(8px)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt={avatarAlt}
              className="relative z-10 h-8 w-8 rounded-full object-cover ring-2 ring-white/10"
            />
            <span className="relative z-10 whitespace-nowrap">{text}</span>
            <span className="relative z-10 ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 24, height: 16, color: "#fff" }}
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
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
        >
          <span
            className="absolute inset-[-100%] animate-spin opacity-0 transition-all duration-300 group-hover:opacity-100"
            style={{
              animationDuration: "3s",
              background:
                "conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 75%, #ffffff 100%)",
            }}
          />
          <span className="absolute inset-0 rounded-full bg-zinc-800 transition-all duration-300 group-hover:opacity-0" />
          <span className="relative flex h-full w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-300 group-hover:text-white">
            <span className="relative z-10">{text}</span>
            <ArrowRight
              size={14}
              className="relative z-10 transition-all duration-300 group-hover:translate-x-0.5"
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
          className="group relative overflow-hidden px-8 py-4 font-medium transition-all duration-300"
          style={{
            color: "#7c2d12",
            backgroundImage: "linear-gradient(to right, #FFEBB1, #FFC438)",
            boxShadow:
              "0 15px 33px -12px rgba(255,162,42,0.9), inset 0 4px 6.3px rgba(252,220,134,1), inset 0 -5px 6.3px rgba(255,162,38,1)",
            borderRadius: 9999,
          }}
        >
          <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0" />
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
      stageBackground = light ? "#f3f0fb" : "#0b0821";
      stageFont = undefined;
      stageFilter = undefined;
      content = (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "relative inline-flex h-[45px] cursor-pointer appearance-none items-center gap-[10px] whitespace-nowrap rounded-full border-0 text-[15.7px] font-semibold leading-none",
            "outline-1 outline-[rgba(255,255,255,0.1)] [outline-style:solid]",
            "[font-family:Mulish,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]",
            "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:!outline-[rgba(255,255,255,0.85)]",
            ghost
              ? cn(
                  "px-[33px] backdrop-blur-[12px]",
                  light ? "hover:!bg-[rgba(12,6,34,0.07)]" : "hover:!bg-[rgba(255,255,255,0.09)]",
                )
              : "px-[30px] text-white hover:[--mrb-lift:1.12]",
          )}
          style={
            ghost
              ? {
                  background: light ? "rgba(12, 6, 34, 0.03)" : "rgba(255, 255, 255, 0.018)",
                  outlineColor: light ? "rgba(12, 6, 34, 0.16)" : "rgba(255, 255, 255, 0.2)",
                  color: light ? "#1a1033" : "#fff",
                  filter,
                  transition: "background 0.25s ease, outline-color 0.25s ease",
                }
              : {
                  background: LUMEN_GRADIENT,
                  boxShadow:
                    "0 4px 22px rgba(70, 20, 190, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
                  filter: `${grade} brightness(calc(${level} * var(--mrb-lift, 1)))`,
                  transition: "filter 0.25s ease",
                }
          }
        >
          {text}
          <i
            aria-hidden="true"
            className="h-[7px] w-[7px] flex-none rounded-full border-[1.3px] border-solid"
            style={{
              borderColor: ghost && light ? "rgba(26, 16, 51, 0.75)" : "rgba(255, 255, 255, 0.9)",
            }}
          />
        </button>
      );
      break;
    }

    default: {
      const theme = PAGE_THEME[variant] ?? "trochil";
      stageClass = `mrb-page mrb-page--${theme}`;
      stageBackground = undefined;
      stageFont = undefined;
      switch (variant) {
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
              className={cn("mrb-pb mrb-pb--arrow-pill", `mrb-pb--${theme}`)}
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
    }
  }

  return (
    <div
      className={cn("mrb-stage", stageClass, still, className)}
      data-mode={mode}
      data-variant={variant}
      style={{
        background: background ?? stageBackground,
        fontFamily: stageFont,
        colorScheme: mode,
        filter: stageFilter,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {content}
    </div>
  );
}
