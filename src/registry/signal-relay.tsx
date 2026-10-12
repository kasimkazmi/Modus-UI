"use client";
// Ported from ThreeUI Community's Uplink Loader (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SignalRelayProps {
  /** Label above the progress bar. */
  label?: string;
  /** Status lines, each shown from its percentage threshold upward. */
  phases?: [number, string][];
  /** Duration of the 0 → 100 run, in milliseconds. */
  duration?: number;
  /** Accent colour for the lit ticks, readout and glow; any CSS colour. */
  color?: string;
  /** Screen background; any CSS colour. */
  backgroundColor?: string;
  className?: string;
}

const DEFAULT_PHASES: [number, string][] = [
  [0, "WARMING THE PRESS"],
  [24, "SETTING THE TYPE"],
  [52, "INKING THE PLATES"],
  [78, "PULLING THE PROOFS"],
  [100, "EDITION READY"],
];

const CSS = `
.ul-root{--s:1;--green-dim:color-mix(in srgb,var(--green) 26%,transparent);--line:color-mix(in srgb,var(--green) 46%,transparent);--ink-hi:hsl(var(--foreground));font-family:var(--font-jetbrains-mono),ui-monospace,SFMono-Regular,Menlo,monospace;-webkit-font-smoothing:antialiased}
.ul-root *{box-sizing:border-box;margin:0;padding:0}
.ul-root .pool{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 44% at 50% 52%,color-mix(in srgb,var(--green) 17%,transparent) 0%,color-mix(in srgb,var(--green) 8%,transparent) 38%,color-mix(in srgb,var(--green) 2%,transparent) 66%,transparent 100%)}
.ul-root .scene{position:absolute;inset:0;overflow:hidden}
.ul-root .stage{position:absolute;left:50%;top:50%;width:1200px;height:800px;transform:translate(-50%,-50%) scale(var(--s));transform-origin:center}
.ul-root .stage>*{position:absolute}
.ul-root .plate{left:530px;top:270px;width:140px;height:84px;background:var(--line);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
.ul-root .plate::after{content:"";position:absolute;inset:1.2px;background:linear-gradient(180deg,hsl(var(--card)),hsl(var(--background)));clip-path:polygon(13px 0,100% 0,100% calc(100% - 13px),calc(100% - 13px) 100%,0 100%,0 13px)}
.ul-root .plate.hit{animation:ulPlateHit .5s ease-out}
@keyframes ulPlateHit{0%{background:hsl(var(--foreground))}100%{background:var(--line)}}
.ul-root .brk{width:9px;height:9px;pointer-events:none}
.ul-root .brk::before,.ul-root .brk::after{content:"";position:absolute;background:var(--green);opacity:.9}
.ul-root .brk::before{width:9px;height:1.2px}.ul-root .brk::after{width:1.2px;height:9px}
.ul-root .brk.tr{left:661px;top:270px}.ul-root .brk.tr::before{right:0;top:0}.ul-root .brk.tr::after{right:0;top:0}
.ul-root .brk.bl{left:530px;top:345px}.ul-root .brk.bl::before{left:0;bottom:0}.ul-root .brk.bl::after{left:0;bottom:0}
.ul-root .readout{left:530px;top:284.9px;width:140px;height:0;text-align:center;line-height:1;white-space:pre;color:var(--green);text-shadow:0 0 4px color-mix(in srgb,var(--green) 60%,transparent),0 0 14px color-mix(in srgb,var(--green) 55%,transparent),0 0 36px color-mix(in srgb,var(--green) 40%,transparent);animation:ulNeon 4.3s steps(1,end) infinite}
.ul-root .readout b{font-size:47px;font-weight:280;letter-spacing:2.4px}
.ul-root .readout u{font-size:15px;font-weight:400;letter-spacing:0;text-decoration:none;opacity:.62;position:relative;top:-1px;left:3px}
@keyframes ulNeon{0%,40%{opacity:1}41%{opacity:.55}42%{opacity:1}67%{opacity:1}68%{opacity:.72}69.5%{opacity:1}70.5%{opacity:.42}71.5%{opacity:1}}
.ul-root .haze{left:298px;top:438px;width:0;height:0;pointer-events:none}
.ul-root .haze i{position:absolute;left:0;top:0;width:calc(var(--lit-w,0px) + 250px);height:250px;transform:translate(-125px,-128px);background:radial-gradient(ellipse 50% 50% at center,color-mix(in srgb,var(--green) 26%,transparent) 0%,color-mix(in srgb,var(--green) 17%,transparent) 22%,color-mix(in srgb,var(--green) 8%,transparent) 45%,color-mix(in srgb,var(--green) 2%,transparent) 70%,transparent 100%);filter:blur(6px);transition:width .16s linear}
.ul-root .haze i.pulse{animation:ulHazePulse .3s ease-out}
@keyframes ulHazePulse{0%{filter:blur(6px) brightness(1.3)}100%{filter:blur(6px) brightness(1)}}
.ul-root .bar{left:298px;top:420px;width:604px;height:44px;display:flex;justify-content:space-between;align-items:flex-end}
.ul-root .tick{width:5.4px;height:32px;background:var(--green-dim);transform:skewX(12deg)}
.ul-root .tick.mk{height:44px}
.ul-root .tick.on{background:var(--green);box-shadow:0 0 4px color-mix(in srgb,var(--green) 60%,transparent),0 0 11px color-mix(in srgb,var(--green) 32%,transparent),0 0 24px color-mix(in srgb,var(--green) 16%,transparent)}
.ul-root .tick.flash{animation:ulIgnite .32s ease-out}
@keyframes ulIgnite{0%{background:hsl(var(--foreground));box-shadow:0 0 11px color-mix(in srgb,var(--green) 100%,transparent),0 0 28px color-mix(in srgb,var(--green) 85%,transparent),0 0 54px color-mix(in srgb,var(--green) 45%,transparent)}100%{background:var(--green);box-shadow:0 0 4px color-mix(in srgb,var(--green) 60%,transparent),0 0 11px color-mix(in srgb,var(--green) 32%,transparent),0 0 24px color-mix(in srgb,var(--green) 16%,transparent)}}
.ul-root .barlabel{left:298px;top:396.4px;font-size:20.4px;font-weight:500;letter-spacing:.9px;line-height:1;color:var(--ink-hi);text-shadow:0 0 3px color-mix(in srgb,var(--green) 34%,transparent),0 0 11px color-mix(in srgb,var(--green) 30%,transparent),0 0 26px color-mix(in srgb,var(--green) 22%,transparent)}
.ul-root .status{left:0;top:507px;width:1200px;text-align:center;font-size:14px;font-weight:500;line-height:1;letter-spacing:1.42px;text-indent:1.42px;color:hsl(var(--muted-foreground));white-space:pre;text-shadow:0 0 3px color-mix(in srgb,var(--green) 30%,transparent),0 0 10px color-mix(in srgb,var(--green) 22%,transparent)}
.ul-root .status .dots{letter-spacing:-1.9px;margin-left:-6px}
.ul-root .marker{width:0;height:0}
.ul-root .marker i{position:absolute;background:var(--green);opacity:.72}
.ul-root .marker .h{width:9px;height:1.2px}.ul-root .marker .v{width:1.2px;height:9px}
.ul-root .marker .a-h{left:-17px;top:-17px}.ul-root .marker .a-v{left:-17px;top:-17px}
.ul-root .marker .b-h{left:8px;top:-17px}.ul-root .marker .b-v{left:15.8px;top:-17px}
.ul-root .marker .c-h{left:-17px;top:15.8px}.ul-root .marker .c-v{left:-17px;top:8px}
.ul-root .marker .d-h{left:8px;top:15.8px}.ul-root .marker .d-v{left:15.8px;top:8px}
.ul-root .marker .dia{left:-4px;top:-4px;width:8px;height:8px;opacity:1;background:var(--green);transform:rotate(45deg);box-shadow:0 0 6px color-mix(in srgb,var(--green) 70%,transparent);animation:ulDiaPulse 3.2s ease-in-out infinite}
@keyframes ulDiaPulse{0%,100%{opacity:.55;transform:rotate(45deg) scale(.8)}50%{opacity:1;transform:rotate(45deg) scale(1)}}
.ul-root .m-tl{left:274px;top:340px}.ul-root .m-tr{left:926px;top:340px}
.ul-root .m-bl{left:274px;top:508px}.ul-root .m-br{left:926px;top:508px}
.ul-root .m-tr .dia{animation-delay:.5s}.ul-root .m-bl .dia{animation-delay:1.1s}.ul-root .m-br .dia{animation-delay:1.6s}
.ul-root .rail{left:0;top:0;width:1200px;height:800px}
.ul-root .rail.right{transform:scaleX(-1)}
.ul-root .rail>*{position:absolute}
.ul-root .rail .wire{left:104px;top:433px;width:92px;height:1.4px;background:color-mix(in srgb,var(--green) 24%,transparent)}
.ul-root .rail .cap{top:428px;height:5px;background:var(--green);box-shadow:0 0 5px color-mix(in srgb,var(--green) 60%,transparent)}
.ul-root .rail .cap.a{left:104px;width:10px}
.ul-root .rail .cap.b{left:181px;width:15px;animation:ulCapPulse 2.4s ease-in-out infinite}
@keyframes ulCapPulse{0%,100%{opacity:1}50%{opacity:.5}}
.ul-root .mod{left:204px;top:404px;width:36px;height:62px}
.ul-root .mod>*{position:absolute;left:0}
.ul-root .mod .hatch{top:0;width:36px;height:2px;background:hsl(var(--foreground))}
.ul-root .mod .ret{top:8px;left:3px;width:30px;height:30px;border-radius:50%;border:1.3px solid color-mix(in srgb,var(--green) 82%,transparent)}
.ul-root .mod .ret::before,.ul-root .mod .ret::after{content:"";position:absolute;background:color-mix(in srgb,var(--green) 45%,transparent)}
.ul-root .mod .ret::before{left:-3.5px;top:13.6px;width:35px;height:1px}
.ul-root .mod .ret::after{left:13.6px;top:-3.5px;width:1px;height:35px}
.ul-root .mod .dot{top:12.5px;left:15.5px;width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 6px color-mix(in srgb,var(--green) 90%,transparent);animation:ulDiaPulse 2.6s ease-in-out infinite}
.ul-root .mod .slab{top:46px;width:36px;height:5px;background:hsl(var(--foreground));clip-path:polygon(0 0,100% 0,100% 100%,5px 100%)}
.ul-root .mod .led{top:55px;height:2.6px;background:hsl(var(--muted-foreground))}
.ul-root .mod .led:nth-of-type(1){left:0;width:3px}
.ul-root .mod .led:nth-of-type(2){left:4.5px;width:4px}
.ul-root .mod .led:nth-of-type(3){left:27px;width:4px}
.ul-root .mod .led:nth-of-type(4){left:33px;width:3px}
.ul-root .scan{position:absolute;inset:0;pointer-events:none;opacity:.18;background:repeating-linear-gradient(to bottom,color-mix(in srgb,var(--green) 5%,transparent) 0 calc(1px * var(--s)),transparent calc(1px * var(--s)) calc(3px * var(--s)))}
.ul-root .grain{position:absolute;inset:-60px;pointer-events:none;background-repeat:repeat;background-size:80px 80px;animation:ulGrainShift .6s steps(1,end) infinite}
.ul-root .grain.mul{mix-blend-mode:overlay;opacity:.40}
.ul-root .grain.add{opacity:.035;animation-duration:.72s}
@keyframes ulGrainShift{0%{transform:translate(0,0)}20%{transform:translate(-22px,14px)}40%{transform:translate(17px,-19px)}60%{transform:translate(-13px,-9px)}80%{transform:translate(9px,21px)}100%{transform:translate(0,0)}}
.ul-root .stage.reset{animation:ulResetGlitch .42s ease-out}
@keyframes ulResetGlitch{0%{filter:brightness(1.8) saturate(.5)}18%{filter:brightness(.32)}30%{filter:brightness(1.2)}100%{filter:none}}
.ul-root[data-still] .grain,.ul-root[data-still] .readout,.ul-root[data-still] .marker .dia,.ul-root[data-still] .mod .dot,.ul-root[data-still] .rail .cap.b{animation:none!important}
`;

