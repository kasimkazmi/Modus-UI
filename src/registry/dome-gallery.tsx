"use client";
// The viewer stands inside a sphere tiled with images: drag to look around, click a tile to open it.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

type GalleryImage = string | { src: string; alt?: string };

export interface DomeGalleryProps {
  images?: GalleryImage[];
  fit?: number;
  fitBasis?: string;
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
  className?: string;
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=480&q=70`;

const SAMPLE_IMAGES: GalleryImage[] = [
  "1525625293386-3f8f99389edd",
  "1508964942454-1a56651d54ac",
  "1600664356348-10686526af4f",
  "1506351421178-63b52a2d2562",
  "1542114740389-9b46fb1e5be7",
  "1555217851-6141535bd771",
  "1496939376851-89342e90adcd",
  "1565967511849-76a60a516170",
].map((id) => ({ src: photo(id), alt: "" }));

const toImage = (image: GalleryImage) =>
  typeof image === "string" ? { src: image, alt: "" } : { src: image.src, alt: image.alt ?? "" };

function sizeBasis(width: number, height: number, basis: string) {
  if (basis === "width") return width;
  if (basis === "height") return height;
  if (basis === "max") return Math.max(width, height);
  return Math.min(width, height);
}

export function DomeGallery({
  images = [],
  fit = 0.5,
  fitBasis = "auto",
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = "hsl(var(--background))",
  maxVerticalRotationDeg = 45,
  dragSensitivity = 0.5,
  enlargeTransitionMs = 300,
  segments = 8,
  dragDampening = 2,
  openedImageWidth = "400px",
  openedImageHeight = "400px",
  imageBorderRadius = "30px",
  openedImageBorderRadius = "30px",
  grayscale = true,
  className,
}: DomeGalleryProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(minRadius);
  const [opened, setOpened] = useState<{ src: string; alt: string } | null>(null);
  const tiltX = useMotionValue(0);
  const turnY = useMotionValue(0);
  const wasDrag = useRef(false);
  const drag = useRef<{
    x: number;
    y: number;
    t: number;
    vx: number;
    vy: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const r = sizeBasis(width, height, fitBasis) * fit;
      setRadius(Math.min(maxRadius, Math.max(minRadius, r)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit, fitBasis, minRadius, maxRadius]);

  // `segments` tiles per quarter turn; rows reach past the tilt limit so the dome never shows a gap.
  const step = 90 / segments;
  const tiles = useMemo(() => {
    const pool = (images.length ? images : SAMPLE_IMAGES).map(toImage);
    const rowReach = Math.ceil((maxVerticalRotationDeg + 30) / step);
    const out: { key: string; lon: number; lat: number; image: { src: string; alt: string } }[] =
      [];
    for (let row = -rowReach; row <= rowReach; row++) {
      for (let col = 0; col < segments * 4; col++) {
        const lon = col * step + (row % 2 ? step / 2 : 0);
        const index = (col * 3 + (row + rowReach) * 5) % pool.length;
        out.push({ key: `${row}:${col}`, lon, lat: row * step, image: pool[index] });
      }
    }
    return out;
  }, [images, segments, step, maxVerticalRotationDeg]);

  const tileSize = ((radius * step * Math.PI) / 180) * (1 - padFactor);
  const clampTilt = (deg: number) =>
    Math.max(-maxVerticalRotationDeg, Math.min(maxVerticalRotationDeg, deg));

  const onPointerDown = (event: PointerEvent) => {
    wasDrag.current = false;
    tiltX.stop();
    turnY.stop();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      t: event.timeStamp,
      vx: 0,
      vy: 0,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (event.clientX - d.x) * dragSensitivity * 0.2;
    const dy = (event.clientY - d.y) * dragSensitivity * 0.2;
    if (!d.moved && Math.hypot(event.clientX - d.x, event.clientY - d.y) > 4) {
      d.moved = true;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    if (!d.moved) return;
    const dt = Math.max(1, event.timeStamp - d.t);
    turnY.set(turnY.get() + dx);
    tiltX.set(clampTilt(tiltX.get() - dy));
    Object.assign(d, {
      x: event.clientX,
      y: event.clientY,
      t: event.timeStamp,
      vx: (dx / dt) * 1000,
      vy: (-dy / dt) * 1000,
    });
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    wasDrag.current = !!d?.moved;
    if (!d?.moved || reduceMotion) return;
    const glide = { type: "inertia" as const, timeConstant: 120 * dragDampening, power: 0.3 };
    animate(turnY, turnY.get(), { ...glide, velocity: d.vx });
    animate(tiltX, tiltX.get(), {
      ...glide,
      velocity: d.vy,
      min: -maxVerticalRotationDeg,
      max: maxVerticalRotationDeg,
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const turn = {
      ArrowLeft: [0, step],
      ArrowRight: [0, -step],
      ArrowUp: [-step, 0],
      ArrowDown: [step, 0],
    }[event.key];
    if (!turn) return;
    event.preventDefault();
    const transition = reduceMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 200, damping: 30 };
    animate(tiltX, clampTilt(tiltX.get() + turn[0]), transition);
    animate(turnY, turnY.get() + turn[1], transition);
  };

  useEffect(() => {
    if (!opened) return;
    const close = (event: globalThis.KeyboardEvent) => event.key === "Escape" && setOpened(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [opened]);

  // The camera sits 1px off the sphere's centre: exactly on it, browsers stop hit-testing the tiles.
  const sphere = useMotionTemplate`translateZ(${radius - 1}px) rotateX(${tiltX}deg) rotateY(${turnY}deg)`;
  const fade = reduceMotion ? 0 : enlargeTransitionMs / 1000;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label="Image dome. Drag or use the arrow keys to look around."
      onKeyDown={onKeyDown}
      className={cn(
        "relative h-full w-full touch-none select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        className,
      )}
    >
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ perspective: radius }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{ transform: sphere, transformStyle: "preserve-3d" }}
        >
          {tiles.map(({ key, lon, lat, image }) => (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              aria-label={image.alt || "Open image"}
              onClick={() => !wasDrag.current && setOpened(image)}
              className="absolute overflow-hidden bg-[hsl(var(--muted))] [backface-visibility:hidden]"
              style={{
                width: tileSize,
                height: tileSize,
                left: -tileSize / 2,
                top: -tileSize / 2,
                borderRadius: imageBorderRadius,
                transform: `rotateY(${lon}deg) rotateX(${lat}deg) translateZ(${-radius}px)`,
              }}
            >
              <img
                src={image.src}
                alt=""
                draggable={false}
                className={cn("block h-full w-full object-cover", grayscale && "grayscale")}
              />
            </button>
          ))}
        </motion.div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 45%, ${overlayBlurColor} 95%)`,
        }}
      />

      <AnimatePresence>
        {opened && (
          <motion.div
            key="opened"
            className="absolute inset-0 z-10 flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: `color-mix(in srgb, ${overlayBlurColor} 60%, transparent)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: fade }}
            onClick={() => setOpened(null)}
          >
            <motion.img
              src={opened.src}
              alt={opened.alt}
              className="max-h-full max-w-full object-cover shadow-2xl"
              style={{
                width: openedImageWidth,
                height: openedImageHeight,
                borderRadius: openedImageBorderRadius,
              }}
              initial={{ scale: reduceMotion ? 1 : 0.6 }}
              animate={{ scale: 1 }}
              exit={{ scale: reduceMotion ? 1 : 0.6 }}
              transition={{ duration: fade, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
