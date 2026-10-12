"use client";
// Ported from ThreeUI Community's Sketchbook (MIT, © 2026 Meng To).

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DraftFolioPage = {
  /** Image URL. A photo is laid onto a drawn draft-folio spread; with `spread` it is used as-is. */
  src: string;
  title: string;
  place?: string;
  /** `src` is already a 1760×1240 transparent spread of an open draft-folio. */
  spread?: boolean;
};

export type DraftFolioProps = {
  pages?: DraftFolioPage[];
  startPage?: number;
  intro?: boolean;
  magnification?: number;
  hint?: string;
  paperColor?: string;
  inkColor?: string;
  accentColor?: string;
  sheetColor?: string;
  className?: string;
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;

const DEFAULT_PAGES: DraftFolioPage[] = [
  { src: unsplash("1525625293386-3f8f99389edd"), title: "Marina Bay Sands", place: "Bayfront" },
  {
    src: unsplash("1508964942454-1a56651d54ac"),
    title: "Gardens by the Bay",
    place: "Supertree Grove",
  },
  { src: unsplash("1600664356348-10686526af4f"), title: "The Merlion", place: "Merlion Park" },
  { src: unsplash("1506351421178-63b52a2d2562"), title: "Supertrees at Dusk", place: "Bay South" },
  { src: unsplash("1542114740389-9b46fb1e5be7"), title: "ArtScience Museum", place: "Marina Bay" },
  { src: unsplash("1555217851-6141535bd771"), title: "Rain Vortex", place: "Changi" },
  { src: unsplash("1496939376851-89342e90adcd"), title: "Marina Bay Skyline", place: "The Bay" },
  {
    src: unsplash("1565967511849-76a60a516170"),
    title: "The Merlion by Night",
    place: "One Fullerton",
  },
];

const SPREAD_W = 1760;
const SPREAD_H = 1240;

/** Resolves `var(--token)` references against the document's theme, for use on a canvas. */
function resolveThemeColor(value: string) {
  const style = getComputedStyle(document.documentElement);
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) =>
    style.getPropertyValue(name).trim(),
  );
}

/** Adds an alpha channel to a resolved `hsl(...)` colour; other formats are returned as-is. */
function withAlpha(color: string, alpha: number) {
  const m = /^hsl\((.*)\)$/.exec(color);
  return m ? `hsl(${m[1]} / ${alpha})` : color;
}

/** Reads a font-family custom property (`--font-heading`, `--font-body`) for canvas text. */
function themeFont(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "serif";
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

/* Draws an open draft-folio spread with the paper in the same place as the
   original plates (x 5.1–94.9 %, y 21.8–78.2 %), the photo washed onto the
   right page and the plate's title handwritten on the left. */
async function composeSpread(page: DraftFolioPage, sheet: string, ink: string): Promise<string> {
  if (page.spread) return page.src;
  const c = document.createElement("canvas");
  c.width = SPREAD_W;
  c.height = SPREAD_H;
  const g = c.getContext("2d");
  if (!g) return page.src;
  const x0 = SPREAD_W * 0.051,
    x1 = SPREAD_W * 0.949,
    y0 = SPREAD_H * 0.218,
    y1 = SPREAD_H * 0.782;
  const mid = SPREAD_W / 2;
  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  };
  roundRect(x0, y0, x1 - x0, y1 - y0, 34);
  g.fillStyle = resolveThemeColor(sheet);
  g.fill();
  const inkColor = resolveThemeColor(ink);
  g.save();
  roundRect(x0, y0, x1 - x0, y1 - y0, 34);
  g.clip();
  /* paper tooth */
  for (let i = 0; i < 9000; i++) {
    g.globalAlpha = Math.random() * 0.035;
    g.fillStyle = inkColor;
    g.fillRect(x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0), 2, 2);
  }
  /* the gutter and the page edges */
  const gut = g.createLinearGradient(mid - 90, 0, mid + 90, 0);
  gut.addColorStop(0, withAlpha(inkColor, 0));
  gut.addColorStop(0.47, withAlpha(inkColor, 0.16));
  gut.addColorStop(0.5, withAlpha(inkColor, 0.26));
  gut.addColorStop(0.53, withAlpha(inkColor, 0.16));
  gut.addColorStop(1, withAlpha(inkColor, 0));
  g.fillStyle = gut;
  g.fillRect(mid - 90, y0, 180, y1 - y0);
  g.strokeStyle = withAlpha(inkColor, 0.1);
  g.lineWidth = 3;
  g.strokeRect(x0 + 1.5, y0 + 1.5, x1 - x0 - 3, y1 - y0 - 3);

  /* the photo, washed onto the right page with a soft painted edge */
  try {
    const im = await loadImage(page.src);
    const px = mid + 70,
      py = y0 + 70,
      pw = x1 - 70 - px,
      ph = y1 - 90 - py;
    const s = Math.max(pw / im.naturalWidth, ph / im.naturalHeight);
    const sw = pw / s,
      sh = ph / s;
    const layer = document.createElement("canvas");
    layer.width = pw;
    layer.height = ph;
    const l = layer.getContext("2d");
    if (l) {
      l.filter = "grayscale(1) contrast(1.1) brightness(1.05)";
      l.drawImage(
        im,
        (im.naturalWidth - sw) / 2,
        (im.naturalHeight - sh) / 2,
        sw,
        sh,
        0,
        0,
        pw,
        ph,
      );
      l.filter = "none";
      l.globalCompositeOperation = "destination-in";
      const fx = l.createLinearGradient(0, 0, pw, 0);
      fx.addColorStop(0, "rgba(0,0,0,0)");
      fx.addColorStop(0.06, "#000");
      fx.addColorStop(0.94, "#000");
      fx.addColorStop(1, "rgba(0,0,0,0)");
      l.fillStyle = fx;
      l.fillRect(0, 0, pw, ph);
      const fy = l.createLinearGradient(0, 0, 0, ph);
      fy.addColorStop(0, "rgba(0,0,0,0)");
      fy.addColorStop(0.07, "#000");
      fy.addColorStop(0.93, "#000");
      fy.addColorStop(1, "rgba(0,0,0,0)");
      l.fillStyle = fy;
      l.fillRect(0, 0, pw, ph);
      g.globalCompositeOperation = "multiply";
      g.globalAlpha = 0.92;
      g.drawImage(layer, px, py);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
  } catch {
    /* an unreachable image leaves a blank page */
  }

  /* the handwriting on the left page */
  g.globalAlpha = 0.82;
  g.fillStyle = inkColor;
  g.font = `italic 64px ${themeFont("--font-heading")}`;
  g.textBaseline = "alphabetic";
  g.fillText(page.title, x0 + 110, y1 - 170, mid - x0 - 200);
  if (page.place) {
    g.globalAlpha = 0.5;
    g.font = "24px ui-monospace, SFMono-Regular, Menlo, monospace";
    g.fillText(
      page.place.toUpperCase().split("").join(String.fromCharCode(8202)),
      x0 + 112,
      y1 - 118,
    );
  }
  g.restore();
  g.globalAlpha = 1;

  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  return blob ? URL.createObjectURL(blob) : page.src;
}

