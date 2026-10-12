"use client";
// Ported from ThreeUI Community's Circle Buttons (MIT, © 2026 Meng To).

import type { CSSProperties, MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CircleButtonProps {
  /** Dark glass play, amber launch plus, or dot-border mail. */
  variant?: "play" | "plus" | "mail";
  /** Ground the button is toned for. */
  mode?: "dark" | "light";
  /** Hue rotation in degrees (-180 to 180). */
  hue?: number;
  /** Saturation multiplier (0 to 2). */
  saturation?: number;
  /** Brightness multiplier (0.35 to 1.65). */
  brightness?: number;
  /** Accessible label. Defaults to "Play", "Add" or "Send mail". */
  ariaLabel?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const LABELS = { play: "Play", plus: "Add", mail: "Send mail" } as const;

const STYLES = `
.m-circle-buttons,
.m-circle-buttons *,
.m-circle-buttons *::before,
.m-circle-buttons *::after {
  box-sizing: border-box;
}

.m-circle-buttons {
  --m-cb-hue: 0deg;
  --m-cb-saturation: 1;
  --m-cb-brightness: 1;
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  container-type: size;
  background: #111318;
  color-scheme: dark;
  filter: hue-rotate(var(--m-cb-hue)) saturate(var(--m-cb-saturation)) brightness(var(--m-cb-brightness));
}

.m-circle-buttons--play {
  background: #0a0a0a;
}

.m-circle-buttons--light {
  background: #f4f7fb;
  color-scheme: light;
}

.m-circle-buttons__atmosphere {
  position: absolute;
  width: min(62cqw, 440px);
  height: min(50cqh, 240px);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
  filter: blur(54px);
  pointer-events: none;
}

.m-circle-button {
  position: relative;
  display: grid;
  width: clamp(56px, 8cqw, 72px);
  aspect-ratio: 1;
  padding: 0;
  place-items: center;
  overflow: visible;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transform: translateZ(0);
  transition: transform 200ms ease-in-out, filter 200ms ease-in-out;
  -webkit-tap-highlight-color: transparent;
}

.m-circle-button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.7);
  opacity: 0.48;
}

.m-circle-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.88);
  outline-offset: 7px;
}

.m-circle-buttons--light .m-circle-button:focus-visible {
  outline-color: rgba(17, 24, 39, 0.8);
}

.m-circle-button__aura,
.m-circle-button__rim,
.m-circle-button__face,
.m-circle-button__details,
.m-circle-button__icon {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.m-circle-button__face {
  z-index: 1;
}

.m-circle-button__rim {
  z-index: 2;
}

.m-circle-button__details {
  z-index: 4;
}

.m-circle-button__icon {
  z-index: 5;
  display: grid;
  place-items: center;
}

.m-circle-button__icon svg {
  width: 30%;
  height: 30%;
  overflow: visible;
}

/* Play is the Dark Glass rectangle reduced to a circular boundary. */
.m-circle-buttons--play .m-circle-button {
  overflow: hidden;
}

.m-circle-buttons--play .m-circle-button__face {
  background: rgba(23, 23, 23, 0.7);
  box-shadow: inset 2px 4px 16px rgba(255, 255, 255, 0.06);
  -webkit-backdrop-filter: blur(50px);
  backdrop-filter: blur(50px);
}

.m-circle-buttons--play .m-circle-button__rim {
  border: 1px solid rgba(255, 255, 255, 0.25);
  opacity: 0.25;
  -webkit-mask-image: linear-gradient(170deg, #000, transparent 50%);
  mask-image: linear-gradient(170deg, #000, transparent 50%);
}

.m-circle-buttons--play .m-circle-button__aura {
  z-index: 3;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  background: conic-gradient(from 180deg, rgba(255, 255, 255, 0.012) 180deg, rgba(255, 255, 255, 0.05) 360deg);
  filter: blur(15px);
  transform: translate(-50%, -50%);
  animation: m-circle-button-orbit 3.6s linear infinite;
  transition: opacity 500ms;
}

.m-circle-buttons--play .m-circle-button__face::after {
  position: absolute;
  inset: -38%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  content: "";
  opacity: 0;
  filter: blur(5px);
  transform: scale(0.5);
  transition: opacity 500ms, transform 700ms;
  -webkit-mask-image: radial-gradient(50% 50%, #000, rgba(23, 23, 23, 0));
  mask-image: radial-gradient(50% 50%, #000, rgba(23, 23, 23, 0));
}

.m-circle-buttons--play .m-circle-button__icon svg {
  margin-left: 4%;
  fill: currentColor;
}

.m-circle-buttons--play .m-circle-button:not(:disabled):hover .m-circle-button__aura {
  opacity: 0;
}

.m-circle-buttons--play .m-circle-button:not(:disabled):hover .m-circle-button__face::after {
  opacity: 1;
  transform: scale(1);
}

.m-circle-buttons--play .m-circle-button:not(:disabled):active {
  transform: scale(0.98);
}

.m-circle-buttons--light.m-circle-buttons--play .m-circle-button {
  color: rgba(17, 24, 39, 0.7);
}

.m-circle-buttons--light.m-circle-buttons--play .m-circle-button__face {
  background: rgba(232, 234, 238, 0.78);
  box-shadow: inset 2px 4px 16px rgba(255, 255, 255, 0.72);
}

.m-circle-buttons--light.m-circle-buttons--play .m-circle-button__rim {
  border-color: rgba(17, 24, 39, 0.28);
}

/* Plus carries the Launch rectangle's exact amber gradient, rim, depth, and press. */
.m-circle-buttons--plus .m-circle-buttons__atmosphere {
  display: none;
}

.m-circle-buttons--plus .m-circle-button {
  color: #451a03;
}

.m-circle-buttons--plus .m-circle-button__aura {
  inset: -4px;
  border-radius: inherit;
  background: rgba(245, 158, 11, 0.4);
  opacity: 0.4;
  filter: blur(8px);
  transition: opacity 500ms;
}

.m-circle-buttons--plus .m-circle-button__face {
  background: linear-gradient(to bottom, #fde68a, #fcd34d, #f59e0b);
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.5),
    0 4px 0 #b45309,
    0 10px 15px -3px rgba(0, 0, 0, 0.5);
  transition: transform 150ms, box-shadow 150ms;
}

.m-circle-buttons--plus .m-circle-button__icon svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.5;
}

.m-circle-buttons--plus .m-circle-button:not(:disabled):hover .m-circle-button__aura {
  opacity: 0.75;
}

.m-circle-buttons--plus .m-circle-button:not(:disabled):active {
  transform: translateY(2px);
}

.m-circle-buttons--plus .m-circle-button:not(:disabled):active .m-circle-button__face {
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.5),
    0 2px 0 #b45309;
}

/* Mail keeps the Dot Border rectangle's transparent face and staged technical frame. */
.m-circle-buttons--mail .m-circle-buttons__atmosphere {
  display: none;
}

.m-circle-buttons--mail .m-circle-button {
  color: rgba(255, 255, 255, 0.27);
}

.m-circle-buttons--mail .m-circle-button__face {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  transition: background-color 200ms ease-in-out;
}

.m-circle-buttons--mail .m-circle-button__details {
  inset: -10px;
  border-radius: 0;
}

.m-circle-buttons--mail .m-circle-button__details i {
  position: absolute;
  width: 8px;
  aspect-ratio: 1;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.67);
  opacity: 0;
  transition: opacity 300ms ease-in-out, transform 350ms ease-in-out;
}

.m-circle-buttons--mail .m-circle-button__details i:nth-of-type(1) {
  top: -4px;
  left: -4px;
  transform: translate(34px, 34px);
}

.m-circle-buttons--mail .m-circle-button__details i:nth-of-type(2) {
  top: -4px;
  right: -4px;
  transform: translate(-34px, 34px);
  transition-delay: 210ms;
}

.m-circle-buttons--mail .m-circle-button__details i:nth-of-type(3) {
  right: -4px;
  bottom: -4px;
  transform: translate(-34px, -34px);
  transition-delay: 420ms;
}

.m-circle-buttons--mail .m-circle-button__details i:nth-of-type(4) {
  bottom: -4px;
  left: -4px;
  transform: translate(34px, -34px);
  transition-delay: 630ms;
}

.m-circle-buttons--mail .m-circle-button__details b {
  position: absolute;
  display: block;
  opacity: 0;
}

.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(1),
.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(3) {
  right: 0;
  left: 0;
  height: 1px;
  background-image: repeating-linear-gradient(90deg, transparent 0 2px, rgba(255, 255, 255, 0.67) 2px 4px);
  transform: scaleX(0);
}

.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(1) {
  top: 0;
  transform-origin: top left;
  transition: transform 350ms ease-in-out 280ms, opacity 20ms linear 280ms;
}

.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(3) {
  bottom: 0;
  transform-origin: bottom right;
  transition: transform 350ms ease-in-out 700ms, opacity 20ms linear 700ms;
}

.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(2),
.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(4) {
  top: 0;
  bottom: 0;
  width: 1px;
  background-image: repeating-linear-gradient(0deg, transparent 0 2px, rgba(255, 255, 255, 0.67) 2px 4px);
  transform: scaleY(0);
}

.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(2) {
  right: 0;
  transform-origin: top right;
  transition: transform 350ms ease-in-out 490ms, opacity 20ms linear 490ms;
}

.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(4) {
  left: 0;
  transform-origin: bottom left;
  transition: transform 350ms ease-in-out 840ms, opacity 20ms linear 840ms;
}

.m-circle-buttons--mail .m-circle-button__icon svg {
  fill: rgba(255, 255, 255, 0.13);
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.45;
  transition: fill 200ms ease-in-out, stroke 200ms ease-in-out;
}

.m-circle-buttons--mail .m-circle-button:not(:disabled):hover {
  color: rgba(255, 255, 255, 0.67);
  transform: scale(1.05);
}

.m-circle-buttons--mail .m-circle-button:not(:disabled):hover .m-circle-button__face,
.m-circle-buttons--mail .m-circle-button:not(:disabled):active .m-circle-button__face {
  background: #25358b;
}

.m-circle-buttons--mail .m-circle-button:not(:disabled):hover .m-circle-button__details i,
.m-circle-buttons--mail .m-circle-button:not(:disabled):hover .m-circle-button__details b {
  opacity: 1;
  transform: none;
}

.m-circle-buttons--mail .m-circle-button:not(:disabled):active {
  transform: scale(0.98);
}

.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button {
  color: rgba(17, 24, 39, 0.38);
}

.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button__face {
  border-color: rgba(17, 24, 39, 0.2);
}

.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button__details i {
  background: rgba(17, 24, 39, 0.58);
}

.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(1),
.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(3) {
  background-image: repeating-linear-gradient(90deg, transparent 0 2px, rgba(17, 24, 39, 0.58) 2px 4px);
}

.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(2),
.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button__details b:nth-of-type(4) {
  background-image: repeating-linear-gradient(0deg, transparent 0 2px, rgba(17, 24, 39, 0.58) 2px 4px);
}

.m-circle-buttons--light.m-circle-buttons--mail .m-circle-button:not(:disabled):hover {
  color: rgba(255, 255, 255, 0.67);
}

@keyframes m-circle-button-orbit {
  0% { transform: translate(-50%, -50%) translateX(0) rotate(0); }
  25% { transform: translate(-50%, -50%) translateX(-30px) rotate(90deg); }
  50% { transform: translate(-50%, -50%) translateX(0) rotate(180deg); }
  75% { transform: translate(-50%, -50%) translateX(30px) rotate(270deg); }
  100% { transform: translate(-50%, -50%) translateX(0) rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .m-circle-buttons *,
  .m-circle-buttons *::before,
  .m-circle-buttons *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
.m-circle-buttons[data-reduced] *,
.m-circle-buttons[data-reduced] *::before,
.m-circle-buttons[data-reduced] *::after {
  animation-duration: 1ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 1ms !important;
}
`;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function CircleIcon({ variant }: { variant: "play" | "plus" | "mail" }) {
  if (variant === "play") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M11.75 8.7c0-1.28 1.4-2.08 2.5-1.43l12 7.3a1.66 1.66 0 0 1 0 2.86l-12 7.3a1.66 1.66 0 0 1-2.5-1.43V8.7Z" />
      </svg>
    );
  }
  if (variant === "plus") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 7v18M7 16h18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="5.25" y="7.5" width="21.5" height="17" rx="3.25" />
      <path d="m7.25 10 7.35 5.72a2.26 2.26 0 0 0 2.8 0L24.75 10" />
    </svg>
  );
}

