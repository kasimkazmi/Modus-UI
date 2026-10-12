"use client";
// Ported from ThreeUI Community's Glassmorphism CTA (MIT, © 2026 Meng To).

import type { MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlassmorphismCtaProps {
  label?: string;
  href?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  glowColor?: string;
  shimmerColor?: string;
  speed?: number;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}

export function GlassmorphismCta({
  label = "Generate My Site",
  href = "#",
  avatarSrc = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop",
  avatarAlt = "Advisor headshot",
  glowColor = "rgba(129,140,248,0.25)",
  shimmerColor = "rgba(255,255,255,0.6)",
  speed = 4,
  onClick,
  className,
}: GlassmorphismCtaProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "group relative isolate inline-flex cursor-pointer overflow-hidden rounded-full hover:shadow-[0_0_40px_8px_rgba(129,140,248,0.35)]",
        !prefersReducedMotion && "transition-all duration-300 hover:scale-105",
        className,
      )}
      style={{
        boxShadow: `0 8px 40px ${glowColor}`,
        fontFamily:
          'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes modus-glass-cta-beam{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}`,
        }}
      />
      <div className="absolute inset-0">
        <div className="absolute inset-[-200%] h-[400%] w-[400%]">
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 225deg, transparent 0, ${shimmerColor} 90deg, transparent 90deg)`,
            }}
          />
        </div>
      </div>
      <div className="absolute inset-[1px] rounded-full bg-white/5 backdrop-blur" />
      <div className="relative z-10 flex w-full items-center gap-3 overflow-hidden rounded-full py-3 pl-4 pr-4 text-base font-medium text-white sm:w-auto">
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "200%",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), transparent)",
            animation: prefersReducedMotion
              ? undefined
              : `modus-glass-cta-beam ${speed}s infinite linear`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
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
        <span className="relative z-10 whitespace-nowrap">{label}</span>
        <span className="relative z-10 ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
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
}
