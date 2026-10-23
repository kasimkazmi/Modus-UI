"use client";

import { motion, useAnimationFrame, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { cn } from "@/lib/utils";

export interface CurvedCarouselCard {
  /** Looping clip, muted and cover-fitted. */
  video?: string;
  /** Still image, also the clip's poster. */
  image?: string;
}

const PITCH = 196;
const STYLES = `
.cch, .cch *, .cch *::before, .cch *::after { box-sizing: border-box; }
.cch { position: relative; width: 100%; height: 100%; min-height: 0; overflow: hidden; container-type: size; color: hsl(var(--foreground)); background: var(--cch-bg, hsl(var(--background))); font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif; }
.cch-frame { --u: min(calc(100cqw / 1440), calc(100cqh / 1080)); --cch-units: 1440; position: absolute; top: 50%; left: 50%; width: calc(1440 * var(--u)); height: calc(1080 * var(--u)); transform: translate(-50%, -50%); }
.cch-badge { position: absolute; top: calc(115 * var(--u)); left: 50%; translate: -50% 0; display: inline-flex; align-items: center; height: calc(37 * var(--u)); padding: 0 calc(18 * var(--u)); border-radius: 999px; background: hsl(var(--primary) / 0.14); color: hsl(var(--primary)); font-size: calc(16.6 * var(--u)); font-weight: 500; white-space: nowrap; }
.cch-title { position: absolute; top: calc(176 * var(--u)); left: 0; right: 0; margin: 0; text-align: center; font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif; font-size: calc(88 * var(--u)); font-weight: 700; line-height: calc(92 * var(--u)); letter-spacing: -0.035em; }
.cch-title > span { display: block; }
.cch-title > span + span { letter-spacing: -0.022em; }
.cch-lede { position: absolute; top: calc(394 * var(--u)); left: 50%; width: calc(560 * var(--u)); translate: -50% 0; margin: 0; text-align: center; color: hsl(var(--muted-foreground)); font-size: calc(20.8 * var(--u)); line-height: calc(32 * var(--u)); }
.cch-track-band { position: absolute; top: calc(495 * var(--u)); left: 0; width: 100%; height: calc(390 * var(--u)); --cch-cy: 192; }
.cch-cta { position: absolute; top: calc(901 * var(--u)); left: calc(626 * var(--u)); width: calc(190 * var(--u)); height: calc(74 * var(--u)); display: grid; place-items: center; border: 1.5px dashed hsl(var(--primary) / 0.6); border-radius: 999px; }
.cch-cta a { display: grid; place-items: center; width: calc(172 * var(--u)); height: calc(58 * var(--u)); border-radius: 999px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); font-size: calc(17 * var(--u)); font-weight: 500; text-decoration: none; }
.cch-ink { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; color: hsl(var(--primary)); }
.cch-note { position: absolute; margin: 0; color: hsl(var(--primary)); font-family: Caveat, "Bradley Hand", "Segoe Print", cursive; font-size: calc(30 * var(--u)); font-weight: 600; line-height: 1; white-space: pre; transform-origin: left top; pointer-events: none; }
.cch-track { position: relative; width: 100%; height: 100%; cursor: grab; touch-action: pan-y; user-select: none; }
.cch-track[data-dragging] { cursor: grabbing; }
.cch-card { position: absolute; top: 0; left: 0; overflow: hidden; will-change: transform, clip-path; }
.cch-card > img, .cch-card > video, .cch-card > i { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.cch-card > video { opacity: 0; transition: opacity 0.4s; }
.cch-card > video[data-ready] { opacity: 1; }
.cch-play { position: absolute; bottom: 14px; left: 12px; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: hsl(var(--background) / 0.35); color: hsl(var(--background)); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
@container (max-width: 820px) {
  .cch-frame { position: static; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 100%; padding: 20px 0; transform: none; --cch-units: 640; }
  .cch-badge, .cch-title, .cch-lede, .cch-track-band, .cch-cta { position: static; translate: none; }
  .cch-badge { height: 30px; padding: 0 14px; font-size: 13px; }
  .cch-title { padding: 0 16px; font-size: clamp(24px, 8cqw, 56px); line-height: 1.04; }
  .cch-lede { width: auto; max-width: 40ch; padding: 0 16px; font-size: 13px; line-height: 1.5; }
  .cch-track-band { flex: 1 1 0; width: 100%; height: auto; min-height: 110px; max-height: 250px; }
  .cch-cta { width: 168px; height: 62px; }
  .cch-cta a { width: 152px; height: 48px; font-size: 15px; }
  .cch-ink, .cch-note { display: none; }
}
@container (max-width: 820px) and (max-height: 600px) { .cch-lede { display: none; } }
`;

type Pt = [number, number];

/** A closed path through four corners, each rounded with a quadratic curve of radius r. */
function roundedQuad(points: Pt[], r: number) {
  const toward = (from: Pt, to: Pt): Pt => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const k = r / Math.hypot(dx, dy);
    return [from[0] + dx * k, from[1] + dy * k];
  };
  const f = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  return (
    points
      .map((p, i) => {
        const a = toward(p, points[(i + 3) % 4]);
        const b = toward(p, points[(i + 1) % 4]);
        return `${i ? "L" : "M"} ${f(a)} Q ${f(p)} ${f(b)}`;
      })
      .join(" ") + " Z"
  );
}

