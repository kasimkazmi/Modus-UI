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

interface PortraitWallItem {
  image: string;
  title: string;
  subtitle?: string;
  handle?: string;
  location?: string;
  borderColor?: string;
  gradient?: string;
  url?: string;
}

interface PortraitWallProps {
  items?: PortraitWallItem[];
  className?: string;
  radius?: number;
  columns?: number;
  rows?: number;
  damping?: number;
}

export function PortraitWall({
  items,
  className,
  radius = 300,
  columns = 3,
  rows = 2,
  damping = 15,
}: PortraitWallProps) {
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

  const defaultItems: PortraitWallItem[] = [
    {
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      title: "Ines Okafor",
      subtitle: "Type Designer",
      handle: "@alexrivera",
      borderColor: "hsl(var(--primary))",
      gradient:
        "linear-gradient(145deg,color-mix(in oklab,hsl(var(--primary)) 28%,hsl(var(--card))),hsl(var(--card)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
      title: "Theo Marchetti",
      subtitle: "Bookbinder",
      handle: "@jordanchen",
      borderColor: "hsl(var(--secondary))",
      gradient:
        "linear-gradient(210deg,color-mix(in oklab,hsl(var(--secondary)) 28%,hsl(var(--card))),hsl(var(--card)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      title: "Hana Sato",
      subtitle: "Letterpress Printer",
      handle: "@morganblake",
      borderColor: "hsl(var(--accent))",
      gradient:
        "linear-gradient(165deg,color-mix(in oklab,hsl(var(--accent)) 28%,hsl(var(--card))),hsl(var(--card)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      title: "Rafael Duarte",
      subtitle: "Archivist",
      handle: "@caseypark",
      borderColor: "hsl(var(--destructive))",
      gradient:
        "linear-gradient(195deg,color-mix(in oklab,hsl(var(--destructive)) 28%,hsl(var(--card))),hsl(var(--card)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      title: "Mila Novak",
      subtitle: "Illustrator",
      handle: "@thesamkim",
      borderColor: "hsl(var(--muted))",
      gradient:
        "linear-gradient(225deg,color-mix(in oklab,hsl(var(--muted)) 28%,hsl(var(--card))),hsl(var(--card)))",
    },
    {
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      title: "Oren Weiss",
      subtitle: "Editor",
      handle: "@tylerrod",
      borderColor: "hsl(var(--primary))",
      gradient:
        "linear-gradient(135deg,color-mix(in oklab,hsl(var(--primary)) 28%,hsl(var(--card))),hsl(var(--card)))",
    },
  ];

  const data = (items?.length ? items : defaultItems).slice(0, columns * rows);

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
          // Up to `columns` tracks; narrow containers wrap to fewer, never overflow.
          gridTemplateColumns: `repeat(auto-fill, minmax(max(100px, calc((100% - ${columns - 1} * 0.75rem) / ${columns})), 1fr))`,
          maxWidth: `${columns * 240}px`,
        } as React.CSSProperties
      }
    >
      {data.map((c, i) => (
        <article
          key={i}
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c.url)}
          className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-md border border-border transition-colors duration-300"
          style={
            {
              "--card-border": c.borderColor || "transparent",
              background: c.gradient,
              "--spotlight-color": "hsl(var(--background) / 0.35)",
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
              className="aspect-[4/5] w-full rounded-sm object-cover grayscale-[35%]"
            />
          </div>
          <footer className="relative z-10 flex min-w-0 flex-col gap-1 p-3 font-sans text-foreground">
            <h3 className="m-0 truncate font-serif text-[1.05rem] font-normal">{c.title}</h3>
            {c.handle && <span className="truncate text-[0.8rem] opacity-80">{c.handle}</span>}
            <p className="m-0 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              {c.subtitle}
            </p>
            {c.location && <span className="truncate text-[0.85rem] opacity-85">{c.location}</span>}
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
