"use client";
// Ported from ThreeUI Community's Semantic Bloom (MIT, © 2026 Meng To).

import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WordSwarmProps {
  text?: string;
  size?: number;
  opacity?: number;
  backgroundColor?: string;
  textColor?: string;
  activeTextColor?: string;
  particleColor?: string;
  connectionColor?: string;
  className?: string;
}

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")";

const config = {
  particleCount: 50,
  baseRadius: 15,
  viscosity: 0.08,
  wanderStrength: 0.5,
  connectionDist: 150,
  repelDist: 50,
  textAttractionRadius: 200,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface WordCoord {
  x: number;
  y: number;
  element: HTMLSpanElement;
  active: boolean;
}

export function WordSwarm({
  text = "Words gather meaning",
  size = 1,
  opacity = 1,
  backgroundColor,
  textColor,
  activeTextColor,
  particleColor,
  connectionColor,
  className,
}: WordSwarmProps) {
  const prefersReducedMotion = useReducedMotion();
  const filterId = `liquid-filter-${useId().replace(/:/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const surface = backgroundColor ?? "hsl(var(--background))";
  const resting = textColor ?? "hsl(var(--muted-foreground) / 0.55)";
  const active = activeTextColor ?? "hsl(var(--foreground))";
  const particleCss = particleColor ?? "hsl(var(--primary) / 0.85)";
  const connectionCss = connectionColor ?? "hsl(var(--primary) / 0.22)";
  const content = (text.trim() ? text : "Words gather meaning").slice(0, 72);
  const sizeFactor = clamp(size, 0.55, 1.6);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const editor = editorRef.current;
    if (!root || !canvas || !editor) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const mouse = { x: -1000, y: -1000 };
    let wordCoordinates: WordCoord[] = [];
    // canvas cannot read CSS variables, so resolve the token colours through a probe element
    let particle = "";
    let connection = "";
    const probe = document.createElement("span");
    probe.style.display = "none";
    root.appendChild(probe);
    const resolve = (c: string) => {
      probe.style.color = c;
      return getComputedStyle(probe).color;
    };
    const readTheme = () => {
      particle = resolve(particleCss);
      connection = resolve(connectionCss);
    };
    readTheme();
    const mo = new MutationObserver(readTheme);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    // split the text into word spans once
    editor.textContent = "";
    content.split(/(\s+)/).forEach((word) => {
      const span = document.createElement("span");
      span.textContent = word;
      if (word.trim().length > 0) {
        span.style.display = "inline-block";
        span.style.position = "relative";
        span.style.zIndex = "2";
        span.style.color = resting;
        span.style.transition = "color 1s ease";
        span.dataset.word = "true";
      }
      editor.appendChild(span);
    });

    const setActive = (el: HTMLSpanElement, on: boolean) => {
      el.style.color = on ? active : resting;
      el.style.fontStyle = on ? "italic" : "normal";
    };

    const layoutText = () => {
      const fontSize =
        width <= 640
          ? clamp(width * 0.14 * sizeFactor, 40, 96)
          : clamp(width * 0.085 * sizeFactor, 52, 132);
      editor.style.fontSize = `${fontSize}px`;
      editor.parentElement!.style.padding =
        width <= 640 ? "1.5rem" : `${clamp(width * 0.08, 32, 128)}px`;
    };

    const updateWordCoords = () => {
      const rootRect = root.getBoundingClientRect();
      wordCoordinates = [];
      editor.querySelectorAll<HTMLSpanElement>("[data-word]").forEach((span) => {
        const rect = span.getBoundingClientRect();
        setActive(span, false);
        wordCoordinates.push({
          x: rect.left - rootRect.left + rect.width / 2,
          y: rect.top - rootRect.top + rect.height / 2,
          element: span,
          active: false,
        });
      });
    };

    const resize = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      canvas.width = width;
      canvas.height = height;
      layoutText();
      updateWordCoords();
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      angle: number;
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = config.baseRadius * (0.8 + Math.random() * 0.5);
        this.angle = Math.random() * Math.PI * 2;
      }

      update() {
        this.angle += (Math.random() - 0.5) * 0.2;
        this.vx += Math.cos(this.angle) * config.wanderStrength;
        this.vy += Math.sin(this.angle) * config.wanderStrength;

        this.vx *= 0.95;
        this.vy *= 0.95;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 400) {
          this.vx += dx * 0.002;
          this.vy += dy * 0.002;
        }

        let closestDist = Infinity;
        let closestWord: WordCoord | null = null;
        for (const word of wordCoordinates) {
          const wdx = word.x - this.x;
          const wdy = word.y - this.y;
          const wDist = Math.sqrt(wdx * wdx + wdy * wdy);
          if (wDist < closestDist) {
            closestDist = wDist;
            closestWord = word;
          }
        }

        if (closestWord && closestDist < config.textAttractionRadius) {
          this.vx += (closestWord.x - this.x) * 0.01;
          this.vy += (closestWord.y - this.y) * 0.01;

          if (closestDist < 30) {
            if (!closestWord.active) {
              setActive(closestWord.element, true);
              closestWord.active = true;
            }
          } else if (closestDist > 60) {
            if (closestWord.active) {
              setActive(closestWord.element, false);
              closestWord.active = false;
            }
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fillStyle = particle;
        ctx!.fill();
      }
    }

    resize();
    const particles: Particle[] = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(
        new Particle(
          width / 2 + (Math.random() - 0.5) * 100,
          height / 2 + (Math.random() - 0.5) * 100,
        ),
      );
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = connection;
      ctx.lineWidth = 2;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          if (Math.sqrt(dx * dx + dy * dy) < config.connectionDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    };

    let raf = 0;
    let onScreen = true;
    const frame = () => {
      render();
      raf = requestAnimationFrame(frame);
    };
    const update = () => {
      const run = onScreen && !document.hidden && !prefersReducedMotion;
      if (run && !raf) raf = requestAnimationFrame(frame);
      else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) render();
    });
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      update();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", update);
    const settle = window.setTimeout(updateWordCoords, 100);
    render();
    update();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      probe.remove();
      window.clearTimeout(settle);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", update);
      ro.disconnect();
      io.disconnect();
    };
  }, [content, sizeFactor, resting, active, particleCss, connectionCss, prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      className={cn("absolute inset-0 cursor-none overflow-hidden font-serif", className)}
      style={{
        background: surface,
      }}
    >
      <div className="absolute inset-0" style={{ opacity: clamp(opacity, 0.1, 1) }}>
        <svg className="absolute h-0 w-0" aria-hidden>
          <defs>
            <filter id={filterId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                result="goo"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.01"
                numOctaves={3}
                result="noise"
              />
              <feDisplacementMap
                in="goo"
                in2="noise"
                scale="20"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feComposite in="SourceGraphic" operator="atop" />
            </filter>
          </defs>
        </svg>

        <div
          className="pointer-events-none absolute inset-0 z-[3] opacity-60 mix-blend-multiply dark:mix-blend-screen"
          style={{ backgroundImage: NOISE }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-90"
          style={{
            filter: `url(#${filterId}) contrast(150%) brightness(100%)`,
          }}
        />

        <div className="relative z-[2] box-border flex h-full w-full items-center justify-center">
          <div
            ref={editorRef}
            aria-label={content}
            className="relative flex w-full items-center justify-center overflow-visible whitespace-pre-wrap text-center font-normal leading-[0.95] tracking-[-0.02em]"
            style={{ color: resting }}
          />
        </div>
      </div>
    </div>
  );
}