const TICKS = 56;
const MARK_EVERY = 8;
const KF: [number, number][] = [
  [0, 0],
  [0.045, 9],
  [0.115, 9.6],
  [0.16, 22],
  [0.205, 23],
  [0.3, 38],
  [0.345, 39.5],
  [0.4, 53],
  [0.475, 54],
  [0.545, 68],
  [0.6, 69],
  [0.665, 81],
  [0.735, 82],
  [0.8, 92],
  [0.855, 93],
  [0.925, 99],
  [0.985, 99.4],
  [1.0, 100],
];

function Marker({ className }: { className: string }) {
  return (
    <div className={cn("marker", className)}>
      {["a", "b", "c", "d"].map((k) => (
        <span key={k}>
          <i className={`h ${k}-h`} />
          <i className={`v ${k}-v`} />
        </span>
      ))}
      <i className="dia" />
    </div>
  );
}

function Rail({ side }: { side: "left" | "right" }) {
  return (
    <div className={cn("rail", side)}>
      <div className="wire" />
      <div className="cap a" />
      <div className="cap b" />
      <div className="mod">
        <div className="hatch" />
        <div className="ret" />
        <div className="dot" />
        <div className="slab" />
        <i className="led" />
        <i className="led" />
        <i className="led" />
        <i className="led" />
      </div>
    </div>
  );
}

