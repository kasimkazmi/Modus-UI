"use client";
// Ported from ThreeUI Community's Dark Pill (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InkCapsuleProps {
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

// An ink-filled capsule with a slow comet of light orbiting inside it.
const STYLES = `
.m-ink-capsule {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 12px;
  height: 60px; padding: 0 34px; overflow: hidden; border: 0; border-radius: 999px; cursor: pointer;
  color: hsl(var(--primary-foreground)); background: hsl(var(--primary)); isolation: isolate;
  box-shadow: 0 0 0 4px hsl(var(--primary) / .08), 0 18px 36px -18px hsl(var(--primary) / .8),
    inset 0 1px 0 hsl(var(--primary-foreground) / .2);
  transition: transform .3s ease, box-shadow .3s ease;
}
.m-ink-capsule::after {
  content: ""; position: absolute; inset: 0; z-index: 2; border-radius: inherit; pointer-events: none;
  border: 1px solid hsl(var(--primary-foreground) / .35);
  -webkit-mask-image: linear-gradient(170deg, black, transparent 55%); mask-image: linear-gradient(170deg, black, transparent 55%);
}
.m-ink-capsule-label { position: relative; z-index: 3; }
.m-ink-capsule-dot { position: relative; z-index: 3; width: 6px; height: 6px; border-radius: 999px; background: currentColor; opacity: .7; }
.m-ink-capsule-comet { position: absolute; z-index: 1; top: calc(50% - 90px); left: calc(50% - 90px); width: 180px; height: 180px; pointer-events: none; }
.m-ink-capsule-comet::before, .m-ink-capsule-comet::after { content: ""; position: absolute; inset: 0; border-radius: 50%; }
.m-ink-capsule-comet::before {
  background: conic-gradient(from 180deg, transparent 200deg, hsl(var(--primary-foreground) / .28) 360deg);
  filter: blur(14px); animation: m-ink-capsule-orbit 4.2s linear infinite; transition: opacity .5s;
}
.m-ink-capsule-comet::after {
  inset: 40px; background: hsl(var(--primary-foreground) / .22); opacity: 0; filter: blur(8px);
  transform: scale(.5); transition: opacity .5s, transform .7s;
}
.m-ink-capsule:hover { transform: translateY(-1px); box-shadow: 0 0 0 8px hsl(var(--primary) / .08), 0 22px 40px -18px hsl(var(--primary) / .9), inset 0 1px 0 hsl(var(--primary-foreground) / .2); }
.m-ink-capsule:hover .m-ink-capsule-comet::before { opacity: 0; }
.m-ink-capsule:hover .m-ink-capsule-comet::after { opacity: 1; transform: scale(1); }
.m-ink-capsule:active { transform: scale(.98); }
.m-ink-capsule:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 5px; }
@keyframes m-ink-capsule-orbit {
  0% { transform: translate(0) rotate(0); }
  25% { transform: translateX(-36px) rotate(90deg); }
  50% { transform: translate(0) rotate(180deg); }
  75% { transform: translateX(36px) rotate(270deg); }
  100% { transform: translate(0) rotate(360deg); }
}
.m-ink-capsule[data-reduced], .m-ink-capsule[data-reduced] * , .m-ink-capsule[data-reduced] *::before, .m-ink-capsule[data-reduced] *::after { animation: none !important; transition: none !important; }
.m-ink-capsule[data-reduced]:active { transform: none; }
`;

export function InkCapsule({ label = "Join the list", onClick, className }: InkCapsuleProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        className={cn("m-ink-capsule font-serif text-xl", className)}
        type="button"
        data-reduced={prefersReducedMotion ? "" : undefined}
        onClick={onClick}
      >
        <span className="m-ink-capsule-dot" aria-hidden="true" />
        <span className="m-ink-capsule-label">{label}</span>
        <span className="m-ink-capsule-comet" aria-hidden="true" />
      </button>
    </>
  );
}