const STYLE = `
.msb{--ink-soft:color-mix(in srgb,var(--ink) 58%,transparent);--ink-faint:color-mix(in srgb,var(--ink) 36%,transparent);--hairline:color-mix(in srgb,var(--ink) 14%,transparent);
  --display:var(--font-heading),serif;
  --font:ui-monospace,SFMono-Regular,Menlo,monospace;--track-caps:.24em;
  font-family:var(--font);font-weight:400;color:var(--ink);-webkit-font-smoothing:antialiased}
.msb *{box-sizing:border-box}
.msb button{font:inherit}
.msb .wash{position:absolute;inset:0;pointer-events:none;opacity:.85;
  background:radial-gradient(60% 50% at 12% 18%,color-mix(in srgb,var(--earth) 35%,transparent),color-mix(in srgb,var(--earth) 0%,transparent) 70%),
    radial-gradient(45% 40% at 88% 30%,color-mix(in srgb,var(--earth) 32%,transparent),color-mix(in srgb,var(--earth) 0%,transparent) 72%),
    radial-gradient(70% 55% at 50% 100%,color-mix(in srgb,var(--earth) 40%,transparent),color-mix(in srgb,var(--earth) 0%,transparent) 70%)}
.msb .wash:after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,color-mix(in srgb,var(--paper) 25%,transparent) 0%,color-mix(in srgb,var(--paper) 72%,transparent) 58%,var(--paper) 88%)}
.msb .hero{position:relative;display:grid;justify-items:center;align-content:center;width:100%;height:100%;padding:12px 0 10px}
.msb .hero,.msb .hero *{-webkit-user-select:none;user-select:none}
.msb .hero img{-webkit-user-drag:none}
.msb .sb-wrap{display:grid;justify-items:center;gap:8px;width:100%;position:relative;z-index:2}
.msb .sb-stage{display:flex;align-items:center;justify-content:center;width:100%;position:relative;touch-action:pan-y}
.msb .sb-arrow{flex:none;display:inline-flex;align-items:center;justify-content:center;padding:6px 2px;border:0;background:transparent;
  color:var(--ink-faint);cursor:pointer;transition:color .2s;-webkit-tap-highlight-color:transparent;z-index:8}
.msb .sb-arrow:hover{color:var(--ink)}
.msb .sb-3d{position:relative;flex:1 1;min-width:0;max-width:min(900px,92%);perspective:1750px;perspective-origin:50% 46%}
.msb .sb-tilt{position:relative;transform-style:preserve-3d;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) scale(var(--zoom,1));will-change:transform}
.msb .sb-book{position:relative;width:100%;aspect-ratio:1760/1240;transform-style:preserve-3d;z-index:1}
.msb .sb-cast{position:absolute;pointer-events:none;z-index:0}
.msb .sb-cast.ambient{left:5%;right:5%;top:27%;bottom:2%;
  background:radial-gradient(50% 50% at 50% 58%,rgb(0 0 0 / 34%) 0%,rgb(0 0 0 / 19%) 40%,rgb(0 0 0 / 0%) 74%);
  filter:blur(26px);opacity:calc(1 - var(--shade,0) * .42)}
.msb .sb-cast.contact{left:9%;right:9%;top:62%;bottom:10%;
  background:radial-gradient(50% 44% at 50% 42%,rgb(0 0 0 / 40%) 0%,rgb(0 0 0 / 17%) 48%,rgb(0 0 0 / 0%) 78%);
  filter:blur(11px);opacity:calc(1 - var(--shade,0) * .5)}
.msb .sb-cast.hair{left:12%;right:12%;top:70%;bottom:17%;
  background:radial-gradient(50% 52% at 50% 40%,rgb(0 0 0 / 34%) 0%,rgb(0 0 0 / 0%) 76%);
  filter:blur(4px);opacity:calc(1 - var(--shade,0) * .62)}
.msb .sb-full{position:absolute;inset:0}
.msb .sb-full img{width:100%;height:auto;display:block}
.msb .sb-half{position:absolute;top:0;bottom:0;width:50%;overflow-x:clip;overflow-y:visible}
.msb .sb-half.left{left:0}
.msb .sb-half.right{left:50%}
.msb .sb-half-img{width:200%;max-width:none;height:auto;display:block}
.msb .sb-half-img.right{margin-left:-100%}
.msb .gutter-shade{position:absolute;top:var(--pg,21.8%);bottom:var(--pg,21.8%);width:46%;pointer-events:none;opacity:calc(var(--shade,0) * .62);
  -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 5.2%,#000 94.8%,transparent 100%);
  mask-image:linear-gradient(180deg,transparent 0,#000 5.2%,#000 94.8%,transparent 100%)}
.msb .gutter-shade.left{right:0;background:linear-gradient(270deg,rgb(0 0 0 / 30%),rgb(0 0 0 / 0%) 82%)}
.msb .gutter-shade.right{left:0;background:linear-gradient(90deg,rgb(0 0 0 / 24%),rgb(0 0 0 / 0%) 82%)}
.msb .curl{position:absolute;top:0;height:100%;width:calc(var(--bw,0px) * var(--span));transform-style:preserve-3d;z-index:6}
.msb .curl.next{left:50%;transform-origin:left center;transform:rotateY(calc(-1 * var(--tt,0deg)))}
.msb .curl.prev{right:50%;transform-origin:right center;transform:rotateY(var(--tt,0deg))}
.msb .strip{position:absolute;top:0;height:100%;width:calc(var(--bw,0px) * var(--span) / var(--n));transform-style:preserve-3d}
.msb .curl.next .strip{transform-origin:left center}
.msb .curl.prev .strip{transform-origin:right center}
.msb .curl.next>.strip{left:0}
.msb .curl.prev>.strip{right:0;left:auto}
.msb .curl.next .strip .strip{left:100%;transform:rotateY(var(--td,0deg))}
.msb .curl.prev .strip .strip{right:100%;transform:rotateY(calc(-1 * var(--td,0deg)))}
.msb .face{position:absolute;top:0;bottom:0;left:0;right:-1.1px;backface-visibility:hidden;-webkit-backface-visibility:hidden;
  background-repeat:no-repeat;background-size:var(--bw,0px) auto}
.msb .face.back{transform:rotateY(180deg)}
.msb .face .sh,.msb .face .gl{
  -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 5.2%,#000 94.8%,transparent 100%);
  mask-image:linear-gradient(180deg,transparent 0,#000 5.2%,#000 94.8%,transparent 100%)}
.msb .strip.edge .face .sh,.msb .strip.edge .face .gl{
  -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 9%,#000 91%,transparent 100%),var(--hf);
  mask-image:linear-gradient(180deg,transparent 0,#000 9%,#000 91%,transparent 100%),var(--hf);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.msb .curl.next .strip.edge .face.front,.msb .curl.prev .strip.edge .face.back{--hf:linear-gradient(90deg,#000 0 22%,transparent 96%)}
.msb .curl.next .strip.edge .face.back,.msb .curl.prev .strip.edge .face.front{--hf:linear-gradient(270deg,#000 0 22%,transparent 96%)}
.msb .face .sh{position:absolute;left:0;right:0;top:var(--pg,21.8%);bottom:var(--pg,21.8%);pointer-events:none}
.msb .curl.next .face.front .sh,.msb .curl.prev .face.back .sh{background:linear-gradient(90deg,rgb(0 0 0 / var(--a1,0)),rgb(0 0 0 / var(--a2,0)))}
.msb .curl.next .face.back .sh,.msb .curl.prev .face.front .sh{background:linear-gradient(90deg,rgb(0 0 0 / var(--a2,0)),rgb(0 0 0 / var(--a1,0)))}
.msb .face .gl{position:absolute;left:0;right:0;top:var(--pg,21.8%);bottom:var(--pg,21.8%);pointer-events:none;background:var(--sheet);
  opacity:calc(var(--shade,0) * var(--lit,1) * var(--lit,1) * .20)}
.msb .loupe{position:absolute;left:0;top:0;width:var(--lr,270px);height:var(--lr,270px);pointer-events:none;z-index:80;opacity:0;
  transition:opacity .25s ease;will-change:transform}
.msb .loupe.on{opacity:1}
.msb .loupe.held .ring{cursor:grabbing}
.msb .loupe .ring{position:absolute;inset:0;border-radius:50%;pointer-events:auto;cursor:grab;padding:calc(var(--lr,270px) * .058);
  box-shadow:0 1px 2px rgb(0 0 0 / 30%),0 10px 18px rgb(0 0 0 / 24%),0 26px 40px rgb(0 0 0 / 20%),0 48px 66px rgb(0 0 0 / 13%)}
.msb .loupe .ring:before{content:"";position:absolute;inset:0;border-radius:50%;pointer-events:none;
  background:linear-gradient(146deg,color-mix(in srgb,var(--earth) 8%,white) 0%,color-mix(in srgb,var(--earth) 35%,white) 14%,color-mix(in srgb,var(--earth) 75%,white) 32%,color-mix(in srgb,var(--earth) 70%,black) 50%,color-mix(in srgb,var(--earth) 45%,white) 66%,color-mix(in srgb,var(--earth) 12%,white) 80%,var(--earth) 100%);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.8),inset 0 -2px 3px rgb(0 0 0 / 50%);
  -webkit-mask-image:radial-gradient(circle closest-side at 50% 50%,transparent 0 88.2%,#000 89.8% 100%);
  mask-image:radial-gradient(circle closest-side at 50% 50%,transparent 0 88.2%,#000 89.8% 100%)}
.msb .loupe .grip{position:absolute;left:50%;top:50%;width:calc(var(--lr,270px) * .74);height:calc(var(--lr,270px) * .125);
  transform-origin:0 50%;transform:rotate(40deg) translate(calc(var(--lr,270px) * .33),-50%);border-radius:calc(var(--lr,270px) * .06);
  pointer-events:auto;cursor:grab;
  background:linear-gradient(180deg,rgba(255,255,255,.46) 0 13%,rgba(255,255,255,0) 44%,rgba(0,0,0,.26) 100%),
    linear-gradient(90deg,color-mix(in srgb,var(--ink) 40%,white) 0 14%,color-mix(in srgb,var(--ink) 70%,white) 14% 20%,var(--ink) 20% 62%,color-mix(in srgb,var(--ink) 80%,black) 62% 92%,rgb(0 0 0 / 50%) 92% 100%);
  box-shadow:0 8px 15px rgb(0 0 0 / 26%),0 18px 26px rgb(0 0 0 / 14%)}
.msb .lens{position:relative;display:block;width:100%;height:100%;border-radius:50%;background-repeat:no-repeat;overflow:hidden;
  box-shadow:inset 0 0 0 1px rgb(0 0 0 / 55%),inset 0 4px 12px rgb(0 0 0 / 28%),inset 0 -7px 16px color-mix(in srgb,var(--paper) 14%,transparent)}
.msb .zoomwrap{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2;opacity:0}
.msb .zoominner{position:absolute;inset:0;transform-origin:0 0}
.msb .lens:before,.msb .lens:after{content:"";position:absolute;inset:0;border-radius:50%;pointer-events:none}
.msb .lens:before{z-index:1;background:radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 54%,rgb(0 0 0 / 10%) 76%,rgb(0 0 0 / 34%) 100%);
  box-shadow:inset 0 0 0 2px rgb(0 0 0 / 20%),inset 0 0 0 4px color-mix(in srgb,var(--earth) 15%,transparent)}
.msb .lens:after{z-index:2;background:radial-gradient(36% 26% at 29% 19%,rgba(255,255,255,.30),rgba(255,255,255,0) 76%),
  radial-gradient(24% 16% at 74% 86%,rgba(255,255,255,.12),rgba(255,255,255,0) 80%),
  linear-gradient(150deg,rgba(255,255,255,.06) 0 18%,rgba(255,255,255,0) 42%)}
.msb .sb-tools{display:flex;align-items:center;gap:6px;border:1px solid var(--hairline);border-radius:999px;padding:5px 7px;
  background:color-mix(in srgb,var(--paper) 62%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.msb .tool{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:50%;
  background:transparent;color:var(--ink-soft);cursor:pointer;transition:background-color .18s ease,color .18s ease}
.msb .tool:hover{background:color-mix(in srgb,var(--paper) 90%,transparent);color:var(--ink)}
.msb .tool[aria-pressed="true"]{background:color-mix(in srgb,var(--earth) 16%,transparent);color:var(--earth)}
.msb .tool:disabled{opacity:.32;cursor:default;background:transparent}
.msb .tool svg{width:15px;height:15px;display:block}
.msb .tool-sep{width:1px;height:17px;background:var(--hairline);margin:0 2px}
.msb .zoom-read{font-size:11px;letter-spacing:.1em;color:var(--ink-faint);min-width:40px;text-align:center;font-variant-numeric:tabular-nums}
@media (pointer:coarse){.msb .loupe{display:none}}
.msb .sb-zone{position:absolute;top:0;bottom:0;border:0;background:transparent;cursor:grab;z-index:60;-webkit-tap-highlight-color:transparent}
.msb .sb-zone:active{cursor:grabbing}
.msb .sb-prev{left:0;width:50%}
.msb .sb-next{right:0;width:50%}
.msb .sb-captions{display:grid;justify-items:center;min-height:18px}
.msb .sb-captions>*{grid-area:1/1;margin:0}
.msb .sb-caption{font-size:13px;letter-spacing:var(--track-caps);text-transform:uppercase;color:var(--ink-soft);animation:msb-cap-in .5s ease both}
.msb .sb-caption.live{animation:none}
@keyframes msb-cap-in{0%{opacity:0}}
.msb .sb-hint{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint);transition:opacity .4s ease}
.msb .sb-hint.gone{opacity:0}
.msb .sb-wrap.intro .sb-full img,.msb .sb-wrap.intro .sb-half-img{filter:url(#msb-mblur-1)}
.msb .sb-wrap.intro.b2 .sb-full img,.msb .sb-wrap.intro.b2 .sb-half-img{filter:url(#msb-mblur-2)}
.msb .sb-wrap.intro .sb-caption{animation:none}
@media (max-width:640px){
  .msb .hero{padding:4px 0}
  .msb .sb-wrap{gap:5px}
  .msb .sb-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:70;padding:12px 6px}
  .msb .sb-arrow.left{left:2px}
  .msb .sb-arrow.right{right:2px}
  .msb .sb-3d{max-width:100%}
  .msb .sb-hint{font-size:9.5px;letter-spacing:.1em;padding:0 16px;text-align:center}
}
`;