function makeGrain(fn: (d: Uint8ClampedArray, o: number) => void) {
  const N = 160;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) fn(img.data, i * 4);
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function SignalRelay({
  label = "PRESS RUN",
  phases = DEFAULT_PHASES,
  duration = 8600,
  color = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--background))",
  className,
}: SignalRelayProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const phasesRef = useRef(phases);
  phasesRef.current = phases;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;

    const fit = () => {
      const { width, height } = root.getBoundingClientRect();
      root.style.setProperty("--s", String(Math.min(width / 1200, height / 800)));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    fit();

    const bar = q<HTMLDivElement>(".bar");
    bar.innerHTML = "";
    const ticks: HTMLElement[] = [];
    for (let i = 0; i < TICKS; i++) {
      const t = document.createElement("i");
      t.className = "tick" + ((i + 1) % MARK_EVERY === 0 ? " mk" : "");
      bar.appendChild(t);
      ticks.push(t);
    }

    const g = () => (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
    q(".grain.mul").style.backgroundImage = `url(${makeGrain((d, o) => {
      const v = 128 + (g() - 0.5) * 300;
      d[o] = d[o + 1] = d[o + 2] = Math.max(0, Math.min(255, v));
      d[o + 3] = 255;
    })})`;
    q(".grain.add").style.backgroundImage = `url(${makeGrain((d, o) => {
      const v = Math.random();
      d[o] = d[o + 1] = d[o + 2] = 255;
      d[o + 3] = v < 0.86 ? 0 : Math.round(((v - 0.86) / 0.14) * 190);
    })})`;

    const RUN = duration;
    const HOLD = 1600;
    const BLANK = 420;
    const LOOP = RUN + HOLD + BLANK;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 2.1);
    const valueAt = (u: number) => {
      if (u >= 1) return 100;
      for (let i = 0; i < KF.length - 1; i++) {
        const [t0, v0] = KF[i];
        const [t1, v1] = KF[i + 1];
        if (u <= t1) return v0 + (v1 - v0) * easeOut((u - t0) / (t1 - t0));
      }
      return 100;
    };
    const phaseFor = (p: number) => {
      const list = phasesRef.current;
      let t = list[0]?.[1] ?? "";
      for (const [k, v] of list) if (p >= k) t = v;
      return t;
    };

    const num = q(".num");
    const dots = q(".dots");
    const statText = q(".stat-text");
    const haze = q(".haze i");
    const stage = q(".stage");
    const plate = q(".plate");
    const tickW = 5.4;
    const gap = (604 - TICKS * tickW) / (TICKS - 1);
    const pitch = tickW + gap;

    let lastLit = -1;
    let lastPct = -1;
    let lastDots = -1;
    let lastPhase = "";
    let cycle = 0;
    let elapsed = 0;
    let prev = -1;
    let raf = 0;
    let visible = true;
    const restart = (el: HTMLElement, cls: string) => {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    };

    const render = (frozen: number | null) => {
      const e = elapsed % LOOP;
      const c = Math.floor(elapsed / LOOP);
      if (c !== cycle) {
        cycle = c;
        restart(stage, "reset");
      }
      let pct: number;
      let shownVisible = true;
      if (e < RUN) pct = valueAt(e / RUN);
      else if (e < RUN + HOLD) pct = 100;
      else {
        pct = 0;
        shownVisible = (e - RUN - HOLD) % 220 < 130;
      }
      if (frozen !== null) {
        pct = frozen;
        shownVisible = true;
      }
      const shown = Math.round(pct);
      if (shown !== lastPct) {
        num.textContent = String(shown);
        lastPct = shown;
        const ph = phaseFor(shown);
        if (ph !== lastPhase) {
          lastPhase = ph;
          statText.textContent = ph;
        }
      }
      (num.parentElement as HTMLElement).style.opacity = shownVisible ? "" : ".22";
      const lit = Math.round((pct / 100) * TICKS);
      if (lit !== lastLit) {
        for (let i = 0; i < TICKS; i++) ticks[i].classList.toggle("on", i < lit);
        if (lit > lastLit && lastLit >= 0 && lit > 0 && frozen === null) {
          restart(ticks[lit - 1], "flash");
          restart(haze, "pulse");
        }
        haze.style.setProperty(
          "--lit-w",
          (lit > 0 ? (lit - 1) * pitch + tickW + gap / 2 : 0) + "px",
        );
        if (lit === TICKS && frozen === null) restart(plate, "hit");
        lastLit = lit;
      }
      const d = shown >= 100 ? 0 : frozen !== null ? 3 : Math.floor((elapsed / 380) % 4);
      if (d !== lastDots) {
        dots.textContent = "...".slice(0, d);
        lastDots = d;
      }
    };

    if (prefersReducedMotion) {
      render(50);
      return () => ro.disconnect();
    }

    const frame = (now: number) => {
      if (prev >= 0) elapsed += now - prev;
      prev = now;
      render(null);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      prev = -1;
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
    io.observe(root);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [duration, prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      role="progressbar"
      aria-label={label}
      data-still={prefersReducedMotion ? "" : undefined}
      className={cn("ul-root relative h-full w-full overflow-hidden", className)}
      style={{ background: backgroundColor, ["--green" as string]: color }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pool" />
      <div className="scene">
        <div className="stage">
          <div className="haze">
            <i />
          </div>
          <div className="plate" />
          <div className="brk tr" />
          <div className="brk bl" />
          <div className="readout">
            <b className="num">50</b>
            <u>%</u>
          </div>
          <div className="barlabel">{label}</div>
          <div className="bar" />
          <div className="status">
            <span className="stat-text">{phases[0]?.[1]}</span>
            <span className="dots">...</span>
          </div>
          <Marker className="m-tl" />
          <Marker className="m-tr" />
          <Marker className="m-bl" />
          <Marker className="m-br" />
          <Rail side="left" />
          <Rail side="right" />
        </div>
      </div>
      <div className="scan" />
      <div className="grain mul" />
      <div className="grain add" />
    </div>
  );
}
