"use client";
// Ported from ThreeUI Community's Attune Thermal (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STYLES = `.modus-attune-stage{--ink:#fff;position:relative;display:grid;width:100%;height:100%;min-height:240px;place-items:center;overflow:hidden;isolation:isolate;color:var(--ink);font-family:Inter,"Helvetica Neue",Helvetica,Arial,sans-serif}
.modus-attune-stage::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none}
.modus-attune-stage[data-mode="light"]{--ink:#14161a}
.modus-attune{position:relative;display:inline-flex;align-items:center;justify-content:center;border:0;font:inherit;text-decoration:none;white-space:nowrap;cursor:pointer;-webkit-font-smoothing:antialiased}
.modus-attune:focus-visible{outline:2px solid var(--ink);outline-offset:5px}
.modus-attune-still .modus-attune,.modus-attune-still .modus-attune::before,.modus-attune-still .modus-attune svg{transition-duration:.01ms!important}

.modus-attune-stage{background:#070709}
.modus-attune-stage::before{background:radial-gradient(circle at 50% 50%,rgba(255,122,20,.12),transparent 32%)}
.modus-attune{gap:10px;height:52px;padding:0 22px;border-radius:11px;background:linear-gradient(180deg,#ffa347 0%,#ff7a14 48%,#f2610a 100%);box-shadow:inset 0 1px rgba(255,255,255,.26),0 8px 28px rgba(255,122,20,.28);color:#1a0e04;font-size:14px;font-weight:650;letter-spacing:.012em;transition:filter .18s ease,transform .18s ease,box-shadow .18s ease}
.modus-attune svg{width:8px;height:12px;fill:none;stroke:currentColor;stroke-width:1.7}
.modus-attune:hover{filter:brightness(1.09);transform:translateY(-2px);box-shadow:inset 0 1px rgba(255,255,255,.34),0 12px 34px rgba(255,122,20,.36)}
.modus-attune:active{transform:translateY(1px)}
.modus-attune-stage[data-mode="light"]{background:#faf4ee}
.modus-attune-stage[data-mode="light"]::before{background:radial-gradient(circle at 50% 50%,rgba(255,122,20,.18),transparent 32%)}
.modus-attune-stage[data-mode="light"] .modus-attune{box-shadow:inset 0 1px rgba(255,255,255,.5),0 8px 24px rgba(226,92,6,.28)}
.modus-attune-stage[data-mode="light"] .modus-attune:hover{box-shadow:inset 0 1px rgba(255,255,255,.58),0 12px 30px rgba(226,92,6,.34)}
`;

export interface AttuneThermalProps {
  label?: string;
  mode?: "dark" | "light";
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function AttuneThermal({
  label = "Start free",
  mode = "dark",
  type = "button",
  onClick,
  className,
}: AttuneThermalProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div
      className={cn("modus-attune-stage", prefersReducedMotion && "modus-attune-still", className)}
      data-mode={mode}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button className="modus-attune" type={type} onClick={onClick}>
        <span>{label}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 1.5 8 6 3 10.5" />
        </svg>
      </button>
    </div>
  );
}
