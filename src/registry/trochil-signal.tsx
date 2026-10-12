"use client";
// Ported from ThreeUI Community's Trochil Signal (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STYLES = `.modus-trochil-stage{--ink:#fff;position:relative;display:grid;width:100%;height:100%;min-height:240px;place-items:center;overflow:hidden;isolation:isolate;color:var(--ink);font-family:Inter,"Helvetica Neue",Helvetica,Arial,sans-serif}
.modus-trochil-stage::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none}
.modus-trochil-stage[data-mode="light"]{--ink:#14161a}
.modus-trochil{position:relative;display:inline-flex;align-items:center;justify-content:center;border:0;font:inherit;text-decoration:none;white-space:nowrap;cursor:pointer;-webkit-font-smoothing:antialiased}
.modus-trochil:focus-visible{outline:2px solid var(--ink);outline-offset:5px}
.modus-trochil-still .modus-trochil,.modus-trochil-still .modus-trochil::before,.modus-trochil-still .modus-trochil svg{transition-duration:.01ms!important}

.modus-trochil-stage{background:#030303}
.modus-trochil-stage::before{background:radial-gradient(circle at 71% 49%,rgba(251,215,54,.18),transparent 31%);opacity:.72}
.modus-trochil{height:52px;padding:0 30px;overflow:hidden;border:1px solid rgba(255,255,255,.27);background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(0,0,0,.36));box-shadow:0 15px 36px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.08);color:rgba(255,255,255,.82);font-size:14px;font-weight:500;transition:border-color .28s ease,color .28s ease,transform .28s ease,box-shadow .28s ease}
.modus-trochil::before{content:"";position:absolute;inset:-1px;background:linear-gradient(105deg,transparent 17%,rgba(251,215,54,.25) 48%,transparent 76%);transform:translateX(-125%);transition:transform .65s cubic-bezier(.22,.61,.36,1)}
.modus-trochil span{position:relative}
.modus-trochil:hover{border-color:rgba(251,215,54,.58);color:#fff;transform:translateY(-2px);box-shadow:0 18px 42px rgba(0,0,0,.58),0 0 24px rgba(251,215,54,.12)}
.modus-trochil:hover::before{transform:translateX(125%)}
.modus-trochil-stage[data-mode="light"]{background:#f5f3ee}
.modus-trochil-stage[data-mode="light"]::before{background:radial-gradient(circle at 71% 49%,rgba(196,142,6,.22),transparent 31%);opacity:.9}
.modus-trochil-stage[data-mode="light"] .modus-trochil{border-color:rgba(20,19,14,.22);background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(20,19,14,.05));box-shadow:0 14px 30px rgba(20,19,14,.13),inset 0 1px rgba(255,255,255,.9);color:rgba(20,19,14,.78)}
.modus-trochil-stage[data-mode="light"] .modus-trochil::before{background:linear-gradient(105deg,transparent 17%,rgba(196,142,6,.3) 48%,transparent 76%)}
.modus-trochil-stage[data-mode="light"] .modus-trochil:hover{border-color:rgba(176,126,4,.62);color:#14130e;box-shadow:0 18px 38px rgba(20,19,14,.17),0 0 22px rgba(196,142,6,.2)}
`;

export interface TrochilSignalProps {
  label?: string;
  mode?: "dark" | "light";
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function TrochilSignal({
  label = "Request access",
  mode = "dark",
  type = "button",
  onClick,
  className,
}: TrochilSignalProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div
      className={cn(
        "modus-trochil-stage",
        prefersReducedMotion && "modus-trochil-still",
        className,
      )}
      data-mode={mode}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button className="modus-trochil" type={type} onClick={onClick}>
        <span>{label}</span>
      </button>
    </div>
  );
}
