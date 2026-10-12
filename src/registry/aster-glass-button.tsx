"use client";
// Ported from ThreeUI Community's Aster Glass (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AsterGlassButtonProps {
  /** Text-only glass button, or glass button with an arrow chip. */
  variant?: "access" | "arrow";
  /** Button text. Defaults to "Get access" (access) or "Start free" (arrow). */
  label?: string;
  /** Ground the glass is toned for. */
  mode?: "dark" | "light";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const STYLES = `
.m-aster-glass {
  --m-ink: #fff;
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 240px;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  background: #101010;
  color: var(--m-ink);
  font-family: "Roboto Flex", "Arial Narrow", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.m-aster-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 64% 42%, rgba(255, 255, 255, .07), transparent 21%),
    radial-gradient(circle at 38% 62%, rgba(255, 255, 255, .035), transparent 27%);
}
.m-aster-glass .m-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  font: inherit;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  -webkit-font-smoothing: antialiased;
  height: 52px;
  border-radius: 12px;
  isolation: isolate;
  background: rgba(255, 255, 255, .055);
  color: #f1f1f1;
  font-size: 17px;
  font-variation-settings: "wdth" 100, "opsz" 14;
  letter-spacing: -.004em;
  box-shadow: 0 12px 34px -22px rgba(255, 255, 255, .35);
  backdrop-filter: blur(16px) saturate(1.25);
  -webkit-backdrop-filter: blur(16px) saturate(1.25);
  transition: transform .5s cubic-bezier(.22, 1, .36, 1), background .4s ease, color .4s ease, box-shadow .5s cubic-bezier(.22, 1, .36, 1);
}
.m-aster-glass .m-btn:focus-visible { outline: 2px solid var(--m-ink); outline-offset: 5px; }
.m-aster-glass .m-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(148deg, rgba(255, 255, 255, .72), rgba(255, 255, 255, .16) 34%, rgba(255, 255, 255, .05) 58%, rgba(255, 255, 255, .34));
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
  transition: filter .45s cubic-bezier(.22, 1, .36, 1);
}
.m-aster-glass .m-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, .13), transparent 46%);
  pointer-events: none;
}
.m-aster-glass .m-btn > span { position: relative; z-index: 1; }
.m-aster-glass .m-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, .15);
  color: #fff;
  box-shadow: 0 8px 26px -12px rgba(255, 255, 255, .42);
}
.m-aster-glass .m-btn:hover::before { filter: brightness(1.55); }
.m-aster-glass .m-btn:active { transform: translateY(0); }
.m-aster-glass .m-access { padding: 0 31px; }
.m-aster-glass .m-arrow { gap: 17px; padding: 0 7px 0 22px; }
.m-aster-glass .m-chip {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 9px;
  background: rgba(255, 255, 255, .10);
}
.m-aster-glass .m-chip::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(150deg, rgba(255, 255, 255, .75), rgba(255, 255, 255, .10) 62%, rgba(255, 255, 255, .42));
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
}
.m-aster-glass .m-arrow svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform .5s cubic-bezier(.22, 1, .36, 1);
}
.m-aster-glass .m-arrow:hover svg { transform: translateX(2px); }

.m-aster-glass[data-mode="light"] { background: #eceae7; --m-ink: #101010; }
.m-aster-glass[data-mode="light"]::before {
  background:
    radial-gradient(circle at 64% 42%, rgba(16, 16, 16, .06), transparent 21%),
    radial-gradient(circle at 38% 62%, rgba(16, 16, 16, .035), transparent 27%);
}
.m-aster-glass[data-mode="light"] .m-btn { background: rgba(16, 16, 16, .05); box-shadow: 0 14px 34px -22px rgba(16, 16, 16, .55); color: #16181a; }
.m-aster-glass[data-mode="light"] .m-btn::before { background: linear-gradient(148deg, rgba(16, 16, 16, .45), rgba(16, 16, 16, .12) 34%, rgba(16, 16, 16, .05) 58%, rgba(16, 16, 16, .26)); }
.m-aster-glass[data-mode="light"] .m-btn::after { background: linear-gradient(180deg, rgba(255, 255, 255, .8), transparent 46%); }
.m-aster-glass[data-mode="light"] .m-btn:hover { background: rgba(16, 16, 16, .1); box-shadow: 0 8px 26px -12px rgba(16, 16, 16, .3); color: #000; }
.m-aster-glass[data-mode="light"] .m-btn:hover::before { filter: brightness(.68); }
.m-aster-glass[data-mode="light"] .m-chip { background: rgba(16, 16, 16, .07); }
.m-aster-glass[data-mode="light"] .m-chip::before { background: linear-gradient(150deg, rgba(16, 16, 16, .5), rgba(16, 16, 16, .1) 62%, rgba(16, 16, 16, .3)); }
.m-aster-glass[data-reduced] .m-btn, .m-aster-glass[data-reduced] .m-btn::before, .m-aster-glass[data-reduced] .m-btn svg { transition-duration: .01ms !important; }
`;

export function AsterGlassButton({
  variant = "access",
  label,
  mode = "dark",
  onClick,
  className,
}: AsterGlassButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const arrow = variant === "arrow";
  return (
    <div
      className={cn("m-aster-glass", className)}
      data-mode={mode}
      data-reduced={prefersReducedMotion ? "" : undefined}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {arrow ? (
        <button className="m-btn m-arrow" type="button" onClick={onClick}>
          <span>{label ?? "Start free"}</span>
          <span className="m-chip">
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 6h8M6.6 2.6 10 6 6.6 9.4" />
            </svg>
          </span>
        </button>
      ) : (
        <button className="m-btn m-access" type="button" onClick={onClick}>
          <span>{label ?? "Get access"}</span>
        </button>
      )}
    </div>
  );
}
