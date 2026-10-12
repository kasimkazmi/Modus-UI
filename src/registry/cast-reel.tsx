"use client";
// Ported from ThreeUI Community's Character Carousel (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CastReelItem {
  name: string;
  role: string;
  image: string;
  /** Card colour (wave variant); defaults to a primary-tinted card. */
  color?: string;
}

export interface CastReelProps {
  /** Layout: a contact-sheet filmstrip or a card wave. */
  variant?: "filmstrip" | "wave";
  /** Cards to show. */
  items?: CastReelItem[];
  /** Animation speed multiplier (0 to 2.5). */
  speed?: number;
  /** Deck scale (0.7 to 1.3). */
  scale?: number;
  /** Opacity of the scene (0.05 to 1). */
  opacity?: number;
  /** Hue rotation in degrees. */
  hue?: number;
  /** Saturation multiplier. */
  saturation?: number;
  /** Brightness multiplier. */
  brightness?: number;
  /** Label on the wave variant's pill button. */
  followLabel?: string;
  className?: string;
}

const img = (id: string) =>
  `https://images.unsplash.com/${id}?w=480&h=720&fit=crop&crop=faces&q=80`;
const SOPHIE = img("photo-1494790108377-be9c29b29330");
const MARCUS = img("photo-1500648767791-00dcc994a43e");
const JULIAN = img("photo-1507003211169-0a1dd7228f2d");
const ELENA = img("photo-1438761681033-6461ffad8d80");

const DEFAULT_ITEMS: CastReelItem[] = [
  { name: "Ines Varga", role: "Type Designer", image: ELENA },
  { name: "Theo Okafor", role: "Motion Lead", image: MARCUS },
  { name: "Mara Lindqvist", role: "Design Engineer", image: SOPHIE },
  { name: "Ren Aoki", role: "Systems Architect", image: JULIAN },
  { name: "Ines Varga", role: "Type Designer", image: ELENA },
  { name: "Theo Okafor", role: "Motion Lead", image: MARCUS },
  { name: "Mara Lindqvist", role: "Design Engineer", image: SOPHIE },
  { name: "Ren Aoki", role: "Systems Architect", image: JULIAN },
  { name: "Theo Okafor", role: "Motion Lead", image: MARCUS },
];

