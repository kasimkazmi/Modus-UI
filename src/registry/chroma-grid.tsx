"use client";

import { useRef, useEffect } from "react";
import {
  useMotionValue,
  useSpring,
  motion,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface ChromaGridItem {
  image: string;
  title: string;
  subtitle?: string;
  handle?: string;
  location?: string;
  borderColor?: string;
  gradient?: string;
  url?: string;
}

interface ChromaGridProps {
  items?: ChromaGridItem[];
  className?: string;
  radius?: number;
  columns?: number;
  rows?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
}

export function ChromaGrid({
  items,
  className,
  radius = 300,
  columns = 3,
  rows = 2,
  damping = 15,
}: ChromaGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { damping, stiffness: 100, mass: 0.5 });
  const smoothY = useSpring(mouseY, { damping, stiffness: 100, mass: 0.5 });

  const isHovered = useMotionValue(0);
  const smoothHover = useSpring(isHovered, { damping: 20, stiffness: 200 });

  const maskTemplate = useMotionTemplate`radial-gradient(circle ${radius}px at ${smoothX}px ${smoothY}px,transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)`;
  const fadeTemplate = useMotionTemplate`radial-gradient(circle ${radius}px at ${smoothX}px ${smoothY}px,white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)`;

  const hoverOpacity = useMotionTemplate`${smoothHover}`;

  const defaultItems: ChromaGridItem[] = [
    {
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      title: "Alex Rivera",
      subtitle: "Full Stack Developer",
      handle: "@alexrivera",
      borderColor: "hsl(var(--primary))",
      gradient: "linear-gradient(145deg,hsl(var(--primary)),hsl(var(--background)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
      title: "Jordan Chen",
      subtitle: "DevOps Engineer",
      handle: "@jordanchen",
      borderColor: "hsl(var(--secondary))",
      gradient: "linear-gradient(210deg,hsl(var(--secondary)),hsl(var(--background)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      title: "Morgan Blake",
      subtitle: "UI/UX Designer",
      handle: "@morganblake",
      borderColor: "hsl(var(--accent))",
      gradient: "linear-gradient(165deg,hsl(var(--accent)),hsl(var(--background)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      title: "Casey Park",
      subtitle: "Data Scientist",
      handle: "@caseypark",
      borderColor: "hsl(var(--destructive))",
      gradient: "linear-gradient(195deg,hsl(var(--destructive)),hsl(var(--background)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      title: "Sam Kim",
      subtitle: "Mobile Developer",
      handle: "@thesamkim",
      borderColor: "hsl(var(--muted))",
      gradient: "linear-gradient(225deg,hsl(var(--muted)),hsl(var(--background)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      title: "Tyler Rodriguez",
      subtitle: "Cloud Architect",
      handle: "@tylerrod",
      borderColor: "hsl(var(--primary))",
      gradient: "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--background)))",
    },
  ];

  const data = items?.length ? items : defaultItems;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    mouseX.set(width / 2);
    mouseY.set(height / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = (e: React.PointerEvent) => {
    if (prefersReducedMotion) return;
    if (!rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - r.left);
    mouseY.set(e.clientY - r.top);
    isHovered.set(0);
  };

  const handleLeave = () => {
    isHovered.set(1);
  };

  const handleCardClick = (url?: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCardMove = (e: React.MouseEvent<HTMLElement>) => {
    const c = e.currentTarget;
    const rect = c.getBoundingClientRect();
    c.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    c.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn("relative grid w-full gap-3", className)}
      style={
        {
          gridTemplateColumns: `repeat(${columns}, 320px)`,
          gridAutoRows: "auto",
        } as React.CSSProperties
      }
    >
      {data.map((c, i) => (
        <article
          key={i}
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c.url)}
          className="group relative flex w-[300px] cursor-pointer flex-col overflow-hidden rounded-[20px] border-2 border-transparent transition-colors duration-300"
          style={
            {
              "--card-border": c.borderColor || "transparent",
              background: c.gradient,
              "--spotlight-color": "rgba(255,255,255,0.3)",
            } as React.CSSProperties
          }
        >
          <div
            className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 70%)",
            }}
          />
          <div className="relative z-10 box-border flex-1 p-[10px]">
            <img
              src={c.image}
              alt={c.title}
              loading="lazy"
              className="h-64 w-full rounded-[10px] object-cover"
            />
          </div>
          <footer className="relative z-10 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 p-3 font-sans text-white">
            <h3 className="m-0 text-[1.05rem] font-semibold">{c.title}</h3>
            {c.handle && <span className="text-right text-[0.95rem] opacity-80">{c.handle}</span>}
            <p className="m-0 text-[0.85rem] opacity-85">{c.subtitle}</p>
            {c.location && (
              <span className="text-right text-[0.85rem] opacity-85">{c.location}</span>
            )}
          </footer>
        </article>
      ))}
      <motion.div
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          backdropFilter: "grayscale(1) brightness(0.78)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
          background: "rgba(0,0,0,0.001)",
          maskImage: maskTemplate,
          WebkitMaskImage: maskTemplate,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          backdropFilter: "grayscale(1) brightness(0.78)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
          background: "rgba(0,0,0,0.001)",
          maskImage: fadeTemplate,
          WebkitMaskImage: fadeTemplate,
          opacity: hoverOpacity,
        }}
      />
    </div>
  );
}
