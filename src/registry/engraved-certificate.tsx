"use client";
// Ported from ThreeUI Community's Engraved Certificate (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EngravedCertificateProps {
  /** Small mono label above the medal. */
  label?: string;
  /** Headline before the cam letter. */
  title?: string;
  /** Caption before the cam letter. */
  caption?: string;
  /** Engraving ink colour (hex). */
  inkColor?: string;
  /** Certificate paper colour. */
  paperColor?: string;
  /** Scene background behind the certificate. */
  backgroundColor?: string;
  /** Milliseconds between cam changes. */
  cycleInterval?: number;
  className?: string;
}

const TAU = Math.PI * 2;
const BARS = [
  { id: "A", m: 7, m2: 13, m3: 9 },
  { id: "B", m: 9, m2: 15, m3: 12 },
  { id: "C", m: 11, m2: 19, m3: 14 },
  { id: "D", m: 15, m2: 23, m3: 18 },
];

type Pt = [number, number];
type RailPt = [number, number, number, number];

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function circleOutline(cx: number, cy: number, r: number, samples: number) {
  const pts: Pt[] = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const th = (i / samples) * TAU;
    pts[i] = [cx + Math.cos(th) * r, cy + Math.sin(th) * r];
  }
  return pts;
}

function rectOutline(x: number, y: number, w: number, h: number, r: number) {
  const pts: Pt[] = [];
  const push = (px: number, py: number) => {
    const l = pts[pts.length - 1];
    if (l && Math.abs(l[0] - px) < 1e-4 && Math.abs(l[1] - py) < 1e-4) return;
    pts.push([px, py]);
  };
  const seg = (x0: number, y0: number, xe: number, ye: number) => {
    const n = Math.max(2, Math.round(Math.hypot(xe - x0, ye - y0) / 4));
    for (let i = 0; i <= n; i++) push(x0 + ((xe - x0) * i) / n, y0 + ((ye - y0) * i) / n);
  };
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    const n = Math.max(7, Math.round((Math.abs(a1 - a0) * r) / 1.6));
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  };
  const x1 = x + w;
  const y1 = y + h;
  const HP = Math.PI / 2;
  seg(x + r, y, x1 - r, y);
  arc(x1 - r, y + r, -HP, 0);
  seg(x1, y + r, x1, y1 - r);
  arc(x1 - r, y1 - r, 0, HP);
  seg(x1 - r, y1, x + r, y1);
  arc(x + r, y1 - r, HP, Math.PI);
  seg(x, y1 - r, x, y + r);
  arc(x + r, y + r, Math.PI, Math.PI * 1.5);
  return pts;
}

function rail(pts: Pt[], M: number) {
  const nP = pts.length;
  const cum = new Float64Array(nP + 1);
  for (let i = 1; i <= nP; i++) {
    const p = pts[i % nP];
    const q = pts[i - 1];
    cum[i] = cum[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]);
  }
  const L = cum[nP];
  const out: RailPt[] = new Array(M);
  let j = 0;
  for (let i = 0; i < M; i++) {
    const target = (i / M) * L;
    while (j < nP - 1 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const u = (target - cum[j]) / seg;
    const p = pts[j];
    const q = pts[(j + 1) % nP];
    out[i] = [
      p[0] + (q[0] - p[0]) * u,
      p[1] + (q[1] - p[1]) * u,
      (q[1] - p[1]) / seg,
      -(q[0] - p[0]) / seg,
    ];
  }
  return out;
}