/** Primary tint strength per card, so a default wave reads as a tonal ramp of the palette. */
const TINTS = [6, 16, 28, 12, 22];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const CSS = `
.cc-root{container-type:size;user-select:none;-webkit-tap-highlight-color:transparent}
.cc-root *{box-sizing:border-box}
.cc-root button{font:inherit}
.cc-stage{position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate;touch-action:none;outline:none;color:hsl(var(--foreground))}
.cc-deck{position:absolute;inset:0;z-index:2;transform-style:preserve-3d;transform-origin:50% 50%}
.cc-card{--focus:0;position:absolute;top:50%;left:50%;appearance:none;outline:none;transform-style:preserve-3d;will-change:transform,opacity,filter;cursor:pointer}
.cc-mono{font-family:var(--font-mono,ui-monospace),ui-monospace,monospace;text-transform:uppercase}

.cc-film{font-family:var(--font-body),ui-sans-serif,system-ui,sans-serif;--pointer-x:50%;perspective:1450px;cursor:ew-resize;
  background:linear-gradient(90deg,hsl(var(--border)/.7) 1px,transparent 1px) 50% 0/12.5% 100%,radial-gradient(circle at var(--pointer-x) 50%,hsl(var(--primary)/.1),transparent 38%),hsl(var(--background))}
.cc-film::after{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(90deg,hsl(var(--background)),transparent 16%,transparent 84%,hsl(var(--background)))}
.cc-film .cc-card{width:clamp(150px,16cqw,228px);aspect-ratio:.72;padding:8px;overflow:hidden;border:1px solid hsl(var(--border));border-radius:calc(var(--radius,8px) * .6);background:hsl(var(--card));
  box-shadow:0 calc(8px + var(--focus)*22px) calc(16px + var(--focus)*34px) hsl(var(--foreground)/calc(.06 + var(--focus)*.12))}
.cc-film .cc-card:focus-visible{outline:2px solid hsl(var(--primary));outline-offset:3px}
.cc-film .portrait{position:absolute;inset:8px 8px 24%;overflow:hidden;border-radius:calc(var(--radius,8px) * .4);background:hsl(var(--muted))}
.cc-film .portrait img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(calc(1.04 + (1 - var(--focus))*.06));filter:grayscale(calc(1 - var(--focus))) contrast(1.03)}
.cc-film .footer{position:absolute;right:8px;bottom:8px;left:8px;height:calc(24% - 8px);display:flex;flex-direction:column;justify-content:center;gap:clamp(2px,.3cqw,5px);padding:0 2px;text-align:left}
.cc-film .index{position:absolute;top:0;right:2px;color:hsl(var(--primary));font-size:clamp(7px,.62cqw,10px);letter-spacing:.14em}
.cc-film .name,.cc-film .role{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cc-film .name{font-family:var(--font-heading),ui-serif,Georgia,serif;font-size:clamp(11px,1.1cqw,17px);font-weight:500;letter-spacing:-.01em;line-height:1.1;color:hsl(var(--card-foreground))}
.cc-film .role{color:hsl(var(--muted-foreground));font-size:clamp(6px,.55cqw,9px);letter-spacing:.16em;line-height:1}
@container (max-width:650px){
  .cc-film{cursor:ns-resize}
  .cc-film .cc-card{width:clamp(142px,47cqw,180px)}
}

.cc-wave{font-family:var(--font-body),ui-sans-serif,system-ui,sans-serif;--pointer-x:50%;--pointer-y:50%;perspective:1100px;cursor:crosshair;
  background:radial-gradient(circle at var(--pointer-x) var(--pointer-y),hsl(var(--primary)/.08),transparent 26rem),radial-gradient(hsl(var(--border)) 1px,transparent 1.2px) 0 0/22px 22px,hsl(var(--background))}
.cc-wave .cc-card{width:clamp(122px,10.45cqw,164px);aspect-ratio:.69;padding:clamp(8px,.78cqw,12px);border:1px solid hsl(var(--border));border-radius:clamp(10px,1.05cqw,16px);color:hsl(var(--foreground));
  background:var(--card-color);
  box-shadow:0 calc(6px + var(--focus)*18px) calc(12px + var(--focus)*36px) hsl(var(--foreground)/calc(.08 + var(--focus)*.16))}
.cc-wave .cc-card:focus-visible{outline:2px solid hsl(var(--primary));outline-offset:3px}
.cc-wave .portrait{position:relative;width:100%;aspect-ratio:1;overflow:hidden;border-radius:clamp(7px,.75cqw,11px);background:hsl(var(--muted));transform:translateZ(7px)}
.cc-wave .portrait img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(.35) contrast(1.02)}
.cc-wave .identity{display:grid;place-items:center;gap:clamp(2px,.25cqw,4px);margin-top:clamp(7px,.72cqw,11px);text-align:center;transform:translateZ(8px)}
.cc-wave .name{max-width:100%;overflow:hidden;font-family:var(--font-heading),ui-serif,Georgia,serif;font-size:clamp(9px,.8cqw,12px);font-weight:500;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}
.cc-wave .role{max-width:100%;overflow:hidden;color:hsl(var(--muted-foreground));font-size:clamp(4px,.36cqw,6px);letter-spacing:.14em;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}
.cc-wave .follow{margin-top:clamp(3px,.35cqw,6px);padding:clamp(3px,.28cqw,4px) clamp(9px,.85cqw,13px);border:1px solid hsl(var(--border));border-radius:999px;color:hsl(var(--foreground));background:hsl(var(--background));font-size:clamp(3px,.29cqw,5px);line-height:1;letter-spacing:.14em}
.cc-wave .cc-card[aria-current="true"] .follow{border-color:hsl(var(--primary));color:hsl(var(--primary-foreground));background:hsl(var(--primary))}
@container (max-width:680px){.cc-wave .cc-card{width:clamp(112px,31cqw,138px)}}
`;

