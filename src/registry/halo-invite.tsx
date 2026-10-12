"use client";
// Ported from ThreeUI Community's Glassmorphism CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HaloInviteProps {
  label?: string;
  href?: string;
  /** Portrait shown in the leading badge; a serif monogram is drawn when omitted. */
  avatarSrc?: string;
  avatarAlt?: string;
  /** Letter for the monogram badge when there is no portrait. */
  monogram?: string;
  /** Seconds per revolution of the halo. */
  speed?: number;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}

const KEYFRAMES = `@keyframes m-halo-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}`;

export function HaloInvite({
  label = "Book a studio call",
  href = "#",
  avatarSrc,
  avatarAlt = "",
  monogram = "M",
  speed = 5,
  onClick,
  className,
}: HaloInviteProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "group relative isolate inline-flex overflow-hidden rounded-full p-px shadow-[0_14px_40px_-16px_hsl(var(--primary)/0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        !prefersReducedMotion && "transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <span aria-hidden className="absolute inset-0 bg-border" />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square w-[160%]"
        style={{
          transform: "translate(-50%,-50%)",
          background:
            "conic-gradient(from 0deg, transparent 0 62%, hsl(var(--primary) / 0.15) 72%, hsl(var(--primary)) 86%, transparent 90%)",
          animation: prefersReducedMotion ? undefined : `m-halo-spin ${speed}s linear infinite`,
        }}
      />
      <span className="relative z-10 flex items-center gap-3 rounded-full bg-card/95 py-2 pl-2 pr-2 text-card-foreground backdrop-blur">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt={avatarAlt}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-primary font-serif text-lg italic text-primary-foreground"
          >
            {monogram}
          </span>
        )}
        <span className="whitespace-nowrap font-serif text-lg">{label}</span>
        <span className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-border bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      </span>
    </a>
  );
}