function rand32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function EngravedCertificate({
  label = "Kinetic Lathe",
  title = "Matrix 92 · Cam",
  caption = "Primary cam ·",
  inkColor = "#1f3a30",
  paperColor = "#f5efdf",
  backgroundColor = "#ded6c2",
  cycleInterval = 4200,
  className,
}: EngravedCertificateProps) {
  const prefersReducedMotion = useReducedMotion();
  const certRef = useRef<HTMLElement>(null);
  const medalRef = useRef<HTMLElement>(null);
  const plateRef = useRef<HTMLCanvasElement>(null);
  const roseRef = useRef<HTMLCanvasElement>(null);
  const driftRef = useRef<HTMLCanvasElement>(null);
  const barNameRef = useRef<HTMLElement>(null);
  const capBarRef = useRef<HTMLSpanElement>(null);
  const inkRgb = hexToRgb(inkColor);

  useEffect(() => {
    const cert = certRef.current;
    const medal = medalRef.current;
    const cPlate = plateRef.current;
    const cRose = roseRef.current;
    const cDrift = driftRef.current;
    if (!cert || !medal || !cPlate || !cRose || !cDrift) return;
    const ctxP = cPlate.getContext("2d");
    const ctxR = cRose.getContext("2d");
    const ctxD = cDrift.getContext("2d");
    if (!ctxP || !ctxR || !ctxD) return;
    const reduce = !!prefersReducedMotion;
    const ink = (a: number) => `rgba(${inkRgb},${a})`;
    let sel = 2;

    const fit = (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
    ) => {
      const S = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(2, Math.round(w * S));
      const H = Math.max(2, Math.round(h * S));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, w, h);
    };

    const band = (
      ctx: CanvasRenderingContext2D,
      r: RailPt[],
      o: { amp: number; waves: number; K: number; alpha: number; lw: number; phase?: number },
    ) => {
      const M = r.length;
      ctx.lineWidth = o.lw;
      ctx.strokeStyle = ink(o.alpha);
      ctx.beginPath();
      for (let k = 0; k < o.K; k++) {
        const ph = (o.phase || 0) + (k / o.K) * TAU;
        for (let i = 0; i <= M; i++) {
          const p = r[i % M];
          const u = (i % M) / M;
          const off = o.amp * Math.sin(o.waves * u * TAU + ph);
          const x = p[0] + p[2] * off;
          const y = p[1] + p[3] * off;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    };

    const railLine = (
      ctx: CanvasRenderingContext2D,
      r: RailPt[],
      off: number,
      alpha: number,
      lw: number,
    ) => {
      const M = r.length;
      ctx.lineWidth = lw;
      ctx.strokeStyle = ink(alpha);
      ctx.beginPath();
      for (let i = 0; i <= M; i++) {
        const p = r[i % M];
        const x = p[0] + p[2] * off;
        const y = p[1] + p[3] * off;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    };

    const rosette = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      o: {
        A: number;
        d: number;
        m: number;
        n: number;
        pts: number;
        alpha: number;
        lw: number;
        dir?: number;
        shrink?: number;
        phase?: number;
      },
    ) => {
      const dir = o.dir || 1;
      const shrink = o.shrink === undefined ? 0.06 : o.shrink;
      ctx.lineWidth = o.lw;
      ctx.strokeStyle = ink(o.alpha);
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let k = 0; k < o.n; k++) {
        const f = k / o.n;
        const phi = (o.phase || 0) + dir * f * TAU;
        const a = o.A * (1 - shrink * f);
        for (let i = 0; i <= o.pts; i++) {
          const t = (i / o.pts) * TAU;
          const x = cx + a * Math.cos(t) + o.d * Math.cos(o.m * t + phi);
          const y = cy + a * Math.sin(t) - o.d * Math.sin(o.m * t + phi);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    };

    const waveField = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = ink(0.075);
      const pitch = 6.2;
      const N = Math.ceil(h / pitch) + 2;
      const step = 7;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const y0 = i * pitch - 3;
        const ph = i * 0.44;
        for (let x = 0; x <= w; x += step) {
          const y =
            y0 +
            3.3 * Math.sin(x * 0.0139 + ph) +
            1.9 * Math.sin(x * 0.0327 - ph * 1.7) +
            0.9 * Math.sin(x * 0.0715 + ph * 0.6);
          if (x) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    };

    const drawPlate = () => {
      const w = cert.clientWidth;
      const h = cert.clientHeight;
      if (!w || !h) return;
      fit(cPlate, ctxP, w, h);
      ctxP.fillStyle = paperColor;
      ctxP.fillRect(0, 0, w, h);
      let g = ctxP.createRadialGradient(
        w * 0.28,
        h * 0.16,
        8,
        w * 0.28,
        h * 0.16,
        Math.max(w, h) * 0.95,
      );
      g.addColorStop(0, "rgba(255,252,240,.85)");
      g.addColorStop(1, "rgba(255,252,240,0)");
      ctxP.fillStyle = g;
      ctxP.fillRect(0, 0, w, h);
      g = ctxP.createRadialGradient(
        w * 0.88,
        h * 0.94,
        8,
        w * 0.88,
        h * 0.94,
        Math.max(w, h) * 0.85,
      );
      g.addColorStop(0, ink(0.06));
      g.addColorStop(1, ink(0));
      ctxP.fillStyle = g;
      ctxP.fillRect(0, 0, w, h);
      const rnd = rand32(4409);
      for (let i = 0; i < 1100; i++) {
        ctxP.fillStyle = ink(0.018 + rnd() * 0.05);
        ctxP.fillRect(rnd() * w, rnd() * h, 1, rnd() < 0.12 ? 2 : 1);
      }
      waveField(ctxP, w, h);
      const narrow = w < 520;
      const inset = narrow ? 7 : 10;
      const half = narrow ? 3.1 : 3.8;
      const br = rail(
        rectOutline(
          inset + half,
          inset + half,
          w - 2 * (inset + half),
          h - 2 * (inset + half),
          narrow ? 5 : 7,
        ),
        narrow ? 760 : 1240,
      );
      band(ctxP, br, { amp: half, waves: narrow ? 54 : 116, K: 9, alpha: 0.3, lw: 0.5 });
      railLine(ctxP, br, -half - 1.9, 0.34, 0.6);
      railLine(ctxP, br, half + 1.9, 0.3, 0.5);
      railLine(ctxP, br, half + 4.4, 0.13, 0.5);
    };

    const drawRosettes = () => {
      const w = medal.clientWidth;
      const h = medal.clientHeight;
      if (!w || !h) return;
      fit(cRose, ctxR, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) / 2;
      const bar = BARS[sel];
      const small = R < 130;
      const g = ctxR.createRadialGradient(cx, cy, R * 0.06, cx, cy, R);
      g.addColorStop(0, "rgba(249,245,234,.92)");
      g.addColorStop(0.76, "rgba(249,245,234,.84)");
      g.addColorStop(1, "rgba(249,245,234,0)");
      ctxR.fillStyle = g;
      ctxR.beginPath();
      ctxR.arc(cx, cy, R, 0, TAU);
      ctxR.fill();
      const ring = rail(circleOutline(cx, cy, R * 0.93, 640), small ? 460 : 620);
      band(ctxR, ring, { amp: R * 0.036, waves: (bar.m + 1) * 5, K: 7, alpha: 0.3, lw: 0.5 });
      railLine(ctxR, ring, -R * 0.036 - 1.8, 0.34, 0.6);
      railLine(ctxR, ring, R * 0.036 + 1.8, 0.28, 0.5);
      rosette(ctxR, cx, cy, {
        A: R * 0.655,
        d: R * 0.215,
        m: bar.m,
        n: small ? 44 : 58,
        pts: small ? 340 : 470,
        alpha: 0.42,
        lw: 0.5,
        shrink: 0.035,
        phase: 0.2,
      });
      rosette(ctxR, cx, cy, {
        A: R * 0.335,
        d: R * 0.115,
        m: bar.m2,
        n: small ? 34 : 44,
        pts: small ? 280 : 380,
        alpha: 0.38,
        lw: 0.5,
        dir: -1,
        shrink: 0.05,
        phase: 0.9,
      });
      ctxR.beginPath();
      ctxR.arc(cx, cy, R * 0.07, 0, TAU);
      ctxR.fillStyle = "rgba(249,245,234,.86)";
      ctxR.fill();
      ctxR.lineWidth = 0.6;
      ctxR.strokeStyle = ink(0.32);
      ctxR.stroke();
      ctxR.beginPath();
      ctxR.arc(cx, cy, R * 0.04, 0, TAU);
      ctxR.strokeStyle = ink(0.24);
      ctxR.lineWidth = 0.5;
      ctxR.stroke();
    };

    let phase = 0;
    const drawDrift = () => {
      const w = medal.clientWidth;
      const h = medal.clientHeight;
      if (!w || !h) return;
      fit(cDrift, ctxD, w, h);
      const R = Math.min(w, h) / 2;
      const small = R < 130;
      rosette(ctxD, w / 2, h / 2, {
        A: R * 0.515,
        d: R * 0.165,
        m: BARS[sel].m3,
        n: small ? 26 : 34,
        pts: small ? 240 : 320,
        alpha: 0.3,
        lw: 0.5,
        shrink: 0.03,
        phase,
      });
    };

    const paintLabels = () => {
      const id = BARS[sel].id;
      if (barNameRef.current) barNameRef.current.textContent = id;
      if (capBarRef.current) capBarRef.current.textContent = id;
    };
    const drawAll = () => {
      drawPlate();
      drawRosettes();
      drawDrift();
    };
    paintLabels();
    drawAll();

    let timer = 0;
    let onScreen = true;
    const halt = () => {
      if (timer) {
        clearTimeout(timer);
        timer = 0;
      }
    };
    const schedule = () => {
      if (timer || reduce || !onScreen || document.hidden) return;
      timer = window.setTimeout(tick, 140);
    };
    function tick() {
      timer = 0;
      phase += 0.019;
      if (phase > TAU) phase -= TAU;
      drawDrift();
      schedule();
    }
    const cycleCam = () => {
      if (reduce || document.hidden || !onScreen) return;
      sel = (sel + 1) % BARS.length;
      paintLabels();
      drawRosettes();
      drawDrift();
    };

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        if (onScreen) schedule();
        else halt();
      },
      { threshold: 0.02 },
    );
    io.observe(cert);
    const onVis = () => (document.hidden ? halt() : schedule());
    document.addEventListener("visibilitychange", onVis);
    let rt = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(rt);
      rt = window.setTimeout(drawAll, 120);
    });
    ro.observe(cert);
    const camTimer = reduce ? 0 : window.setInterval(cycleCam, cycleInterval);
    schedule();
    let alive = true;
    document.fonts?.ready.then(() => alive && drawAll()).catch(() => {});

    return () => {
      alive = false;
      halt();
      clearInterval(camTimer);
      clearTimeout(rt);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [prefersReducedMotion, inkRgb, paperColor, cycleInterval]);

  const mono = '"IBM Plex Mono", ui-monospace, monospace';
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        background: backgroundColor,
        color: inkColor,
        containerType: "size",
        fontFamily: '"Cormorant Garamond", Didot, "Times New Roman", serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            '@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap");' +
            ".ec-cert{aspect-ratio:1.08/1}.ec-medal{width:min(58cqmin,280px);height:min(58cqmin,280px)}" +
            "@container (max-width:520px),(max-height:560px){.ec-cert{aspect-ratio:auto;height:100%}.ec-medal{width:min(62cqmin,240px);height:min(62cqmin,240px)}}",
        }}
      />
      <article
        ref={certRef}
        aria-label={`${label} certificate`}
        className="ec-cert relative flex flex-none flex-col items-center justify-center overflow-auto rounded-[3px]"
        style={{
          width: "min(calc(100% - 32px), 720px)",
          maxHeight: "calc(100% - 32px)",
          gap: "clamp(10px, 2.4cqmin, 18px)",
          padding: "clamp(16px, 4cqmin, 36px)",
          background: `repeating-linear-gradient(0deg, rgba(${inkRgb}, 0.045) 0 0.5px, transparent 0.5px 6px), linear-gradient(168deg, #f8f3e6 0%, ${paperColor} 40%, #efe7d3 100%)`,
          boxShadow: `0 0 0 1px rgba(${inkRgb}, 0.13), 0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 30px 60px -34px rgba(22, 38, 28, 0.62), 0 3px 8px rgba(22, 38, 28, 0.09)`,
        }}
      >
        <canvas
          ref={plateRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 block h-full w-full rounded-[inherit]"
        />
        <div
          className="relative z-[1] flex flex-col items-center text-center"
          style={{ gap: "clamp(10px, 2.2cqmin, 16px)", width: "min(100%, 420px)" }}
        >
          <div
            className="uppercase"
            style={{
              fontFamily: mono,
              fontSize: "clamp(9px, 1.7cqmin, 11px)",
              letterSpacing: "0.24em",
              color: `rgba(${inkRgb}, 0.44)`,
            }}
          >
            {label}
          </div>
          <figure ref={medalRef} className="ec-medal relative mx-10 my-4 flex-none rounded-full">
            <canvas
              ref={roseRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 block h-full w-full"
            />
            <canvas
              ref={driftRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 block h-full w-full"
            />
          </figure>
          <h1
            className="m-0"
            style={{
              fontSize: "clamp(22px, 4.8cqmin, 34px)",
              fontWeight: 500,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {title}{" "}
            <em ref={barNameRef} className="not-italic" style={{ color: `rgba(${inkRgb}, 0.62)` }}>
              C
            </em>
          </h1>
          <div
            className="uppercase"
            style={{
              fontFamily: mono,
              fontSize: "clamp(9px, 1.7cqmin, 11px)",
              letterSpacing: "0.22em",
              color: `rgba(${inkRgb}, 0.44)`,
            }}
          >
            {caption} <span ref={capBarRef}>C</span>
          </div>
        </div>
      </article>
    </div>
  );
}