export function CastReel({
  variant = "wave",
  items = DEFAULT_ITEMS,
  speed = 1,
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  followLabel = "Say hello",
  className,
}: CastReelProps) {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 2.5);
  const isFilm = variant !== "wave";

  useEffect(() => {
    const stage = stageRef.current;
    const deck = deckRef.current;
    if (!stage || !deck) return;
    const cards = Array.from(deck.querySelectorAll<HTMLButtonElement>(".cc-card"));
    const count = cards.length;
    if (!count) return;
    const reducedMotion = !!prefersReducedMotion;

    // virtual clock, scaled by `speed`
    let clock = 0;
    const now = () => clock;
    const size = () => ({ w: stage.clientWidth, h: stage.clientHeight });

    const wrappedDelta = (index: number, phase: number) => {
      let delta = index - phase;
      while (delta > count / 2) delta -= count;
      while (delta < -count / 2) delta += count;
      return delta;
    };

    const film = {
      phase: 3,
      target: 3,
      base: 3,
      pointerX: 0,
      pointerY: 0,
      active: false,
      lastInput: 0,
    };
    const narrowWave = () => size().w < 680;
    const wave = {
      phase: 2,
      targetPhase: 2,
      basePhase: 2,
      orientation: narrowWave() ? 1 : 0,
      targetOrientation: narrowWave() ? 1 : 0,
      pointerX: 0,
      pointerY: 0,
      tiltX: 0,
      tiltY: 0,
      active: false,
      manualOrientation: false,
      lastInput: 0,
    };

    const nearestIndex = () => {
      const phase = isFilm ? film.phase : wave.phase;
      return ((Math.round(phase) % count) + count) % count;
    };
    const step = (dir: number) => {
      if (isFilm) {
        film.base += dir;
        film.target = film.base;
        film.active = false;
        film.lastInput = now();
      } else {
        wave.basePhase += dir;
        wave.targetPhase = wave.basePhase;
        wave.active = false;
        wave.lastInput = now();
      }
    };
    const moveTo = (index: number) => {
      let delta = index - nearestIndex();
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
      if (isFilm) {
        film.base += delta;
        film.target = film.base;
        film.active = false;
        film.lastInput = now();
      } else {
        wave.basePhase += delta;
        wave.targetPhase = wave.basePhase;
        wave.lastInput = now();
      }
    };
    const toggleOrientation = () => {
      wave.manualOrientation = true;
      wave.targetOrientation = wave.targetOrientation > 0.5 ? 0 : 1;
      wave.targetPhase = wave.basePhase;
      wave.lastInput = now();
    };

    const cardHandlers = cards.map((card, index) => {
      const h = () => moveTo(index);
      card.addEventListener("click", h);
      card.addEventListener("focus", h);
      return h;
    });

    const onPointer = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      if (isFilm) {
        film.pointerX = nx;
        film.pointerY = ny;
        film.active = true;
        film.target = film.base + (rect.width < 650 ? ny * 2.2 : nx * 3.1);
        film.lastInput = now();
        stage.style.setProperty("--pointer-x", `${(nx + 1) * 50}%`);
      } else {
        wave.pointerX = nx;
        wave.pointerY = ny;
        wave.tiltX = nx;
        wave.tiltY = ny;
        wave.active = true;
        wave.lastInput = now();
        const axis = wave.targetOrientation > 0.5 ? ny : nx;
        wave.targetPhase = wave.basePhase + axis * (rect.width < 680 ? 1.55 : 2.45);
        stage.style.setProperty("--pointer-x", `${((nx + 1) / 2) * 100}%`);
        stage.style.setProperty("--pointer-y", `${((ny + 1) / 2) * 100}%`);
      }
    };
    const onLeave = () => {
      if (isFilm) {
        film.active = false;
        film.pointerX = 0;
        film.pointerY = 0;
        film.target = film.base;
      } else {
        wave.active = false;
        wave.targetPhase = wave.basePhase;
        wave.pointerX = 0;
        wave.pointerY = 0;
        stage.style.setProperty("--pointer-y", "50%");
      }
      stage.style.setProperty("--pointer-x", "50%");
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = Math.sign(
        Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX,
      );
      if (direction) step(direction);
    };
    const onKey = (event: KeyboardEvent) => {
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
      if (!isFilm && event.key === " ") {
        event.preventDefault();
        toggleOrientation();
        return;
      }
      if (!forward && !backward) return;
      event.preventDefault();
      step(forward ? 1 : -1);
    };
    const onDbl = () => {
      if (!isFilm) toggleOrientation();
    };
    const ro = new ResizeObserver(() => {
      if (!isFilm && !wave.manualOrientation) wave.targetOrientation = narrowWave() ? 1 : 0;
    });
    ro.observe(stage);

    stage.addEventListener("pointermove", onPointer);
    stage.addEventListener("pointerdown", onPointer);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("keydown", onKey);
    stage.addEventListener("dblclick", onDbl);

    const renderFilm = (time: number, deltaTime: number) => {
      const ease = reducedMotion ? 1 : 1 - Math.pow(0.001, deltaTime / 1000);
      if (!film.active && time - film.lastInput > 3600 && !reducedMotion) {
        const idle = time - film.lastInput - 3600;
        film.target = film.base + Math.sin(idle * 0.00042) * 2.45;
      }
      film.phase += (film.target - film.phase) * ease;
      const { w, h } = size();
      const compact = w < 650;
      const activeIndex = nearestIndex();
      const horizontalSpacing = Math.min(168, Math.max(112, w * 0.116));
      const verticalSpacing = Math.min(122, Math.max(88, h * 0.112));
      cards.forEach((card, index) => {
        const delta = wrappedDelta(index, film.phase);
        const distance = Math.abs(delta);
        const focus = Math.exp(-distance * distance * 1.28);
        const side = Math.max(0, 1 - distance / 5);
        const direction = Math.sign(delta);
        const x = compact ? delta * 24 + Math.sin(delta * 0.9) * 25 : delta * horizontalSpacing;
        const y = compact ? delta * verticalSpacing : distance * 8 + film.pointerY * focus * 10;
        const z = focus * 145 - distance * 148;
        const sc = 0.54 + side * 0.15 + focus * 0.54;
        const rotateX = compact ? delta * 2.1 : -film.pointerY * focus * 3.5;
        const rotateY = compact
          ? -delta * 5
          : -direction * (distance > 0.2 ? 14 + Math.min(distance, 3) * 5 : 0) +
            film.pointerX * focus * 3;
        const rotateZ = compact ? delta * -1.4 : delta * 0.7;
        card.style.setProperty("--focus", focus.toFixed(4));
        card.style.zIndex = String(Math.round(1000 - distance * 100));
        card.style.opacity = String(Math.max(0.13, side * 0.76 + focus * 0.24));
        card.style.filter = `blur(${Math.max(0, distance - 1.5) * 0.38}px)`;
        card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        card.setAttribute("aria-current", index === activeIndex ? "true" : "false");
      });
    };

    const renderWave = (time: number, deltaTime: number) => {
      const ease = reducedMotion ? 1 : 1 - Math.pow(0.0007, deltaTime / 1000);
      if (
        !wave.active &&
        !wave.manualOrientation &&
        time - wave.lastInput > 4200 &&
        !reducedMotion
      ) {
        const idle = time - wave.lastInput - 4200;
        wave.targetPhase = wave.basePhase + Math.sin(idle * 0.00034) * 1.9;
        wave.targetOrientation = (Math.sin(idle * 0.00019 - Math.PI / 2) + 1) / 2;
      }
      wave.phase += (wave.targetPhase - wave.phase) * ease;
      wave.orientation += (wave.targetOrientation - wave.orientation) * ease * 0.72;
      wave.tiltX += ((wave.active ? wave.pointerX : 0) - wave.tiltX) * ease * 0.72;
      wave.tiltY += ((wave.active ? wave.pointerY : 0) - wave.tiltY) * ease * 0.72;
      const { w, h } = size();
      const horizontalSpacing = Math.min(150, Math.max(102, w * 0.096));
      const verticalSpacing = Math.min(136, Math.max(99, h * 0.148));
      const activeIndex = nearestIndex();
      const o = wave.orientation;
      cards.forEach((card, index) => {
        const delta = wrappedDelta(index, wave.phase);
        const distance = Math.abs(delta);
        const focus = Math.exp(-Math.pow(distance, 2) * 1.05);
        const side = Math.max(0, 1 - distance / 5);
        const direction = Math.sign(delta);
        const horizontalX = delta * horizontalSpacing;
        const horizontalY = -Math.pow(distance, 1.45) * 6 + Math.sin(delta * 0.8) * 5;
        const verticalX =
          Math.sin(delta * 0.82) * Math.min(78, w * 0.06) +
          direction * Math.pow(distance, 1.25) * 8;
        const verticalY = delta * verticalSpacing;
        const x = horizontalX * (1 - o) + verticalX * o;
        const y = horizontalY * (1 - o) + verticalY * o;
        const z = focus * 95 - distance * 78;
        const sc = 0.57 + side * 0.16 + focus * 0.38;
        const rotateX = -wave.tiltY * focus * 5 + delta * 2.2 * o;
        const rotateY = wave.tiltX * focus * 7 - delta * 8.5 * (1 - o);
        const rotateZ = delta * 2.25 * (1 - o) - delta * 1.4 * o;
        card.style.setProperty("--focus", focus.toFixed(4));
        card.style.zIndex = String(Math.round(1000 - distance * 100));
        card.style.opacity = String(Math.max(0.14, side * 0.82 + focus * 0.18));
        card.style.filter = `blur(${Math.max(0, distance - 1.35) * 0.45}px) saturate(${0.72 + focus * 0.28})`;
        card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        card.setAttribute("aria-current", index === activeIndex ? "true" : "false");
      });
    };

    const render = isFilm ? renderFilm : renderWave;
    let raf = 0;
    let prevReal = -1;
    let visible = true;
    const frame = (real: number) => {
      raf = requestAnimationFrame(frame);
      const realDelta = prevReal < 0 ? 0 : real - prevReal;
      prevReal = real;
      const delta = Math.min(32, realDelta) * speedRef.current;
      clock += realDelta * speedRef.current;
      render(clock, delta);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      prevReal = -1;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(stage);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    render(0, 16);
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cards.forEach((card, i) => {
        card.removeEventListener("click", cardHandlers[i]);
        card.removeEventListener("focus", cardHandlers[i]);
      });
      stage.removeEventListener("pointermove", onPointer);
      stage.removeEventListener("pointerdown", onPointer);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKey);
      stage.removeEventListener("dblclick", onDbl);
    };
  }, [isFilm, items, prefersReducedMotion]);

  return (
    <div
      className={cn("cc-root relative h-full w-full overflow-hidden", className)}
      style={{ minHeight: 400 }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className="absolute inset-0"
        style={{
          opacity: clamp(opacity, 0.05, 1),
          filter: `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`,
        }}
      >
        <div
          ref={stageRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={isFilm ? "Interactive team contact sheet" : "Interactive team card wave"}
          className={cn("cc-stage", isFilm ? "cc-film" : "cc-wave")}
        >
          <div
            ref={deckRef}
            className="cc-deck"
            style={{ transform: `scale(${clamp(scale, 0.7, 1.3)})` }}
          >
            {items.map((item, index) =>
              isFilm ? (
                <button
                  key={index}
                  type="button"
                  className="cc-card"
                  aria-label={`Focus ${item.name}, ${item.role}`}
                >
                  <span className="portrait">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={`Portrait of ${item.name}`} draggable={false} />
                  </span>
                  <span className="footer">
                    <span className="index cc-mono">{String(index + 1).padStart(2, "0")}</span>
                    <span className="meta">
                      <span className="name">{item.name}</span>
                      <span className="role cc-mono">{item.role}</span>
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  key={index}
                  type="button"
                  className="cc-card"
                  aria-label={`Focus ${item.name}, ${item.role}`}
                  style={{
                    ["--card-color" as string]:
                      item.color ??
                      `color-mix(in hsl, hsl(var(--primary)) ${TINTS[index % TINTS.length]}%, hsl(var(--card)))`,
                  }}
                >
                  <span className="portrait">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={`Portrait of ${item.name}`} draggable={false} />
                  </span>
                  <span className="identity">
                    <span className="name">{item.name}</span>
                    <span className="role cc-mono">{item.role}</span>
                    <span className="follow cc-mono" aria-hidden="true">
                      {followLabel}
                    </span>
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