function CarouselTrack({
  cards,
  speed,
  still,
}: {
  cards: CurvedCarouselCard[];
  speed: number;
  still: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef({
    offset: 0,
    velocity: 0,
    dragging: false,
    lastX: 0,
    lastT: 0,
    units: 1440,
    cy: 192,
    scale: 1,
  });

  // The track's frame width (1440 wide, 640 compact) and vertical centre come from the stylesheet.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const css = getComputedStyle(track);
      const s = state.current;
      if (Number(css.getPropertyValue("--cch-units")) === 640) {
        // Compact: fit a 640-unit row into whatever height the band has left.
        s.scale = Math.min(track.clientWidth / 640, track.clientHeight / 380);
        s.units = track.clientWidth / s.scale;
        s.cy = track.clientHeight / 2 / s.scale;
      } else {
        s.units = 1440;
        s.scale = track.clientWidth / 1440;
        s.cy = Number(css.getPropertyValue("--cch-cy")) || 192;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const count = cards.length;
  const loop = count * PITCH;

  useAnimationFrame((_, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 64) / 1000;
    if (!s.dragging) {
      s.offset += s.velocity * dt;
      s.velocity *= Math.pow(0.05, dt);
      if (!still) s.offset -= speed * dt;
    }

    const centre = s.units / 2;
    const radius = centre - 14;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const t = ((((i * PITCH + s.offset) % loop) + loop * 1.5) % loop) - loop / 2;
      const x = centre + t * (1 + 0.083 * (t / radius) ** 2);
      const d = Math.abs(x - centre) / radius;
      const w = 170 + 48 * d * d;
      const edge = (ex: number) => 280 + 92 * (Math.abs(ex - centre) / radius) ** 2.6;
      const hl = edge(x - w / 2);
      const hr = edge(x + w / 2);
      const h = Math.max(hl, hr);
      const cy = s.cy - 12 * d * d;
      const k = s.scale;

      el.style.width = `${w * k}px`;
      el.style.height = `${h * k}px`;
      el.style.transform = `translate(${(x - w / 2) * k}px, ${(cy - h / 2) * k}px)`;
      el.style.clipPath = `path("${roundedQuad(
        [
          [0, ((h - hl) / 2) * k],
          [w * k, ((h - hr) / 2) * k],
          [w * k, ((h + hr) / 2) * k],
          [0, ((h + hl) / 2) * k],
        ],
        15 * k,
      )}")`;
    });
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    s.dragging = true;
    s.velocity = 0;
    s.lastX = event.clientX;
    s.lastT = event.timeStamp;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "";
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (!s.dragging) return;
    const dx = (event.clientX - s.lastX) / s.scale;
    const dt = Math.max(event.timeStamp - s.lastT, 1) / 1000;
    s.offset += dx;
    s.velocity = dx / dt;
    s.lastX = event.clientX;
    s.lastT = event.timeStamp;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const push = { ArrowLeft: 600, ArrowRight: -600 }[event.key];
    if (push === undefined) return;
    event.preventDefault();
    state.current.velocity += push;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    state.current.dragging = false;
    delete event.currentTarget.dataset.dragging;
  };

  return (
    <div
      ref={trackRef}
      className="cch-track"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Card carousel; use the arrow keys to move it"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          className="cch-card"
        >
          <i
            style={{
              background: `linear-gradient(${150 + i * 37}deg, hsl(var(--primary) / ${0.35 + (i % 3) * 0.2}), hsl(var(--accent)) 70%, hsl(var(--muted)))`,
            }}
          />
          {card.image && <img src={card.image} alt="" draggable={false} />}
          {card.video && !still && (
            <video
              src={card.video}
              poster={card.image}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={(event) => {
                event.currentTarget.dataset.ready = "";
              }}
            />
          )}
          <span className="cch-play" aria-hidden="true">
            <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor">
              <path d="M1 1.2v9.6a.8.8 0 0 0 1.2.7l8-4.8a.8.8 0 0 0 0-1.4l-8-4.8A.8.8 0 0 0 1 1.2Z" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}

export interface CurvedCarouselHeroProps {
  badge?: string;
  /** Headline; a newline starts the second line. */
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Handwritten note by the carousel; a newline breaks it. */
  note?: string;
  /** Handwritten note by the button. */
  ctaNote?: string;
  /** Card media, repeated to fill the arch. Cards without media show a theme-tinted tile. */
  cards?: CurvedCarouselCard[];
  /** Auto-scroll speed in frame units per second. */
  speed?: number;
  backgroundColor?: string;
  className?: string;
  style?: CSSProperties;
}

export function CurvedCarouselHero({
  badge = "New · Curved carousel",
  title = "Every story,\nin motion",
  description = "Line your work up on a curved row that drifts on its own and answers to a drag. Drop in clips or images and it does the rest.",
  ctaLabel = "Get started",
  ctaHref = "#",
  note = "Drag\nthe row",
  ctaNote = "It's free",
  cards = [],
  speed = 50,
  backgroundColor,
  className,
  style,
}: CurvedCarouselHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const still = !!prefersReducedMotion;
  // The arch needs at least ten cards to loop without a gap at 1440 units.
  const filled = Array.from(
    { length: Math.max(10, cards.length) },
    (_, i) => cards[i % cards.length] ?? {},
  );

  const enter = (delay: number, from: Record<string, number | string> = { opacity: 0, y: 16 }) =>
    still
      ? {}
      : {
          initial: from,
          animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
          transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
        };
  const draw = (delay: number) =>
    still
      ? {}
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { delay, duration: 0.9, ease: "easeInOut" as const },
        };

  return (
    <section
      className={cn("cch", className)}
      style={backgroundColor ? { ...style, ["--cch-bg" as string]: backgroundColor } : style}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cch-frame">
        <motion.span className="cch-badge" {...enter(0.1, { opacity: 0, scale: 0.85 })}>
          {badge}
        </motion.span>
        <h2 className="cch-title">
          {title.split("\n").map((line, i) => (
            <motion.span
              key={i}
              {...enter(0.2 + i * 0.12, { opacity: 0, y: 24, filter: "blur(10px)" })}
            >
              {line}
            </motion.span>
          ))}
        </h2>
        <motion.p className="cch-lede" {...enter(0.45)}>
          {description}
        </motion.p>
        <motion.div className="cch-track-band" {...enter(0.55, { opacity: 0, y: 60 })}>
          <CarouselTrack cards={filled} speed={speed} still={still} />
        </motion.div>
        <motion.div className="cch-cta" {...enter(0.8, { opacity: 0, scale: 0.8 })}>
          <a href={ctaHref}>{ctaLabel}</a>
        </motion.div>

        <svg className="cch-ink" viewBox="0 0 1440 1080" fill="none" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M268 410 L282 380 M284 414 L298 384" {...draw(0.9)} />
            <motion.path
              d="M1262 392 C1290 440 1282 500 1222 528 C1200 538 1186 536 1172 530"
              {...draw(1)}
            />
            <motion.path d="M1186 518 L1170 530 L1188 542" {...draw(1.6)} />
            <motion.path d="M560 990 C584 992 604 978 614 958" {...draw(1.1)} />
            <motion.path d="M600 960 L615 956 L618 971" {...draw(1.6)} />
          </g>
        </svg>
        <motion.p
          className="cch-note"
          style={{ left: "calc(1212 * var(--u))", top: "calc(310 * var(--u))", rotate: 16 }}
          {...(still
            ? {}
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 1.1, duration: 0.6 },
              })}
        >
          {note}
        </motion.p>
        <motion.p
          className="cch-note"
          style={{ left: "calc(521 * var(--u))", top: "calc(937 * var(--u))", rotate: 24 }}
          {...(still
            ? {}
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 1.2, duration: 0.6 },
              })}
        >
          {ctaNote}
        </motion.p>
      </div>
    </section>
  );
}
