"use client";
// Ported from ThreeUI Community's Dark Pill (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DarkPillProps {
  mode?: "light" | "dark";
  label?: string;
  background?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

// The authored section-elements.css rules for the glass button, scoped to this component.
const STYLES = `
.mdp-stage, .mdp-stage *, .mdp-stage *::before, .mdp-stage *::after { box-sizing: border-box; }
.mdp-stage {
  position: relative; display: grid; place-items: center; width: 100%; height: 100%;
  min-width: 0; min-height: 0; overflow: hidden; color: rgba(255,255,255,0.95);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased; container-type: size; isolation: isolate;
}
.mdp-stage::before {
  position: absolute; top: 50%; left: 50%; width: min(62cqw, 440px); height: min(50cqh, 240px);
  border-radius: 50%; background: rgba(255,255,255,0.02); filter: blur(54px);
  transform: translate(-50%, -50%); content: "";
}
.mdp-button {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: clamp(144px, 23cqw, 288px); height: clamp(52px, 8.3cqw, 104px); padding: 0 32px;
  overflow: hidden; border: 0; border-radius: 999px; color: rgba(255,255,255,0.7);
  background: transparent; font: inherit; font-size: clamp(14px, 2.25cqw, 28px);
  font-weight: 400; line-height: normal; cursor: pointer;
}
.mdp-button::before, .mdp-button::after { position: absolute; inset: 0; border-radius: inherit; content: ""; }
.mdp-button::before {
  background: rgba(23,23,23,0.7); box-shadow: inset 2px 4px 16px rgba(255,255,255,0.06);
  -webkit-backdrop-filter: blur(50px); backdrop-filter: blur(50px);
}
.mdp-button::after {
  z-index: 2; border: 1px solid rgba(255,255,255,0.25); opacity: 0.25; pointer-events: none;
  -webkit-mask-image: linear-gradient(170deg, #000, transparent 50%);
  mask-image: linear-gradient(170deg, #000, transparent 50%);
}
.mdp-title { position: relative; z-index: 4; }
.mdp-circle { position: absolute; z-index: 3; top: calc(50% - 100px); left: calc(50% - 100px); width: 200px; height: 200px; }
.mdp-circle::before, .mdp-circle::after { position: absolute; inset: 0; border-radius: 50%; content: ""; }
.mdp-circle::before {
  background: conic-gradient(from 180deg, rgba(255,255,255,0.012) 180deg, rgba(255,255,255,0.05) 360deg);
  filter: blur(15px); animation: mdp-circle 3.6s linear infinite; transition: opacity 0.5s;
}
.mdp-circle::after {
  inset: 30px; background: rgba(255,255,255,0.12); opacity: 0; filter: blur(5px);
  transform: scale(0.5); transition: opacity 0.5s, transform 0.7s;
  -webkit-mask-image: radial-gradient(50% 50%, #000, rgba(23,23,23,0));
  mask-image: radial-gradient(50% 50%, #000, rgba(23,23,23,0));
}
.mdp-button:hover .mdp-circle::before { opacity: 0; }
.mdp-button:hover .mdp-circle::after { opacity: 1; transform: scale(1); }
.mdp-button:active { transform: scale(0.98); }
@keyframes mdp-circle {
  0% { transform: translate(0) rotate(0); }
  25% { transform: translateX(-30px) rotate(90deg); }
  50% { transform: translate(0) rotate(180deg); }
  75% { transform: translateX(30px) rotate(270deg); }
  100% { transform: translate(0) rotate(360deg); }
}
.mdp-stage[data-mode="light"] { color: rgba(17,17,17,0.95); }
.mdp-stage[data-mode="light"]::before { background: rgba(17,17,17,0.06); }
.mdp-stage[data-mode="light"] .mdp-button { color: rgba(17,17,17,0.72); }
.mdp-stage[data-mode="light"] .mdp-button::before {
  background: rgba(255,255,255,0.72);
  box-shadow: inset 2px 4px 16px rgba(17,17,17,0.05), 0 10px 26px -12px rgba(17,17,17,0.4);
}
.mdp-stage[data-mode="light"] .mdp-button::after { border-color: rgba(17,17,17,0.34); opacity: 0.45; }
.mdp-stage[data-mode="light"] .mdp-circle::before {
  background: conic-gradient(from 180deg, rgba(17,17,17,0.012) 180deg, rgba(17,17,17,0.07) 360deg);
}
.mdp-stage[data-mode="light"] .mdp-circle::after { background: rgba(17,17,17,0.12); }
.mdp-stage[data-reduced] .mdp-circle::before, .mdp-stage[data-reduced] .mdp-circle::after { animation: none; transition: none; }
.mdp-stage[data-reduced] .mdp-button:active { transform: none; }
`;

export function DarkPill({
  mode = "dark",
  label = "Sign up",
  background,
  onClick,
  className,
}: DarkPillProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn("mdp-stage", className)}
      data-mode={mode}
      data-reduced={prefersReducedMotion ? "" : undefined}
      style={{
        background: background ?? (mode === "light" ? "#eeedeb" : "#0a0a0a"),
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button className="mdp-button" type="button" onClick={onClick}>
        <span className="mdp-title">{label}</span>
        <span className="mdp-circle" aria-hidden="true" />
      </button>
    </div>
  );
}
