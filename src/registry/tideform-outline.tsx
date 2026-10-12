"use client";
// Ported from ThreeUI Community's Tideform Outline (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STYLES = `.modus-tideform-stage{--ink:#fff;position:relative;display:grid;width:100%;height:100%;min-height:240px;place-items:center;overflow:hidden;isolation:isolate;color:var(--ink);font-family:Inter,"Helvetica Neue",Helvetica,Arial,sans-serif}
.modus-tideform-stage::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none}
.modus-tideform-stage[data-mode="light"]{--ink:#14161a}
.modus-tideform{position:relative;display:inline-flex;align-items:center;justify-content:center;border:0;font:inherit;text-decoration:none;white-space:nowrap;cursor:pointer;-webkit-font-smoothing:antialiased}
.modus-tideform:focus-visible{outline:2px solid var(--ink);outline-offset:5px}
.modus-tideform-still .modus-tideform,.modus-tideform-still .modus-tideform::before,.modus-tideform-still .modus-tideform svg{transition-duration:.01ms!important}

.modus-tideform-stage{background:#16181a;font-family:"Roboto Mono","SFMono-Regular",Consolas,monospace}
.modus-tideform-stage::before{background:radial-gradient(ellipse at 76% 44%,rgba(255,122,24,.12),transparent 34%)}
.modus-tideform{gap:18px;padding:17px 24px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.055);box-shadow:inset 0 1px rgba(255,255,255,.035);color:#fff;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;transition:border-color .25s ease,background-color .25s ease,color .25s ease}
.modus-tideform svg{width:21px;height:9px;fill:none;stroke:currentColor;stroke-width:1.25;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.modus-tideform:hover{border-color:#ff7a18;color:#ff7a18;background:rgba(255,122,24,.14)}
.modus-tideform:hover svg{transform:translateX(4px)}
.modus-tideform-stage[data-mode="light"]{background:#eeece7;--ink:#16181a}
.modus-tideform-stage[data-mode="light"]::before{background:radial-gradient(ellipse at 76% 44%,rgba(214,96,12,.16),transparent 34%)}
.modus-tideform-stage[data-mode="light"] .modus-tideform{border-color:rgba(22,24,26,.26);background:rgba(22,24,26,.035);box-shadow:inset 0 1px rgba(255,255,255,.7);color:#16181a}
.modus-tideform-stage[data-mode="light"] .modus-tideform:hover{border-color:#c25a0c;background:rgba(194,90,12,.1);color:#b4530b}
`;

export interface TideformOutlineProps {
  label?: string;
  mode?: "dark" | "light";
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function TideformOutline({
  label = "See the work",
  mode = "dark",
  type = "button",
  onClick,
  className,
}: TideformOutlineProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div
      className={cn(
        "modus-tideform-stage",
        prefersReducedMotion && "modus-tideform-still",
        className,
      )}
      data-mode={mode}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button className="modus-tideform" type={type} onClick={onClick}>
        <span>{label}</span>
        <svg viewBox="0 0 21 9" aria-hidden="true">
          <path d="M0 4.5h18M14.5 1.2 18.3 4.5l-3.8 3.3" />
        </svg>
      </button>
    </div>
  );
}