/* the turning leaf */
const N = 18; /* strips — enough for a smooth curve */
const SPAN = 0.449; /* gutter → outer page edge, as a fraction */
const BETA = 0.6; /* peak curl of the arc, radians */
const TILT_X = 4.5,
  TILT_Y = 7;
const ZOOM_MIN = 0.9,
  ZOOM_MAX = 1.5;

export function DraftFolio({
  pages = DEFAULT_PAGES,
  startPage = 2,
  intro = true,
  magnification = 1.8,
  hint = "Drag a leaf to turn it · Slide the loupe to read",
  paperColor = "hsl(var(--background))",
  inkColor = "hsl(var(--foreground))",
  accentColor = "hsl(var(--primary))",
  sheetColor = "hsl(var(--card))",
  className,
}: DraftFolioProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const pagesKey = useMemo(() => JSON.stringify(pages), [pages]);
  const [themeKey, setThemeKey] = useState(0);

  useEffect(() => {
    // the spreads are painted on a canvas, so repaint them when the theme or palette changes
    const observer = new MutationObserver(() => setThemeKey((k) => k + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const PAGES: (DraftFolioPage & { url: string })[] = (
      JSON.parse(pagesKey) as DraftFolioPage[]
    ).map((p) => ({
      ...p,
      url: "",
    }));
    const M = PAGES.length;
    if (!M) return;
    const LAND = ((startPage % M) + M) % M;
    const REDUCED = !!prefersReducedMotion;
    const MAG = magnification;
    const q = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;
    const wrap = q<HTMLDivElement>(".sb-wrap");
    const stage = q<HTMLDivElement>(".sb-stage");
    const sb3d = q<HTMLDivElement>(".sb-3d");
    const book = q<HTMLDivElement>(".sb-book");
    const capBox = q<HTMLDivElement>(".sb-captions");
    const hintEl = q<HTMLParagraphElement>(".sb-hint");
    const loupe = q<HTMLDivElement>(".loupe");
    const zoomWrap = q<HTMLDivElement>(".zoomwrap");
    const zoomInner = q<HTMLDivElement>(".zoominner");
    const zRead = q<HTMLSpanElement>(".zoom-read");
    const loupeBtn = q<HTMLButtonElement>("[data-loupe]");
    const zInBtn = q<HTMLButtonElement>("[data-zin]");
    const zOutBtn = q<HTMLButtonElement>("[data-zout]");
    const leftBtn = q<HTMLButtonElement>(".sb-arrow.left");
    const rightBtn = q<HTMLButtonElement>(".sb-arrow.right");

    let disposed = false;
    let booted = false;
    let visible = false;
    const objectUrls: string[] = [];
    const timers: number[] = [];

    type Turn = { dir: "next" | "prev"; from: number; to: number; t: number };
    let idx = 0,
      turn: Turn | null = null;
    let strips: HTMLDivElement[] = [];

    const el = (t: string, c?: string) => {
      const e = document.createElement(t);
      if (c) e.className = c;
      return e;
    };
    function imgEl(i: number, side: string) {
      const im = new Image();
      im.className = "sb-half-img " + side;
      im.draggable = false;
      im.alt = "";
      im.src = PAGES[i].url;
      return im;
    }
    function halfEl(pos: string, i: number) {
      const d = el("div", "sb-half " + pos);
      d.appendChild(imgEl(i, pos));
      d.appendChild(el("div", "gutter-shade " + pos));
      return d;
    }
    /* build the strip chain once per turn; background offsets are pure
       geometry, so they never need touching again while it animates */
    function buildCurl(dir: string, from: number, to: number) {
      strips = [];
      const c = el("div", "curl " + dir);
      c.style.setProperty("--n", String(N));
      c.style.setProperty("--span", String(SPAN));
      let host: HTMLElement = c;
      for (let i = 0; i < N; i++) {
        const s = el("div", "strip") as HTMLDivElement;
        s.style.setProperty("--i", String(i));
        const gut = "calc(var(--bw) * 0.5)";
        const sw = "calc(var(--bw) * " + SPAN + " / " + N + ")";
        const A = "calc(-1 * (" + gut + " + " + i + " * " + sw + "))";
        const B = "calc(" + (i + 1) + " * " + sw + " - " + gut + ")";
        const f = el("div", "face front"),
          b = el("div", "face back");
        const dress = (e: HTMLElement, url: string, px: string) => {
          e.style.backgroundImage = "url(" + url + ")";
          e.style.backgroundPositionX = px;
        };
        dress(f, PAGES[from].url, dir === "next" ? A : B);
        dress(b, PAGES[to].url, dir === "next" ? B : A);
        f.appendChild(el("div", "sh"));
        f.appendChild(el("div", "gl"));
        b.appendChild(el("div", "sh"));
        b.appendChild(el("div", "gl"));
        s.appendChild(f);
        s.appendChild(b);
        if (i === N - 1) s.classList.add("edge");
        host.appendChild(s);
        host = s;
        strips.push(s);
      }
      return c;
    }
    function applyTurn(t: number) {
      const th = Math.PI * t;
      const beta = BETA * Math.sin(Math.PI * t);
      const D = 180 / Math.PI;
      const tt = th + beta,
        td = (2 * beta) / N;
      sb3d.style.setProperty("--tt", (tt * D).toFixed(2) + "deg");
      sb3d.style.setProperty("--td", (td * D).toFixed(3) + "deg");
      sb3d.style.setProperty("--shade", Math.sin(Math.PI * t).toFixed(3));
      fadeCaption(t);
      for (let i = 0; i < strips.length; i++) {
        const l1 = Math.abs(Math.cos(tt - i * td));
        const l2 = Math.abs(Math.cos(tt - (i + 1) * td));
        const st = strips[i].style;
        st.setProperty("--lit", l1.toFixed(3));
        st.setProperty("--a1", ((1 - l1) * 0.62).toFixed(3));
        st.setProperty("--a2", ((1 - l2) * 0.62).toFixed(3));
      }
    }
    function paint() {
      book.textContent = "";
      if (!turn) {
        const f = el("div", "sb-full");
        const im = new Image();
        im.src = PAGES[idx].url;
        im.alt = PAGES[idx].title;
        im.draggable = false;
        f.appendChild(im);
        book.appendChild(f);
        sb3d.style.setProperty("--shade", "0");
      } else {
        const next = turn.dir === "next";
        book.appendChild(halfEl("left", next ? turn.from : turn.to));
        book.appendChild(halfEl("right", next ? turn.to : turn.from));
        book.appendChild(buildCurl(turn.dir, turn.from, turn.to));
        applyTurn(turn.t);
      }
      const a = el("button", "sb-zone sb-prev"),
        b = el("button", "sb-zone sb-next");
      a.setAttribute("aria-label", "previous page");
      b.setAttribute("aria-label", "next page");
      book.appendChild(a);
      book.appendChild(b);
      layout();
      caption();
      syncZoomLayer();
      placeLoupe();
    }
    let capOut: HTMLElement | null = null,
      capIn: HTMLElement | null = null;
    function caption() {
      capBox.textContent = "";
      capOut = capIn = null;
      if (turn) {
        capOut = el("p", "sb-caption live");
        capOut.textContent = PAGES[turn.from].title;
        capBox.appendChild(capOut);
        capIn = el("p", "sb-caption live");
        capIn.textContent = PAGES[turn.to].title;
        capBox.appendChild(capIn);
        fadeCaption(turn.t);
      } else {
        const p = el("p", "sb-caption");
        p.textContent = PAGES[idx].title;
        capBox.appendChild(p);
      }
    }
    function fadeCaption(t: number) {
      if (!capOut || !capIn) return;
      /* the old title is gone before the new one arrives */
      const out = 1 - Math.max(0, Math.min(1, (t - 0.1) / 0.28));
      const inn = Math.max(0, Math.min(1, (t - 0.56) / 0.3));
      capOut.style.opacity = out.toFixed(3);
      capIn.style.opacity = inn.toFixed(3);
    }
    function layout() {
      sb3d.style.setProperty("--bw", book.clientWidth + "px");
    }

    /* spring loop */
    type Motion =
      | { kind: "spring"; v: number; target: number; done?: () => void; k: number; c: number }
      | { kind: "tween"; from: number; target: number; dur: number; e: number; done?: () => void };
    let spring: Motion | null = null;
    function animateTo(target: number, onDone: () => void, stiff?: number, damp?: number) {
      spring = { kind: "spring", v: 0, target, done: onDone, k: stiff || 150, c: damp || 22 };
      kick();
    }
    function tweenTo(target: number, dur: number, onDone: () => void) {
      spring = { kind: "tween", from: turn ? turn.t : 0, target, dur, e: 0, done: onDone };
      kick();
    }
    let raf: number | null = null,
      last = 0;
    function tick(now: number) {
      raf = null;
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
      last = now;
      if (spring && turn) {
        const s = spring;
        if (s.kind === "tween") {
          s.e += dt;
          const k = Math.min(1, s.e / s.dur);
          turn.t = s.from + (s.target - s.from) * k;
          applyTurn(turn.t);
          if (k >= 1) {
            spring = null;
            s.done?.();
          }
        } else {
          const x = turn.t - s.target;
          s.v += (-s.k * x - s.c * s.v) * dt;
          turn.t += s.v * dt;
          if (Math.abs(turn.t - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
            turn.t = s.target;
            spring = null;
            applyTurn(turn.t);
            s.done?.();
          } else applyTurn(turn.t);
        }
      }
      viewSpring();
      const lmoved = loupeEase();
      if ((spring || viewActive || lmoved) && raf === null && !disposed)
        raf = requestAnimationFrame(tick);
    }
    function kick() {
      if (raf === null && !disposed) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }

    /* tilt + zoom of the book */
    const view = { rx: 0, ry: 0, z: 1, trx: 0, try_: 0, tz: 1 };
    let viewActive = false;
    let lastZ = 1;
    function applyView() {
      sb3d.style.setProperty("--rx", view.rx.toFixed(2) + "deg");
      sb3d.style.setProperty("--ry", view.ry.toFixed(2) + "deg");
      sb3d.style.setProperty("--zoom", view.z.toFixed(3));
      if (view.z !== lastZ) {
        lastZ = view.z;
        placeLoupe();
      }
    }
    function viewSpring() {
      const e = 0.14;
      let moved = false;
      for (const [k, t] of [
        ["rx", "trx"],
        ["ry", "try_"],
        ["z", "tz"],
      ] as const) {
        const d = view[t] - view[k];
        if (Math.abs(d) > 0.0006) {
          view[k] += d * e;
          moved = true;
        } else view[k] = view[t];
      }
      if (moved) applyView();
      viewActive = moved;
      return moved;
    }
    function setView(rx: number, ry: number, z: number) {
      view.trx = Math.max(-TILT_X, Math.min(TILT_X, rx));
      view.try_ = Math.max(-TILT_Y, Math.min(TILT_Y, ry));
      view.tz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
      viewActive = true;
      kick();
      syncZoom();
    }
    /* the book leans toward the cursor — no dragging, and never far */
    function tiltTo(cx: number, cy: number) {
      if (drag) return;
      const r = book.getBoundingClientRect();
      if (!r.width) return;
      const nx = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width * 0.62)));
      const ny = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height * 0.9)));
      setView(-ny * TILT_X, nx * TILT_Y, view.tz);
    }
    const onWinMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !visible || REDUCED) return;
      tiltTo(e.clientX, e.clientY);
    };
    const onWinOut = (e: PointerEvent) => {
      if (!e.relatedTarget) setView(0, 0, view.tz);
    };
    const onBlur = () => setView(0, 0, view.tz);
    const onDbl = () => setView(view.trx, view.try_, 1);

    /* pointer work */
    let drag: {
      dir: "next" | "prev";
      x0: number;
      w: number;
      moved: number;
      vel: number;
      tPrev: number;
    } | null = null;
    const hideHint = () => hintEl.classList.add("gone");
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !booted) return;
      const onBook = (e.target as HTMLElement).closest(".sb-zone");
      if ((e.target as HTMLElement).closest(".sb-arrow")) return;
      e.preventDefault();
      stage.setPointerCapture(e.pointerId);
      hideHint();
      if (!onBook || introOn) return;
      const r = book.getBoundingClientRect();
      const dir = (e.clientX - r.left) / r.width > 0.5 ? "next" : "prev";
      startTurn(dir, 0);
      drag = { dir, x0: e.clientX, w: r.width, moved: 0, vel: 0, tPrev: performance.now() };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      const raw = (drag.dir === "next" ? -dx : dx) / (drag.w * 0.62);
      const t = Math.max(0, Math.min(1, raw));
      const now = performance.now();
      drag.vel = (t - (turn ? turn.t : 0)) / Math.max(0.001, (now - drag.tPrev) / 1000);
      drag.tPrev = now;
      if (turn) {
        turn.t = t;
        applyTurn(t);
      }
    };
    const endDrag = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!turn) return;
      if (d.moved < 6) {
        commit();
        return;
      }
      const go = turn.t > 0.42 || d.vel > 1.1;
      if (go) commit();
      else cancel();
    };
    const prevent = (e: Event) => e.preventDefault();

    /* turn control */
    function startTurn(dir: "next" | "prev", t: number) {
      spring = null;
      if (turn) {
        idx = turn.to;
        turn = null;
      }
      shoveLoupe(dir);
      const from = idx;
      turn = { dir, from, to: dir === "next" ? (from + 1) % M : (from - 1 + M) % M, t: t || 0 };
      paint();
    }
    function commit() {
      if (!turn) return;
      if (REDUCED) {
        idx = turn.to;
        turn = null;
        paint();
        return;
      }
      animateTo(
        1,
        () => {
          if (turn) idx = turn.to;
          turn = null;
          paint();
        },
        170,
        26,
      );
    }
    function cancel() {
      if (!turn) return;
      animateTo(
        0,
        () => {
          turn = null;
          paint();
        },
        150,
        24,
      );
    }
    function step(dir: "next" | "prev") {
      if (!booted) return;
      if (introOn) endIntro();
      if (turn) {
        idx = turn.to;
        turn = null;
      }
      startTurn(dir, 0);
      commit();
    }
    const onLeft = () => step("prev");
    const onRight = () => step("next");
    const onKey = (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      hideHint();
      step(e.key === "ArrowRight" ? "next" : "prev");
    };

    /* loupe + controls */
    let loupeOn = true,
      lx: number | null = null,
      ly: number | null = null,
      lgrab: { cx: number; cy: number; lx0: number; ly0: number } | null = null,
      lTarget: { x: number; y: number } | null = null;
    const loupeSize = () => Math.round(Math.max(165, Math.min(262, book.clientWidth * 0.235)));
    const bookBox = () => ({ x: 0, y: 0, w: book.clientWidth, h: book.clientHeight });
    function restLoupe() {
      const b = bookBox();
      lx = b.x + b.w * 0.88;
      ly = b.y + b.h * 0.855;
      placeLoupe();
    }
    function syncZoomLayer() {
      zoomInner.textContent = "";
      for (const c of Array.from(book.children)) {
        if (c.classList.contains("sb-zone")) continue;
        zoomInner.appendChild(c.cloneNode(true));
      }
    }
    function placeLoupe() {
      if (lx === null || ly === null) return;
      const B = bookBox(),
        bw = B.w,
        bh = B.h;
      if (!bw) return;
      const R = loupeSize() / 2,
        bez = R * 2 * 0.058;
      loupe.style.setProperty("--lr", R * 2 + "px");
      loupe.style.transform =
        "translate3d(" + (lx - R).toFixed(1) + "px," + (ly - R).toFixed(1) + "px,0)";
      if (loupeOn) loupe.classList.add("on");
      const z = view.z,
        cx = bw / 2,
        cy = bh / 2;
      const x0 = cx + (bw * 0.051 - cx) * z,
        x1 = cx + (bw * 0.949 - cx) * z;
      const y0 = cy + (bh * 0.218 - cy) * z,
        y1 = cy + (bh * 0.782 - cy) * z;
      const nx = Math.max(x0, Math.min(lx, x1));
      const ny = Math.max(y0, Math.min(ly, y1));
      const inside =
        lx > x0 && lx < x1 && ly > y0 && ly < y1
          ? Math.min(lx - x0, x1 - lx, ly - y0, y1 - ly)
          : -Math.hypot(lx - nx, ly - ny);
      const k = Math.max(0, Math.min(1, (inside + R * 0.3) / (R * 0.55)));
      zoomWrap.style.opacity = (loupeOn ? k : 0).toFixed(3);
      if (k <= 0.002) return;
      const r = (R - bez).toFixed(1);
      const mask =
        "radial-gradient(circle " +
        r +
        "px at " +
        lx.toFixed(1) +
        "px " +
        ly.toFixed(1) +
        "px,#000 calc(100% - 1px),transparent 100%)";
      zoomWrap.style.webkitMaskImage = mask;
      zoomWrap.style.maskImage = mask;
      const px = cx + (lx - cx) / z,
        py = cy + (ly - cy) / z,
        s = MAG * z;
      zoomInner.style.transform =
        "translate(" +
        (lx - px * s).toFixed(1) +
        "px," +
        (ly - py * s).toFixed(1) +
        "px) scale(" +
        s.toFixed(4) +
        ")";
    }
    /* the leaf shoves the glass aside as it sweeps past */
    function shoveLoupe(dir: string) {
      if (!loupeOn || lx === null || ly === null || lgrab) return;
      const b = bookBox();
      const nx = (b.w / 2 + (lx - b.x - b.w / 2) / view.z) / b.w,
        ny = (b.h / 2 + (ly - b.y - b.h / 2) / view.z) / b.h;
      if (nx < 0.02 || nx > 0.98 || ny < 0.17 || ny > 0.83) return;
      lTarget = { x: b.x + b.w * (dir === "next" ? 0.12 : 0.88), y: b.y + b.h * 0.855 };
      kick();
    }
    function loupeEase() {
      if (!lTarget || lx === null || ly === null) return false;
      if (lgrab) {
        lTarget = null;
        return false;
      }
      const dx = lTarget.x - lx,
        dy = lTarget.y - ly;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        lx = lTarget.x;
        ly = lTarget.y;
        lTarget = null;
        placeLoupe();
        return false;
      }
      lx += dx * 0.17;
      ly += dy * 0.17;
      placeLoupe();
      return true;
    }
    const onLoupeDown = (e: PointerEvent) => {
      if (!loupeOn || e.button !== 0 || lx === null || ly === null) return;
      e.preventDefault();
      e.stopPropagation();
      lTarget = null;
      lgrab = { cx: e.clientX, cy: e.clientY, lx0: lx, ly0: ly };
      loupe.classList.add("held");
      loupe.setPointerCapture(e.pointerId);
      hideHint();
    };
    const onLoupeMove = (e: PointerEvent) => {
      if (!lgrab) return;
      const b = bookBox(),
        R = loupeSize() / 2;
      lx = Math.max(
        b.x - R * 0.7,
        Math.min(b.x + b.w + R * 0.7, lgrab.lx0 + (e.clientX - lgrab.cx)),
      );
      ly = Math.max(
        b.y - R * 0.7,
        Math.min(b.y + b.h + R * 1.0, lgrab.ly0 + (e.clientY - lgrab.cy)),
      );
      placeLoupe();
    };
    const dropLoupe = () => {
      lgrab = null;
      loupe.classList.remove("held");
    };
    const onLoupeBtn = () => {
      loupeOn = !loupeOn;
      loupeBtn.setAttribute("aria-pressed", String(loupeOn));
      loupe.classList.toggle("on", loupeOn);
      if (loupeOn && lx === null) restLoupe();
      else placeLoupe();
    };
    function syncZoom() {
      zRead.textContent = Math.round(view.tz * 100) + "%";
      zOutBtn.disabled = view.tz <= ZOOM_MIN + 0.001;
      zInBtn.disabled = view.tz >= ZOOM_MAX - 0.001;
    }
    const onZIn = () => {
      setView(view.trx, view.try_, view.tz * 1.16);
      hideHint();
    };
    const onZOut = () => {
      setView(view.trx, view.try_, view.tz / 1.16);
      hideHint();
    };

    /* the riffle */
    let riffle: { bell: number; dur: number }[] = [],
      riffleAt = 0,
      introOn = false;
    function endIntro() {
      introOn = false;
      wrap.classList.remove("intro", "b2");
    }
    function riffleStep() {
      const s = riffle[riffleAt];
      wrap.classList.toggle("b2", s.bell > 0.55);
      startTurn("next", 0);
      tweenTo(1, s.dur, () => {
        if (turn) idx = turn.to;
        turn = null;
        riffleAt++;
        if (introOn && riffleAt < riffle.length) {
          paint();
          riffleStep();
        } else {
          endIntro();
          paint();
        }
      });
    }
    let introPending = true;
    function startIntro() {
      const coarse = matchMedia("(max-width: 640px), (pointer: coarse)").matches;
      if (coarse || REDUCED || !intro || M < 2) {
        idx = LAND;
        paint();
        return;
      }
      const steps = M + LAND;
      riffle = [];
      for (let r = 0; r < steps; r++) {
        const bell = Math.sin(Math.PI * (r / (steps - 1)));
        riffle.push({ bell, dur: 0.26 - 0.19 * bell });
      }
      riffleAt = 0;
      introOn = true;
      wrap.classList.add("intro");
      riffleStep();
    }

    const ro = new ResizeObserver(() => {
      layout();
      if (booted) {
        lx = null;
        restLoupe();
      }
    });
    ro.observe(book);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && booted && introPending) {
        introPending = false;
        timers.push(window.setTimeout(startIntro, 220));
      }
    });
    io.observe(root);

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("dragstart", prevent);
    stage.addEventListener("selectstart", prevent);
    stage.addEventListener("dblclick", onDbl);
    leftBtn.addEventListener("click", onLeft);
    rightBtn.addEventListener("click", onRight);
    loupe.addEventListener("pointerdown", onLoupeDown);
    loupe.addEventListener("pointermove", onLoupeMove);
    loupe.addEventListener("pointerup", dropLoupe);
    loupe.addEventListener("pointercancel", dropLoupe);
    loupeBtn.addEventListener("click", onLoupeBtn);
    zInBtn.addEventListener("click", onZIn);
    zOutBtn.addEventListener("click", onZOut);
    window.addEventListener("pointermove", onWinMove, { passive: true });
    window.addEventListener("pointerout", onWinOut);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKey);

    /* boot */
    (async () => {
      const sheet = sheetColor;
      const urls = await Promise.all(PAGES.map((p) => composeSpread(p, sheet, inkColor)));
      if (disposed) {
        urls.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u));
        return;
      }
      urls.forEach((u, i) => {
        PAGES[i].url = u;
        if (u.startsWith("blob:")) objectUrls.push(u);
      });
      await Promise.all(
        PAGES.map((p) => {
          const im = new Image();
          im.src = p.url;
          return im.decode().catch(() => {});
        }),
      );
      if (disposed) return;
      idx = intro && !REDUCED ? 0 : LAND;
      paint();
      applyView();
      syncZoom();
      restLoupe();
      booted = true;
      if (visible && introPending) {
        introPending = false;
        timers.push(window.setTimeout(startIntro, 220));
      }
    })();

    return () => {
      disposed = true;
      if (raf !== null) cancelAnimationFrame(raf);
      timers.forEach((t) => clearTimeout(t));
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", endDrag);
      stage.removeEventListener("dragstart", prevent);
      stage.removeEventListener("selectstart", prevent);
      stage.removeEventListener("dblclick", onDbl);
      leftBtn.removeEventListener("click", onLeft);
      rightBtn.removeEventListener("click", onRight);
      loupe.removeEventListener("pointerdown", onLoupeDown);
      loupe.removeEventListener("pointermove", onLoupeMove);
      loupe.removeEventListener("pointerup", dropLoupe);
      loupe.removeEventListener("pointercancel", dropLoupe);
      loupeBtn.removeEventListener("click", onLoupeBtn);
      zInBtn.removeEventListener("click", onZIn);
      zOutBtn.removeEventListener("click", onZOut);
      window.removeEventListener("pointermove", onWinMove);
      window.removeEventListener("pointerout", onWinOut);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKey);
      book.textContent = "";
      zoomInner.textContent = "";
      capBox.textContent = "";
      wrap.classList.remove("intro", "b2");
      loupe.classList.remove("on", "held");
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [
    pagesKey,
    startPage,
    intro,
    magnification,
    sheetColor,
    inkColor,
    prefersReducedMotion,
    themeKey,
  ]);

  return (
    <div
      ref={rootRef}
      className={cn("msb absolute inset-0 overflow-hidden", className)}
      style={
        {
          background: paperColor,
          "--paper": paperColor,
          "--ink": inkColor,
          "--earth": accentColor,
          "--sheet": sheetColor,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="wash" aria-hidden="true" />
      <section className="hero">
        <div className="sb-wrap">
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <filter id="msb-mblur-1">
              <feGaussianBlur stdDeviation="5 0" />
            </filter>
            <filter id="msb-mblur-2">
              <feGaussianBlur stdDeviation="14 0" />
            </filter>
          </svg>
          <div className="sb-stage">
            <button className="sb-arrow left" aria-label="previous page">
              <svg viewBox="0 0 14 44" width="14" height="44" fill="none" aria-hidden="true">
                <polyline
                  points="11,3 3,22 11,41"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="sb-3d">
              <div className="sb-tilt">
                <div className="sb-cast ambient" aria-hidden="true" />
                <div className="sb-cast contact" aria-hidden="true" />
                <div className="sb-cast hair" aria-hidden="true" />
                <div className="sb-book" />
              </div>
              <div className="zoomwrap" aria-hidden="true">
                <div className="zoominner" />
              </div>
              <div className="loupe">
                <span className="grip" />
                <span className="ring">
                  <span className="lens" />
                </span>
              </div>
            </div>
            <button className="sb-arrow right" aria-label="next page">
              <svg viewBox="0 0 14 44" width="14" height="44" fill="none" aria-hidden="true">
                <polyline
                  points="3,3 11,22 3,41"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="sb-captions" aria-live="polite" />
          <div className="sb-tools" role="group" aria-label="view controls">
            <button className="tool" data-zout="" aria-label="zoom out">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <circle cx="8.6" cy="8.6" r="5.6" />
                <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8" />
              </svg>
            </button>
            <span className="zoom-read">100%</span>
            <button className="tool" data-zin="" aria-label="zoom in">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <circle cx="8.6" cy="8.6" r="5.6" />
                <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8M8.6 6.2v4.8" />
              </svg>
            </button>
            <span className="tool-sep" aria-hidden="true" />
            <button className="tool" data-loupe="" aria-label="magnifier" aria-pressed="true">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <circle cx="8.8" cy="8.8" r="5.8" />
                <path d="M13 13l4.4 4.4" />
                <path d="M6.4 7.2a3.2 3.2 0 0 1 2.4-1.4" opacity=".55" />
              </svg>
            </button>
          </div>
          <p className="sb-hint">{hint}</p>
        </div>
      </section>
    </div>
  );
}
