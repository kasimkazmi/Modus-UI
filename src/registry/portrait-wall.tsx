"use client";
// Portrait cards held in grey; a soft lens under the pointer lets their colour back in.
import type { PointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface PortraitWallItem {
  image: string;
  name: string;
  handle?: string;
  role?: string;
}

interface PortraitWallProps {
  items?: PortraitWallItem[];
  radius?: number;
  columns?: number;
  rows?: number;
  damping?: number;
  className?: string;
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=480&q=80&auto=format&fit=crop`;

const PEOPLE: PortraitWallItem[] = [
  {
    image: photo("1534528741775-53994a69daeb"),
    name: "Ines Okafor",
    handle: "@inesok",
    role: "Type designer",
  },
  {
    image: photo("1507003211169-0a1dd7228f2d"),
    name: "Theo Marchetti",
    handle: "@theom",
    role: "Bookbinder",
  },
  {
    image: photo("1494790108377-be9c29b29330"),
    name: "Hana Sato",
    handle: "@hanasato",
    role: "Letterpress printer",
  },
  {
    image: photo("1500648767791-00dcc994a43e"),
    name: "Arlo Venn",
    handle: "@arlovenn",
    role: "Paper maker",
  },
  {
    image: photo("1438761681033-6461ffad8d80"),
    name: "Mira Holt",
    handle: "@mirah",
    role: "Illustrator",
  },
  {
    image: photo("1472099645785-5658abf4ff4e"),
    name: "Jonas Ekberg",
    handle: "@jonase",
    role: "Archivist",
  },
];

export function PortraitWall({
  items = PEOPLE,
  radius = 300,
  columns = 3,
  rows = 2,
  damping = 15,
  className,
}: PortraitWallProps) {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(-9999);
  const rawY = useMotionValue(-9999);
  const springX = useSpring(rawX, { stiffness: 160, damping });
  const springY = useSpring(rawY, { stiffness: 160, damping });
  const x = reduce ? rawX : springX;
  const y = reduce ? rawY : springY;
  const mask = useMotionTemplate`radial-gradient(circle ${radius / 2}px at ${x}px ${y}px, transparent 0%, transparent 35%, black 100%)`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (rawX.get() < -999) {
      springX.jump(e.clientX - box.left);
      springY.jump(e.clientY - box.top);
    }
    rawX.set(e.clientX - box.left);
    rawY.set(e.clientY - box.top);
  };

  const onLeave = () => {
    rawX.set(-9999);
    rawY.set(-9999);
    springX.jump(-9999);
    springY.jump(-9999);
  };

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("relative grid w-full gap-3", className)}
      style={{
        maxWidth: columns * 240,
        gridTemplateColumns: `repeat(auto-fit, minmax(max(160px, calc((100% - ${(columns - 1) * 12}px) / ${columns})), 1fr))`,
      }}
    >
      {items.slice(0, columns * rows).map((p) => (
        <figure
          key={p.name}
          className="overflow-hidden rounded-lg border border-border bg-card p-3"
        >
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-md object-cover"
          />
          <figcaption className="mt-3 space-y-1">
            <p className="font-serif text-lg leading-none text-foreground">{p.name}</p>
            {p.handle && <p className="font-sans text-xs text-muted-foreground">{p.handle}</p>}
            {p.role && (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {p.role}
              </p>
            )}
          </figcaption>
        </figure>
      ))}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg backdrop-grayscale"
        style={{
          background: "hsl(var(--background) / 0.12)",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </div>
  );
}