export function CircleButton({
  variant = "play",
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  ariaLabel,
  disabled = false,
  type = "button",
  onClick,
  className,
}: CircleButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeVariant = variant === "plus" || variant === "mail" ? variant : "play";
  const safeMode = mode === "light" ? "light" : "dark";
  const stageStyle = {
    "--m-cb-hue": `${clamp(hue, -180, 180)}deg`,
    "--m-cb-saturation": clamp(saturation, 0, 2),
    "--m-cb-brightness": clamp(brightness, 0.35, 1.65),
  } as CSSProperties;

  return (
    <div
      className={cn(
        "m-circle-buttons",
        `m-circle-buttons--${safeVariant}`,
        `m-circle-buttons--${safeMode}`,
        className,
      )}
      data-reduced={prefersReducedMotion ? "" : undefined}
      style={stageStyle}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="m-circle-buttons__atmosphere" aria-hidden="true" />
      <button
        className="m-circle-button"
        type={type}
        aria-label={ariaLabel ?? LABELS[safeVariant]}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="m-circle-button__aura" aria-hidden="true" />
        <span className="m-circle-button__rim" aria-hidden="true" />
        <span className="m-circle-button__face" aria-hidden="true" />
        <span className="m-circle-button__details" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <b />
          <b />
          <b />
          <b />
        </span>
        <span className="m-circle-button__icon">
          <CircleIcon variant={safeVariant} />
        </span>
      </button>
    </div>
  );
}
