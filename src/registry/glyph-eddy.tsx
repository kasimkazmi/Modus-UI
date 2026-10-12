"use client";

// Ported from ThreeUI Community's Typography Vortex (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type GlyphEddyOptions = {
  theme: Theme;
  phrase: string;
  speed: number;
  ringGrowth: number;
  opacity: number;
  dissolveRadius: number;
  particleAmount: number;
  suctionDuration: number;
};

interface GlyphEddyProps {
  phrase?: string;
  speed?: number;
  ringGrowth?: number;
  opacity?: number;
  dissolveRadius?: number;
  particleAmount?: number;
  suctionDuration?: number;
  hint?: string;
  className?: string;
}

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.16'/%3E%3C/svg%3E\")";

type Rgb = [number, number, number];
const TOKENS = [
  "background",
  "foreground",
  "primary",
  "muted-foreground",
  "border",
  "card",
] as const;
type Theme = Record<(typeof TOKENS)[number], Rgb>;

/** Any CSS colour as 0–1 sRGB channels, resolved by the browser. */
function toRgb(color: string): Rgb {
  const probe = document.createElement("i");
  probe.style.display = "none";
  probe.style.color = color;
  document.body.appendChild(probe);
  const [r = 0, g = 0, b = 0] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}

/** The Modus theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const style = getComputedStyle(root);
      setTheme(
        Object.fromEntries(
          TOKENS.map((t) => [t, toRgb(`hsl(${style.getPropertyValue(`--${t}`).trim()})`)]),
        ) as Theme,
      );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

const css = (c: Rgb, alpha = 1) => `rgb(${c.map((v) => Math.round(v * 255)).join(" ")} / ${alpha})`;

type Ring = {
  radius: number;
  fontSize: number;
  alpha: number;
  speed: number;
  offset: number;
  spacing: number;
  wobble: number;
  bitmap: HTMLCanvasElement;
  size: number;
};

type Stray = {
  radius: number;
  angle: number;
  speed: number;
  character: string;
  alpha: number;
  fontSize: number;
};

type Dust = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  life: number;
  maxLife: number;
  phase: number;
  spin: number;
  color: string;
  sucked: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

function createGlyphEddyRenderer(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  getOptions: () => GlyphEddyOptions,
  reduced: boolean,
) {
  const context = canvas.getContext("2d");
  const layer = document.createElement("canvas");
  const layerContext = layer.getContext("2d", { willReadFrequently: true });
  if (!context || !layerContext) return () => undefined;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const pointer = { x: 0, y: 0, inside: false };
  const suction = { x: 0, y: 0, started: 0, until: 0 };
  let width = 0;
  let height = 0;
  let rings: Ring[] = [];
  let strays: Stray[] = [];
  let particles: Dust[] = [];
  let dissolve = 0;
  let lastSpawn = 0;
  let lastAmbientSpawn = 0;
  let lastTime = 0;
  let stateFrame = 0;
  let frame = 0;
  let visible = true;
  let renderSignature = "";
  // The host carries `font-mono`, so this is the palette's mono stack.
  const fontFamily = getComputedStyle(host).fontFamily;

  const buildRings = () => {
    const options = getOptions();
    const phrase = options.phrase || "MODUS / FORM FOLLOWS MOTION / ";
    const random = mulberry32(11 * 29 + 5);
    const ringPixelRatio = Math.max(pixelRatio, 1.5);
    const maximumRadius =
      Math.hypot(Math.max(width * 0.55, width * 0.48), Math.max(height * 0.52, height * 0.5)) + 40;
    rings = [];
    let radius = Math.max(26, width * 0.038);
    let index = 0;
    while (radius < maximumRadius) {
      const sparse = index % 3 === 2;
      const ringBase = {
        radius,
        fontSize: clamp(7 + radius * 0.015, 7, 17),
        alpha:
          clamp(0.34 + radius / maximumRadius, 0.36, 0.92) * (sparse ? 0.72 : 1) * options.opacity,
        speed: (0.05 + 40 / (radius + 60)) * 0.35,
        offset: random() * Math.PI * 2,
        spacing: sparse ? 2.4 + random() * 1.2 : 1.02 + random() * 0.14,
        wobble: random() * Math.PI * 2,
      };
      const size = Math.ceil((ringBase.radius + ringBase.fontSize * 2) * 2);
      const bitmap = document.createElement("canvas");
      bitmap.width = bitmap.height = Math.ceil(size * ringPixelRatio);
      const bitmapContext = bitmap.getContext("2d");
      if (!bitmapContext) break;
      bitmapContext.scale(ringPixelRatio, ringPixelRatio);
      bitmapContext.translate(size / 2, size / 2);
      bitmapContext.font = `${ringBase.fontSize}px ${fontFamily}`;
      bitmapContext.textAlign = "center";
      bitmapContext.textBaseline = "middle";
      // Every fourth ring is set in the accent colour.
      const ink = index % 4 === 1 ? options.theme.primary : options.theme.foreground;
      bitmapContext.fillStyle = css(ink, ringBase.alpha);
      const step = (ringBase.fontSize * 0.62 * ringBase.spacing) / ringBase.radius;
      const count = Math.max(4, Math.floor((Math.PI * 2) / step));
      const actualStep = (Math.PI * 2) / count;
      for (let characterIndex = 0; characterIndex < count; characterIndex += 1) {
        const angle = characterIndex * actualStep;
        const character = phrase[characterIndex % phrase.length];
        if (character === " ") continue;
        bitmapContext.save();
        bitmapContext.translate(
          Math.cos(angle) * ringBase.radius,
          Math.sin(angle) * ringBase.radius,
        );
        bitmapContext.rotate(angle + Math.PI / 2);
        bitmapContext.fillText(character, 0, 0);
        bitmapContext.restore();
      }
      rings.push({ ...ringBase, bitmap, size });
      radius *= Math.max(1.08, options.ringGrowth);
      index += 1;
    }

    strays = [];
    for (let strayIndex = 0; strayIndex < 34; strayIndex += 1) {
      strays.push({
        radius: 30 + random() * (maximumRadius - 60),
        angle: random() * Math.PI * 2,
        speed: (random() - 0.5) * 0.06,
        character: phrase[(random() * phrase.length) | 0],
        alpha: (0.18 + random() * 0.3) * options.opacity,
        fontSize: 8 + random() * 6,
      });
    }
  };

  const resize = () => {
    const bounds = host.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    layer.width = Math.round(width * pixelRatio);
    layer.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    layerContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    particles = [];
    renderSignature = "";
  };

  const spawnPointerDust = (time: number, radius: number) => {
    const options = getOptions();
    if (
      reduced ||
      time < suction.until ||
      !pointer.inside ||
      dissolve < 0.08 ||
      time - lastSpawn < 44
    )
      return;
    lastSpawn = time;
    const x0 = Math.max(0, Math.floor((pointer.x - radius) * pixelRatio));
    const y0 = Math.max(0, Math.floor((pointer.y - radius) * pixelRatio));
    const x1 = Math.min(layer.width, Math.ceil((pointer.x + radius) * pixelRatio));
    const y1 = Math.min(layer.height, Math.ceil((pointer.y + radius) * pixelRatio));
    if (x1 <= x0 || y1 <= y0) return;
    const sampleWidth = x1 - x0;
    const sampleHeight = y1 - y0;
    const pixels = layerContext.getImageData(x0, y0, sampleWidth, sampleHeight).data;
    const sampleStep = Math.max(4, Math.round(4.5 * pixelRatio));
    const spawnLimit = Math.max(1, Math.round(44 * options.particleAmount));
    let spawned = 0;
    for (let y = 0; y < sampleHeight && spawned < spawnLimit; y += sampleStep) {
      for (let x = 0; x < sampleWidth && spawned < spawnLimit; x += sampleStep) {
        const pixelIndex = (y * sampleWidth + x) * 4;
        const alpha = pixels[pixelIndex + 3];
        if (alpha < 34 || Math.random() > 0.34) continue;
        const particleX = (x0 + x) / pixelRatio;
        const particleY = (y0 + y) / pixelRatio;
        const deltaX = particleX - pointer.x;
        const deltaY = particleY - pointer.y;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance > radius || distance < radius * 0.16) continue;
        const normalX = deltaX / Math.max(1, distance);
        const normalY = deltaY / Math.max(1, distance);
        const burst = 0.35 + Math.random() * 1.35;
        const tangent = (Math.random() - 0.5) * 1.4;
        particles.push({
          x: particleX,
          y: particleY,
          velocityX: normalX * burst - normalY * tangent + (Math.random() - 0.5) * 0.35,
          velocityY: normalY * burst + normalX * tangent - 0.15 + Math.random() * 0.55,
          size: 0.65 + Math.random() * 1.55,
          life: 560 + Math.random() * 620,
          maxLife: 1180,
          phase: Math.random() * Math.PI * 2,
          spin: Math.random() > 0.5 ? 1 : -1,
          color: `${pixels[pixelIndex]} ${pixels[pixelIndex + 1]} ${pixels[pixelIndex + 2]}`,
          sucked: false,
        });
        spawned += 1;
      }
    }
    const maximum = Math.max(1, Math.round(720 * options.particleAmount));
    if (particles.length > maximum) particles.splice(0, particles.length - maximum);
  };

  const spawnAmbientDust = (time: number, ambientWidth: number) => {
    const options = getOptions();
    if (reduced || time < suction.until || time - lastAmbientSpawn < 115) return;
    lastAmbientSpawn = time;
    const sampleWidth = Math.min(width, ambientWidth * 1.12);
    const pixelWidth = Math.max(1, Math.floor(sampleWidth * pixelRatio));
    const pixelHeight = Math.max(1, Math.floor(height * pixelRatio));
    const pixels = layerContext.getImageData(0, 0, pixelWidth, pixelHeight).data;
    const spawnLimit = Math.max(1, Math.round(16 * options.particleAmount));
    let spawned = 0;
    for (let attempt = 0; attempt < 520 && spawned < spawnLimit; attempt += 1) {
      const x = (Math.random() * pixelWidth) | 0;
      const y = (Math.random() * pixelHeight) | 0;
      const pixelIndex = (y * pixelWidth + x) * 4;
      if (pixels[pixelIndex + 3] < 32) continue;
      const particleX = x / pixelRatio;
      const particleY = y / pixelRatio;
      const edge = clamp(particleX / sampleWidth, 0, 1);
      particles.push({
        x: particleX,
        y: particleY,
        velocityX: 0.18 + Math.random() * 0.8 + edge * 0.35,
        velocityY: (Math.random() - 0.5) * 0.8,
        size: 0.55 + Math.random() * 1.35,
        life: 620 + Math.random() * 520,
        maxLife: 1140,
        phase: Math.random() * Math.PI * 2,
        spin: Math.random() > 0.5 ? 1 : -1,
        color: `${pixels[pixelIndex]} ${pixels[pixelIndex + 1]} ${pixels[pixelIndex + 2]}`,
        sucked: false,
      });
      spawned += 1;
    }
    const maximum = Math.max(1, Math.round(720 * options.particleAmount));
    if (particles.length > maximum) particles.splice(0, particles.length - maximum);
  };

  const updateDust = (time: number, deltaTime: number) => {
    const options = getOptions();
    const step = clamp(deltaTime / 16.67, 0.25, 3);
    const suctionActive = !reduced && time < suction.until;
    const alive: Dust[] = [];
    for (const particle of particles) {
      particle.life -= deltaTime;
      if (particle.life <= 0 || (particle.sucked && !suctionActive)) continue;
      let distanceToSink = Infinity;
      if (suctionActive && particle.sucked) {
        const deltaX = suction.x - particle.x;
        const deltaY = suction.y - particle.y;
        distanceToSink = Math.hypot(deltaX, deltaY);
        if (distanceToSink < 5) continue;
        const targetSpeed = clamp(distanceToSink * 0.078, 3.2, 28);
        const pull = 1 - Math.pow(0.76, step);
        particle.velocityX = lerp(
          particle.velocityX,
          (deltaX / distanceToSink) * targetSpeed,
          pull,
        );
        particle.velocityY = lerp(
          particle.velocityY,
          (deltaY / distanceToSink) * targetSpeed,
          pull,
        );
      } else {
        const swirl = Math.sin(time * 0.0024 + particle.phase) * 0.018 * particle.spin;
        particle.velocityX +=
          Math.cos(particle.phase + time * 0.0017) * 0.012 * step - swirl * particle.velocityY;
        particle.velocityY += 0.018 * step + swirl * particle.velocityX;
        particle.velocityX *= Math.pow(0.987, step);
        particle.velocityY *= Math.pow(0.991, step);
      }
      particle.x += particle.velocityX * step;
      particle.y += particle.velocityY * step;
      const sinkFade = suctionActive && particle.sucked ? clamp(distanceToSink / 42, 0.12, 1) : 1;
      const alpha =
        clamp(particle.life / Math.min(particle.maxLife, 820), 0, 1) * sinkFade * options.opacity;
      context.fillStyle = `rgb(${particle.color} / ${alpha * 0.88})`;
      const size = particle.size * (0.5 + alpha * 0.5);
      context.fillRect(particle.x - size * 0.5, particle.y - size * 0.5, size, size);
      alive.push(particle);
    }
    particles = alive;
    if (suctionActive) {
      const progress = clamp((time - suction.started) / (suction.until - suction.started), 0, 1);
      context.save();
      context.strokeStyle = css(options.theme.primary, (1 - progress) * 0.5 * options.opacity);
      context.lineWidth = 1;
      context.beginPath();
      context.arc(suction.x, suction.y, 5 + progress * 22, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = css(options.theme.foreground, (1 - progress) * 0.62 * options.opacity);
      context.fillRect(suction.x - 1, suction.y - 1, 2, 2);
      context.restore();
    }
  };

  const draw = (time: number) => {
    const options = getOptions();
    const { theme } = options;
    const signature = `${theme.foreground}|${theme.primary}|${options.phrase}|${options.ringGrowth}|${options.opacity}|${width}|${height}`;
    if (signature !== renderSignature) {
      renderSignature = signature;
      buildRings();
    }
    context.clearRect(0, 0, width, height);
    context.fillStyle = css(theme.background);
    context.fillRect(0, 0, width, height);
    layerContext.clearRect(0, 0, width, height);
    const deltaTime = Math.min(time - (lastTime || time), 100);
    lastTime = time;
    const dissolveTarget = pointer.inside && !reduced ? 1 : 0;
    dissolve = lerp(dissolve, dissolveTarget, 1 - Math.pow(0.78, deltaTime / 16.6));
    if (dissolve < 0.002) dissolve = 0;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const seconds = (time / 1000) * options.speed;

    context.save();
    context.translate(centerX, centerY);
    context.strokeStyle = css(theme["muted-foreground"], 0.22 * options.opacity);
    context.lineWidth = 1;
    context.setLineDash([3, 9]);
    for (const ring of rings) {
      context.beginPath();
      context.arc(0, 0, ring.radius * 1.115, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();

    layerContext.save();
    layerContext.translate(centerX, centerY);
    for (const ring of rings) {
      const base =
        ring.offset + seconds * ring.speed + Math.sin(seconds * 0.11 + ring.wobble) * 0.02;
      layerContext.save();
      layerContext.rotate(base);
      layerContext.drawImage(ring.bitmap, -ring.size / 2, -ring.size / 2, ring.size, ring.size);
      layerContext.restore();
    }
    layerContext.textAlign = "center";
    layerContext.textBaseline = "middle";
    for (const stray of strays) {
      const angle = stray.angle + seconds * stray.speed;
      layerContext.font = `${stray.fontSize}px ${fontFamily}`;
      layerContext.fillStyle = css(theme.primary, stray.alpha);
      layerContext.save();
      layerContext.translate(Math.cos(angle) * stray.radius, Math.sin(angle) * stray.radius);
      layerContext.rotate(angle + Math.PI / 2);
      layerContext.fillText(stray.character, 0, 0);
      layerContext.restore();
    }
    layerContext.restore();

    const ambientWidth = clamp(width * 0.22, 108, 180);
    const radius = clamp(Math.min(width, height) * 0.24, 128, 196) * options.dissolveRadius;
    spawnAmbientDust(time, ambientWidth);
    spawnPointerDust(time, radius);

    if (!reduced) {
      layerContext.save();
      layerContext.globalCompositeOperation = "destination-out";
      const ambientMask = layerContext.createLinearGradient(0, 0, ambientWidth, 0);
      ambientMask.addColorStop(0, "rgba(0,0,0,.98)");
      ambientMask.addColorStop(0.34, "rgba(0,0,0,.88)");
      ambientMask.addColorStop(0.72, "rgba(0,0,0,.36)");
      ambientMask.addColorStop(1, "rgba(0,0,0,0)");
      layerContext.fillStyle = ambientMask;
      layerContext.fillRect(0, 0, ambientWidth, height);
      layerContext.restore();
    }

    if (dissolve > 0.002) {
      const maskedRadius = radius * (0.42 + dissolve * 0.58);
      layerContext.save();
      layerContext.globalCompositeOperation = "destination-out";
      const mask = layerContext.createRadialGradient(
        pointer.x,
        pointer.y,
        maskedRadius * 0.06,
        pointer.x,
        pointer.y,
        maskedRadius,
      );
      mask.addColorStop(0, "rgba(0,0,0,1)");
      mask.addColorStop(0.57, "rgba(0,0,0,.98)");
      mask.addColorStop(0.84, "rgba(0,0,0,.42)");
      mask.addColorStop(1, "rgba(0,0,0,0)");
      layerContext.fillStyle = mask;
      layerContext.beginPath();
      layerContext.arc(pointer.x, pointer.y, maskedRadius, 0, Math.PI * 2);
      layerContext.fill();
      layerContext.restore();
    }

    context.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, width, height);
    updateDust(time, deltaTime);
    if (dissolve > 0.02) {
      context.save();
      context.strokeStyle = css(theme.primary, (0.12 + dissolve * 0.25) * options.opacity);
      context.lineWidth = 1;
      context.setLineDash([2, 6]);
      context.beginPath();
      context.arc(pointer.x, pointer.y, radius * (0.42 + dissolve * 0.58), 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (++stateFrame % 5 === 0) {
      const suctionActive = !reduced && time < suction.until;
      host.dataset.dissolveState = reduced
        ? "reduced"
        : suctionActive
          ? "suction"
          : pointer.inside
            ? "active"
            : dissolve > 0.02
              ? "recovering"
              : "ambient";
      host.dataset.suctionState = suctionActive ? "active" : "idle";
      host.dataset.particles = String(particles.length);
      host.dataset.dissolveStrength = dissolve.toFixed(2);
    }
  };

  const animate = (time: number) => {
    draw(time);
    frame = visible && !document.hidden ? requestAnimationFrame(animate) : 0;
  };
  const locatePointer = (event: PointerEvent) => {
    const bounds = host.getBoundingClientRect();
    pointer.x = clamp(event.clientX - bounds.left, 0, bounds.width);
    pointer.y = clamp(event.clientY - bounds.top, 0, bounds.height);
    pointer.inside = true;
  };
  const onPointerLeave = () => {
    pointer.inside = false;
  };
  const onPointerDown = (event: PointerEvent) => {
    locatePointer(event);
    const options = getOptions();
    suction.x = pointer.x;
    suction.y = pointer.y;
    suction.started = performance.now();
    suction.until = suction.started + options.suctionDuration;
    for (const particle of particles) {
      particle.sucked = true;
      particle.life = Math.max(particle.life, options.suctionDuration + 20);
      particle.maxLife = Math.max(particle.maxLife, options.suctionDuration + 20);
    }
    host.dataset.suctionState = "active";
  };
  const onVisibility = () => {
    if (!document.hidden && visible && !frame) frame = requestAnimationFrame(animate);
  };
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible && !frame && !document.hidden) frame = requestAnimationFrame(animate);
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });

  host.addEventListener("pointerenter", locatePointer);
  host.addEventListener("pointermove", locatePointer);
  host.addEventListener("pointerleave", onPointerLeave);
  host.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("visibilitychange", onVisibility);
  resizeObserver.observe(host);
  intersectionObserver.observe(host);
  resize();
  frame = requestAnimationFrame(animate);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    host.removeEventListener("pointerenter", locatePointer);
    host.removeEventListener("pointermove", locatePointer);
    host.removeEventListener("pointerleave", onPointerLeave);
    host.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

export function GlyphEddy({
  phrase = "MODUS / FORM FOLLOWS MOTION / ",
  speed = 0.8,
  ringGrowth = 1.15,
  opacity = 1,
  dissolveRadius = 1,
  particleAmount = 1,
  suctionDuration = 920,
  hint = "Hover to dissolve · Click to gather",
  className,
}: GlyphEddyProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = {
    theme: theme as Theme,
    phrase,
    speed,
    ringGrowth,
    opacity,
    dissolveRadius,
    particleAmount,
    suctionDuration,
  };
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !theme) return undefined;
    return createGlyphEddyRenderer(
      host,
      canvas,
      () => optionsRef.current,
      Boolean(prefersReducedMotion),
    );
    // Only the first resolution matters here: later theme changes reach the renderer via optionsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, Boolean(theme)]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "absolute inset-0 isolate cursor-crosshair touch-none overflow-hidden [container-type:inline-size]",
        "bg-background font-mono",
        className,
      )}
      data-dissolve-state="ambient"
      data-suction-state="idle"
      data-particles="0"
      data-dissolve-strength="0.00"
    >
      <canvas
        ref={canvasRef}
        aria-label="Interactive glyph eddy"
        className="absolute inset-0 block h-full w-full"
      />
      {hint ? (
        <span className="pointer-events-none absolute bottom-4 left-4 z-[6] font-mono text-[10px] uppercase leading-none tracking-[0.2em] text-muted-foreground">
          {hint}
        </span>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.12] mix-blend-soft-light"
        style={{ backgroundImage: NOISE }}
      />
    </div>
  );
}
