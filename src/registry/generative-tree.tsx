"use client";
// Ported from ThreeUI Community's Generative Tree (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type RGB = { r: number; g: number; b: number };

type Branch = {
  x0: number;
  y0: number;
  angle: number;
  length: number;
  thickness: number;
  depth: number;
  growthProgress: number;
  growthSpeed: number;
  children: Branch[];
  spawned: boolean;
  swayPhase: number;
  swayAmp: number;
  curvature: number;
  colorShift: number;
  hueShift: number;
  parent: Branch | null;
  strokeSeeds: number[];
  tipDots: { ox: number; oy: number; size: number; alpha: number }[];
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  freq: number;
  life: number;
  lifeSpeed: number;
};

const DEFAULT_PALETTE: RGB[] = [
  { r: 78, g: 45, b: 14 },
  { r: 125, g: 76, b: 28 },
  { r: 172, g: 118, b: 50 },
  { r: 205, g: 158, b: 82 },
  { r: 218, g: 182, b: 108 },
  { r: 215, g: 195, b: 135 },
];

export interface GenerativeTreeProps {
  speed?: number;
  size?: number;
  particleAmount?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
  colors?: RGB[];
  className?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (lo: number, hi: number) => Math.random() * (hi - lo) + lo;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
function smoothstep(a: number, b: number, t: number) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function GenerativeTree({
  speed = 1,
  size = 1,
  particleAmount = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor = "#0a0a0a",
  colors = DEFAULT_PALETTE,
  className,
}: GenerativeTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PALETTE = colors.length ? colors : DEFAULT_PALETTE;
    const MAX_DEPTH = 10;
    const GROWTH_SPEED_BASE = 0.006;
    const HOLD_DURATION = 400;
    const FADE_DURATION = 180;
    const WAIT_DURATION = 80;
    const PARTICLE_COUNT = Math.max(0, Math.round(50 * clamp(particleAmount, 0, 2)));
    const _pad = 1 / clamp(size, 0.65, 1.5);
    let W = 0;
    let H = 0;

    const particleSprite = document.createElement("canvas");
    particleSprite.width = 32;
    particleSprite.height = 32;
    const pctx = particleSprite.getContext("2d")!;
    const sg = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    sg.addColorStop(0, "rgba(230, 200, 155, 1)");
    sg.addColorStop(0.3, "rgba(215, 175, 130, 0.5)");
    sg.addColorStop(1, "rgba(200, 150, 100, 0)");
    pctx.fillStyle = sg;
    pctx.fillRect(0, 0, 32, 32);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.max(1, Math.round(W * dpr));
      canvas!.height = Math.max(1, Math.round(H * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let particles: Particle[] = [];
    function createParticle(fullRandom: boolean): Particle {
      return {
        x: rand(W * 0.15, W * 0.85),
        y: fullRandom ? rand(H * 0.1, H * 0.9) : rand(H * 0.5, H),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.35, -0.06),
        size: rand(0.6, 2.2),
        alpha: rand(0.04, 0.2),
        phase: rand(0, Math.PI * 2),
        freq: rand(0.0004, 0.0015),
        life: fullRandom ? rand(0, 1) : 0,
        lifeSpeed: rand(0.0006, 0.0025),
      };
    }
    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle(true));
    }
    function updateParticles(time: number) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(time * p.freq + p.phase) * 0.25;
        p.y += p.vy;
        p.life += p.lifeSpeed;
        if (p.life > 1 || p.y < -10 || p.x < -10 || p.x > W + 10) {
          particles[i] = createParticle(false);
        }
      }
    }
    function drawParticles(globalAlpha: number) {
      for (const p of particles) {
        const lifeFade = p.life < 0.15 ? p.life / 0.15 : p.life > 0.8 ? (1 - p.life) / 0.2 : 1;
        const a = p.alpha * lifeFade * globalAlpha;
        if (a < 0.004) continue;
        const s = p.size * 3;
        ctx!.globalAlpha = a;
        ctx!.drawImage(particleSprite, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx!.globalAlpha = 1;
    }

    function colorForDepth(depth: number, hueShift: number): RGB {
      const t = depth / MAX_DEPTH;
      const idx = t * (PALETTE.length - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(PALETTE.length - 1, i0 + 1);
      const f = idx - i0;
      let r = lerp(PALETTE[i0].r, PALETTE[i1].r, f);
      let g = lerp(PALETTE[i0].g, PALETTE[i1].g, f);
      let b = lerp(PALETTE[i0].b, PALETTE[i1].b, f);
      const strength = t * t * 22;
      r += hueShift * strength * 1.0;
      g += hueShift * strength * -0.5;
      b += hueShift * strength * -0.15;
      return { r, g, b };
    }

    let allBranches: Branch[] = [];
    let treeAlpha = 1;
    let treeState: "growing" | "holding" | "fading" | "waiting" = "growing";
    let holdTimer = 0;
    let fadeTimer = 0;
    let waitTimer = 0;
    let mouseActive = false;
    let windForce = 0;
    let shakeAmount = 0;

    const seeds = () => [rand(-1, 1), rand(-1, 1), rand(-1, 1), rand(-1, 1), rand(-1, 1)];

    function createTree() {
      allBranches = [];
      const trunkLen = (H * rand(0.23, 0.28)) / _pad;
      const trunkThick = Math.max(8, W * 0.015) / _pad;
      const trunkAngle = -Math.PI / 2 + rand(-0.05, 0.05);
      const approxTreeH = trunkLen * 3.5;
      const baseY = _pad > 1 ? (H + approxTreeH) / 2 : H + trunkThick * 0.5;
      allBranches.push({
        x0: W / 2 + rand(-W * 0.03, W * 0.03),
        y0: baseY,
        angle: trunkAngle,
        length: trunkLen,
        thickness: trunkThick,
        depth: 0,
        growthProgress: 0,
        growthSpeed: GROWTH_SPEED_BASE * rand(0.9, 1.1),
        children: [],
        spawned: false,
        swayPhase: rand(0, Math.PI * 2),
        swayAmp: 0.0008,
        curvature: rand(-0.015, 0.015),
        colorShift: rand(-8, 8),
        hueShift: 0,
        parent: null,
        strokeSeeds: seeds(),
        tipDots: [],
      });
      treeState = "growing";
      holdTimer = fadeTimer = waitTimer = 0;
      treeAlpha = 1;
      initParticles();
    }

    function spawnChildren(parent: Branch) {
      if (parent.depth >= MAX_DEPTH) return;
      let numChildren: number;
      if (parent.depth < 1) numChildren = 2 + (Math.random() < 0.35 ? 1 : 0);
      else if (parent.depth < 3) numChildren = 2 + (Math.random() < 0.4 ? 1 : 0);
      else numChildren = Math.random() < 0.25 ? 3 : 2;
      const pruneChance =
        parent.depth <= 3 ? 0 : parent.depth <= 5 ? 0.1 : parent.depth <= 7 ? 0.22 : 0.35;
      if (Math.random() < pruneChance) numChildren = Math.max(1, numChildren - 1);
      const spread = parent.depth < 2 ? rand(0.32, 0.48) : rand(0.38, 0.6);

      for (let i = 0; i < numChildren; i++) {
        let angleOffset: number;
        if (numChildren === 1) angleOffset = rand(-0.25, 0.25);
        else if (numChildren === 2) angleOffset = (i === 0 ? -1 : 1) * rand(0.18, spread);
        else angleOffset = (i - 1) * spread + rand(-0.1, 0.1);

        const ep = getBranchEnd(parent, 1, 0);
        const tipDots: Branch["tipDots"] = [];
        const childDepth = parent.depth + 1;
        if (childDepth >= MAX_DEPTH) {
          const count = Math.random() < 0.4 ? 2 : 1;
          for (let d = 0; d < count; d++) {
            tipDots.push({
              ox: rand(-2, 2),
              oy: rand(-2, 2),
              size: rand(0.8, 1.6),
              alpha: rand(0.08, 0.2),
            });
          }
        }
        const child: Branch = {
          x0: ep.x,
          y0: ep.y,
          angle: parent.angle + angleOffset,
          length: parent.length * rand(0.58, 0.76),
          thickness: Math.max(0.4, parent.thickness * rand(0.48, 0.67)),
          depth: childDepth,
          growthProgress: 0,
          growthSpeed: GROWTH_SPEED_BASE * rand(1.0, 1.5) * (1 + parent.depth * 0.1),
          children: [],
          spawned: false,
          swayPhase: rand(0, Math.PI * 2),
          swayAmp: 0.0018 * (parent.depth + 1) * rand(0.7, 1.3),
          curvature: rand(-0.04, 0.04) * (1 + parent.depth * 0.12),
          colorShift: rand(-12, 12),
          hueShift: Math.max(-1, Math.min(1, parent.hueShift + rand(-0.35, 0.35))),
          parent,
          strokeSeeds: seeds(),
          tipDots,
        };
        parent.children.push(child);
        allBranches.push(child);
      }
    }

    function getSwayAngle(branch: Branch, time: number) {
      let total = 0;
      let b: Branch | null = branch;
      let depth = 0;
      while (b) {
        const a = b.swayAmp;
        total += Math.sin(time * 0.0005 + b.swayPhase) * a;
        total += Math.sin(time * 0.0003 + b.swayPhase * 1.7) * a * 0.6;
        total += Math.sin(time * 0.00012 + b.swayPhase * 0.4) * a * 0.35;
        depth++;
        b = b.parent;
      }
      if (mouseActive) total += windForce * 0.04 * depth;
      if (shakeAmount > 0.01) {
        total += Math.sin(time * 0.015 + branch.swayPhase * 3) * shakeAmount * 0.06 * depth;
      }
      return total;
    }

    function getBranchEnd(branch: Branch, progress: number, time: number) {
      const angle = branch.angle + getSwayAngle(branch, time);
      const len = branch.length * progress;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      const curveOff = branch.curvature * len;
      return {
        x: branch.x0 + Math.cos(angle) * len + perpX * curveOff,
        y: branch.y0 + Math.sin(angle) * len + perpY * curveOff,
      };
    }

    function recalcPositions(time: number) {
      for (const b of allBranches) {
        if (b.parent) {
          const pe = getBranchEnd(b.parent, 1, time);
          b.x0 = pe.x;
          b.y0 = pe.y;
        }
      }
    }

    function updateBranches(step: number) {
      let allDone = true;
      for (const b of allBranches) {
        if (b.growthProgress < 1) {
          b.growthProgress = Math.min(1, b.growthProgress + b.growthSpeed * step);
          allDone = false;
        }
        if (b.growthProgress >= 0.65 && !b.spawned) {
          b.spawned = true;
          spawnChildren(b);
        }
      }
      return allDone;
    }

    function drawBranch(b: Branch, time: number) {
      if (b.growthProgress <= 0) return;
      const c = ctx!;
      const angle = b.angle + getSwayAngle(b, time);
      const progress = easeOutCubic(b.growthProgress);
      const len = b.length * progress;
      const x1 = b.x0;
      const y1 = b.y0;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      const curveOff = b.curvature * len * 1.4;
      const cpx1 = x1 + Math.cos(angle) * len * 0.33 + perpX * curveOff * 0.4;
      const cpy1 = y1 + Math.sin(angle) * len * 0.33 + perpY * curveOff * 0.4;
      const cpx2 = x1 + Math.cos(angle) * len * 0.66 + perpX * curveOff * 0.85;
      const cpy2 = y1 + Math.sin(angle) * len * 0.66 + perpY * curveOff * 0.85;
      const x2 = x1 + Math.cos(angle) * len + perpX * curveOff * 0.7;
      const y2 = y1 + Math.sin(angle) * len + perpY * curveOff * 0.7;

      const col = colorForDepth(b.depth, b.hueShift);
      const depthT = b.depth / MAX_DEPTH;
      const baseAlpha =
        b.depth <= 1
          ? 0.95
          : b.depth <= 5
            ? lerp(0.92, 0.7, depthT)
            : lerp(0.7, 0.35, (depthT - 0.5) * 2);
      const strokeCount = b.depth < 3 ? 5 : b.depth < 6 ? 3 : 2;
      const thickBase = b.thickness;
      const thickTaper = lerp(thickBase, thickBase * 0.3, progress);

      for (let s = 0; s < strokeCount; s++) {
        const seed = b.strokeSeeds[s] || 0;
        const normalizedS = strokeCount > 1 ? s / (strokeCount - 1) - 0.5 : 0;
        const offsetAmt = normalizedS * thickBase * 0.35 + seed * thickBase * 0.08;
        const ox = perpX * offsetAmt;
        const oy = perpY * offsetAmt;
        const shift = normalizedS * 22 + b.colorShift * 0.3;
        const r = Math.max(0, Math.min(255, col.r + shift));
        const g = Math.max(0, Math.min(255, col.g + shift * 0.65));
        const bb = Math.max(0, Math.min(255, col.b + shift * 0.4));
        const isCore = s === Math.floor(strokeCount / 2);
        const alpha = baseAlpha * (isCore ? 1.0 : 0.5);
        const thick = thickTaper * (isCore ? 1.0 : lerp(0.65, 0.45, Math.abs(normalizedS)));
        c.beginPath();
        c.moveTo(x1 + ox, y1 + oy);
        c.bezierCurveTo(cpx1 + ox, cpy1 + oy, cpx2 + ox, cpy2 + oy, x2 + ox, y2 + oy);
        c.strokeStyle = `rgba(${r | 0}, ${g | 0}, ${bb | 0}, ${alpha})`;
        c.lineWidth = thick;
        c.lineCap = "round";
        c.stroke();
      }

      if (b.depth >= 4 && b.depth < MAX_DEPTH - 1 && b.growthProgress > 0.8) {
        const glowAlpha = smoothstep(0.8, 1.0, b.growthProgress) * 0.06 * (b.depth / MAX_DEPTH);
        const glowR = Math.max(4, thickBase * 2);
        const grd = c.createRadialGradient(x2, y2, 0, x2, y2, glowR);
        grd.addColorStop(
          0,
          `rgba(${Math.min(255, col.r + 30) | 0}, ${Math.min(255, col.g + 20) | 0}, ${Math.min(255, col.b + 15) | 0}, ${glowAlpha})`,
        );
        grd.addColorStop(
          0.5,
          `rgba(${col.r | 0}, ${col.g | 0}, ${col.b | 0}, ${glowAlpha * 0.25})`,
        );
        grd.addColorStop(1, `rgba(${col.r | 0}, ${col.g | 0}, ${col.b | 0}, 0)`);
        c.fillStyle = grd;
        c.beginPath();
        c.arc(x2, y2, glowR, 0, Math.PI * 2);
        c.fill();
      }

      if (b.tipDots.length > 0 && b.growthProgress > 0.92) {
        const tipFade = smoothstep(0.92, 1.0, b.growthProgress);
        const tr = Math.min(255, col.r * 1.3 + 30);
        const tg2 = Math.min(255, col.g * 1.3 + 25);
        const tb = Math.min(255, col.b * 1.2 + 20);
        for (const dot of b.tipDots) {
          const dx = x2 + dot.ox;
          const dy = y2 + dot.oy;
          const da = tipFade * dot.alpha;
          const ds = dot.size;
          const tg = c.createRadialGradient(dx, dy, 0, dx, dy, ds * 2);
          tg.addColorStop(0, `rgba(${tr | 0}, ${tg2 | 0}, ${tb | 0}, ${da * 0.6})`);
          tg.addColorStop(0.5, `rgba(${col.r | 0}, ${col.g | 0}, ${col.b | 0}, ${da * 0.15})`);
          tg.addColorStop(1, `rgba(${col.r | 0}, ${col.g | 0}, ${col.b | 0}, 0)`);
          c.fillStyle = tg;
          c.beginPath();
          c.arc(dx, dy, ds * 2, 0, Math.PI * 2);
          c.fill();
        }
      }
    }

    function drawScene(time: number, animateParticles: boolean) {
      const c = ctx!;
      c.clearRect(0, 0, W, H);
      c.fillStyle = backgroundColor;
      c.fillRect(0, 0, W, H);

      if (treeAlpha > 0.05) {
        const cx = W / 2;
        const cy = H * 0.38;
        const canopyGlow = c.createRadialGradient(cx, cy, 0, cx, cy, H * 0.42);
        canopyGlow.addColorStop(0, `rgba(60, 36, 12, ${0.2 * treeAlpha})`);
        canopyGlow.addColorStop(0.5, `rgba(35, 20, 8, ${0.08 * treeAlpha})`);
        canopyGlow.addColorStop(1, "rgba(10, 10, 10, 0)");
        c.fillStyle = canopyGlow;
        c.fillRect(0, 0, W, H);

        const groundGrad = c.createRadialGradient(W / 2, H, 0, W / 2, H, H * 0.3);
        groundGrad.addColorStop(0, `rgba(70, 42, 12, ${0.1 * treeAlpha})`);
        groundGrad.addColorStop(1, "rgba(10, 10, 10, 0)");
        c.fillStyle = groundGrad;
        c.fillRect(0, H * 0.55, W, H * 0.45);
      }

      recalcPositions(time);
      c.save();
      c.globalAlpha = treeAlpha;
      for (const b of allBranches) drawBranch(b, time);
      c.restore();

      if (animateParticles) updateParticles(time);
      c.save();
      drawParticles(treeAlpha);
      c.restore();

      const vig = c.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.78);
      vig.addColorStop(0, "rgba(10, 10, 10, 0)");
      vig.addColorStop(1, "rgba(4, 4, 4, 0.3)");
      c.fillStyle = vig;
      c.fillRect(0, 0, W, H);
    }

    let clock = 0;
    let last: number | null = null;
    function frame(realTime: number) {
      const s = speedRef.current;
      if (last !== null) clock += (realTime - last) * s;
      last = realTime;
      const time = clock;

      if (shakeAmount > 0.01) shakeAmount *= 0.95;
      else shakeAmount = 0;

      switch (treeState) {
        case "growing": {
          const done = updateBranches(s);
          drawScene(time, true);
          if (done) {
            treeState = "holding";
            holdTimer = 0;
          }
          break;
        }
        case "holding": {
          drawScene(time, true);
          holdTimer += s;
          if (holdTimer >= HOLD_DURATION) {
            treeState = "fading";
            fadeTimer = 0;
          }
          break;
        }
        case "fading": {
          fadeTimer += s;
          treeAlpha = Math.max(0, 1 - fadeTimer / FADE_DURATION);
          drawScene(time, true);
          if (fadeTimer >= FADE_DURATION) {
            treeState = "waiting";
            waitTimer = 0;
          }
          break;
        }
        case "waiting": {
          ctx!.clearRect(0, 0, W, H);
          ctx!.fillStyle = backgroundColor;
          ctx!.fillRect(0, 0, W, H);
          waitTimer += s;
          if (waitTimer >= WAIT_DURATION) createTree();
          break;
        }
      }
    }

    function renderStill() {
      while (!updateBranches(1)) {
        /* grow the full tree instantly */
      }
      drawScene(0, false);
    }

    resize();
    createTree();

    let raf = 0;
    let inView = true;
    const loop = (t: number) => {
      frame(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || prefersReducedMotion || !inView || document.hidden) return;
      last = null;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    if (prefersReducedMotion) renderStill();
    else start();

    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) {
        createTree();
        renderStill();
      }
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const toLocalX = (clientX: number) => clientX - canvas.getBoundingClientRect().left;
    const onMove = (e: MouseEvent) => {
      mouseActive = true;
      windForce = (toLocalX(e.clientX) - W / 2) / (W / 2);
    };
    const onLeave = () => {
      mouseActive = false;
      windForce = 0;
    };
    const onClick = () => {
      shakeAmount = 1.0;
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      mouseActive = true;
      windForce = (toLocalX(e.touches[0].clientX) - W / 2) / (W / 2);
      shakeAmount = 1.0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      windForce = (toLocalX(e.touches[0].clientX) - W / 2) / (W / 2);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onLeave);
    };
  }, [size, particleAmount, backgroundColor, colors, prefersReducedMotion]);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full"
        style={{
          opacity: clamp(opacity, 0.05, 1),
          filter: `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.8)})`,
        }}
      />
    </div>
  );
}
