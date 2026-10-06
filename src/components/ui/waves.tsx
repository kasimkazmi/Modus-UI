"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

class Noise {
  p: Uint8Array;
  perm: Uint8Array;
  gradP: Float64Array;

  constructor(seed = 0) {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.gradP = new Float64Array(512);
    this.seed(seed);
  }

  seed(seed: number) {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;
    for (let i = 0; i < 256; i++) {
      let v = i & 1 ? seed & 255 : (seed >> 8) & 255;
      this.p[i] = v ^ Math.floor(Math.random() * 256);
      this.perm[i] = this.perm[i + 256] = this.p[i];
      this.gradP[i] = this.gradP[i + 256] = (this.p[i] % 12) - 6; 
    }
  }

  fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a: number, b: number, t: number) {
    return (1 - t) * a + t * b;
  }

  perlin2(x: number, y: number) {
    let X = Math.floor(x), Y = Math.floor(y);
    x -= X; y -= Y;
    X &= 255; Y &= 255;
    
    // Fast dot product
    const dot2 = (hash: number, x: number, y: number) => {
      // Simplistic gradient fallback
      return x * (hash % 12 - 6) + y * ((hash >> 1) % 12 - 6);
    };

    const n00 = dot2(this.perm[X + this.perm[Y]], x, y);
    const n01 = dot2(this.perm[X + this.perm[Y + 1]], x, y - 1);
    const n10 = dot2(this.perm[X + 1 + this.perm[Y]], x - 1, y);
    const n11 = dot2(this.perm[X + 1 + this.perm[Y + 1]], x - 1, y - 1);

    const u = this.fade(x);
    return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
  }
}

interface WavesProps {
  lineColor?: string;
  backgroundColor?: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  xGap?: number;
  yGap?: number;
  friction?: number;
  tension?: number;
  maxCursorMove?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Waves({
  lineColor = "rgba(0, 0, 0, 0.2)",
  backgroundColor = "transparent",
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  style = {},
  className,
}: WavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const boundingRef = useRef({ width: 0, height: 0, left: 0, top: 0 });
  const noiseRef = useRef(new Noise(Math.random()));
  const linesRef = useRef<any[]>([]);
  const mouseRef = useRef({
    x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false
  });

  const configRef = useRef({
    lineColor, waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxCursorMove, xGap, yGap
  });
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    configRef.current = { lineColor, waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxCursorMove, xGap, yGap };
  }, [lineColor, waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxCursorMove, xGap, yGap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    ctxRef.current = canvas.getContext("2d");

    function setSize() {
      if (!container || !canvas) return;
      boundingRef.current = container.getBoundingClientRect();
      canvas.width = boundingRef.current.width;
      canvas.height = boundingRef.current.height;
    }

    function setLines() {
      const { width, height } = boundingRef.current;
      linesRef.current = [];
      const oWidth = width + 200, oHeight = height + 30;
      const { xGap, yGap } = configRef.current;
      const totalLines = Math.ceil(oWidth / xGap);
      const totalPoints = Math.ceil(oHeight / yGap);
      const xStart = (width - xGap * totalLines) / 2;
      const yStart = (height - yGap * totalPoints) / 2;
      for (let i = 0; i <= totalLines; i++) {
        const pts = [];
        for (let j = 0; j <= totalPoints; j++) {
          pts.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 }
          });
        }
        linesRef.current.push(pts);
      }
    }

    function movePoints(time: number) {
      const lines = linesRef.current, mouse = mouseRef.current, noise = noiseRef.current;
      const { waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxCursorMove } = configRef.current;
      lines.forEach((pts) => {
        pts.forEach((p: any) => {
          const move = noise.perlin2((p.x + time * waveSpeedX) * 0.002, (p.y + time * waveSpeedY) * 0.0015) * 12;
          p.wave.x = Math.cos(move) * waveAmpX;
          p.wave.y = Math.sin(move) * waveAmpY;

          const dx = p.x - mouse.sx, dy = p.y - mouse.sy;
          const dist = Math.hypot(dx, dy), l = Math.max(175, mouse.vs);
          if (dist < l) {
            const s = 1 - dist / l;
            const f = Math.cos(dist * 0.001) * s;
            p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00065;
            p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00065;
          }

          p.cursor.vx += (0 - p.cursor.x) * tension;
          p.cursor.vy += (0 - p.cursor.y) * tension;
          p.cursor.vx *= friction;
          p.cursor.vy *= friction;
          p.cursor.x += p.cursor.vx * 2;
          p.cursor.y += p.cursor.vy * 2;
          p.cursor.x = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.x));
          p.cursor.y = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.y));
        });
      });
    }

    function moved(point: any, withCursor = true) {
      const x = point.x + point.wave.x + (withCursor ? point.cursor.x : 0);
      const y = point.y + point.wave.y + (withCursor ? point.cursor.y : 0);
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    }

    function drawLines() {
      const { width, height } = boundingRef.current;
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = configRef.current.lineColor;
      linesRef.current.forEach((points) => {
        let p1 = moved(points[0], false);
        ctx.moveTo(p1.x, p1.y);
        points.forEach((p: any, idx: number) => {
          const isLast = idx === points.length - 1;
          p1 = moved(p, !isLast);
          const p2 = moved(points[idx + 1] || points[points.length - 1], !isLast);
          ctx.lineTo(p1.x, p1.y);
          if (isLast) ctx.moveTo(p2.x, p2.y);
        });
      });
      ctx.stroke();
    }

    function tick(t: number) {
      const mouse = mouseRef.current;
      mouse.sx += (mouse.x - mouse.sx) * 0.1;
      mouse.sy += (mouse.y - mouse.sy) * 0.1;
      const dx = mouse.x - mouse.lx, dy = mouse.y - mouse.ly;
      const d = Math.hypot(dx, dy);
      mouse.v = d;
      mouse.vs += (d - mouse.vs) * 0.1;
      mouse.vs = Math.min(100, mouse.vs);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);
      if (container) {
        container.style.setProperty("--x", `${mouse.sx}px`);
        container.style.setProperty("--y", `${mouse.sy}px`);
      }

      movePoints(t);
      drawLines();
      frameIdRef.current = requestAnimationFrame(tick);
    }

    function onResize() {
      setSize();
      setLines();
    }
    function onMouseMove(e: MouseEvent) {
      updateMouse(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      updateMouse(touch.clientX, touch.clientY);
    }
    function updateMouse(x: number, y: number) {
      const mouse = mouseRef.current, b = boundingRef.current;
      mouse.x = x - b.left;
      mouse.y = y - b.top;
      if (!mouse.set) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.set = true;
      }
    }

    setSize();
    setLines();
    frameIdRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ backgroundColor, ...style }}
      className={cn("absolute top-0 left-0 w-full h-full overflow-hidden", className)}
    >
      <div
        className="absolute top-0 left-0 bg-[#37322F]/10 rounded-full w-2 h-2 pointer-events-none"
        style={{
          transform: "translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)",
          willChange: "transform",
        }}
      />
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
}
