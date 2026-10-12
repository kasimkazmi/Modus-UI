"use client";
// Ported from ThreeUI Community's Liquid Metal Button (MIT, © 2026 Meng To).

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LiquidMetalButtonProps {
  /** Labelled pill, icon-only circle, or larger play circle. */
  variant?: "pill" | "circle" | "play";
  /** Play variant only: full colour or greyscale metal. */
  rendering?: "colored" | "monotone";
  /** Play variant only: button diameter in px (72 to 160). */
  diameter?: number;
  /** Play variant only: rim stroke width in px (1 to 8). */
  strokeWidth?: number;
  /** Label (pill) or accessible name. Defaults to "Sign up", "Add" or "Play". */
  text?: string;
  /** Flat dark ground instead of the ambient pool. */
  embedded?: boolean;
  onClick?: () => void;
  className?: string;
}

/* =====================================================================
   Liquid metal — a dispersion shader.

   A scalar field V is painted through a soft plateau: dark below it, blown
   white inside, dark above.  The plateau is evaluated once per spectral
   wavelength at a slightly different height in V, so the plateau's lower
   edge fringes warm and its upper edge fringes cool.
   ===================================================================== */

const VERT = `#version 300 es
in vec2 position; void main(){ gl_Position = vec4(position,0.,1.); }`;

const HEAD = `#version 300 es
precision highp float;
out vec4 o;

uniform vec2  uC;        // pill centre, device px
uniform vec2  uHalf;     // pill half-extent, device px
uniform float uT;        // seconds
uniform float uHover;    // 0..1
uniform float uPress;    // 0..1, eased
uniform vec4  uRip[3];   // xy centre (button heights, +y down), z start, w live
uniform vec4  uRipK;     // speed, ring width, decay, amplitude
uniform vec4  uRipK2;    // facet depth, facet count, crest sharpness, emission
uniform vec4  uPtr;      // xy trailing cursor, z strength, w normalised speed
uniform vec4  uPtrK;     // radius, base amplitude, speed amplitude, rim lift

#define PI 3.14159265

float sdPill(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return min(max(q.x,q.y),0.) + length(max(q,0.)) - r;
}

/* Expanding ring from each press, in button-height units.  Three slots so a
   quick double-tap overlaps instead of cutting the first one off.

   Two things keep it from reading as a water ripple: the wavefront is
   faceted rather than circular — its radius is modulated by angle, and the
   facets rotate as it travels — and the crest profile is a cusp rather than
   a gaussian, so it lands as a crease in sheet metal instead of a soft swell. */
float ripple(vec2 p, float t){
  float sum = 0.;
  for(int i = 0; i < 3; i++){
    if(uRip[i].w < 0.5) continue;
    float age = t - uRip[i].z;
    if(age < 0. || age > 4.) continue;
    vec2  rp = p - uRip[i].xy;
    float facet = 1. + uRipK2.x * cos(uRipK2.y * atan(rp.y, rp.x) + age * 2.1 + float(i) * 2.4);
    float x = (length(rp) - age * uRipK.x * facet) / uRipK.y;
    sum += exp(-pow(abs(x) + 1e-4, uRipK2.z)) * exp(-age * uRipK.z);
  }
  return sum;
}

/* A soft well under the cursor.  It lags behind the real pointer and swells
   with speed, so moving across the button drags the metal rather than sliding
   a static blob over it. */
float pointerW(vec2 p){
  if(uPtr.z < 0.001) return 0.;
  float d = length(p - uPtr.xy) / uPtrK.x;
  return exp(-d*d) * uPtr.z;
}
/* Displacing the sample point, not the field value, is what makes this read as
   liquid: the bands bulge and stretch around the cursor like a lens instead of
   just getting brighter under it. */
vec2 pointerWarp(vec2 p){
  float w = pointerW(p);
  if(w <= 0.) return vec2(0.);
  return normalize(p - uPtr.xy + vec2(1e-5)) * w * (uPtrK.y + uPtrK.z * uPtr.w);
}
`;

/* ---- the travelling rim, in its own pass so the blur below never touches it */
const FRAG_RIM =
  HEAD +
  `
uniform float uBw;       // stroke half-width, device px
uniform float uE[8];     // base, hot, chroma-across, chroma-along, speed,
                         // topBias, press lift, ripple lift

/* Arc-length position around the pill, 0..1, starting at the right-hand
   extreme and running counter-clockwise.  Straight runs and caps are measured
   in real length so a highlight travels at a constant speed all the way
   round instead of stalling on the caps. */
float perim(vec2 d, float a, float r){
  float P = 4.*a + 2.*PI*r;
  float s;
  if(d.x >= a){                                   // right cap
    float th = atan(d.y, d.x - a); if(th < 0.) th += 2.*PI;
    s = (th <= PI*0.5) ? r*th : P - r*(2.*PI - th);
  } else if(d.x <= -a){                           // left cap
    float th = atan(d.y, d.x + a); if(th < 0.) th += 2.*PI;
    s = r*PI*0.5 + 2.*a + r*(th - PI*0.5);
  } else if(d.y >= 0.){                           // top run
    s = r*PI*0.5 + (a - d.x);
  } else {                                        // bottom run
    s = r*PI*1.5 + 2.*a + (d.x + a);
  }
  return s / P;
}
// periodic bump, so a highlight wraps cleanly at s = 0
float pb(float u, float w){ u = fract(u); float x = min(u, 1.-u); return exp(-(x*x)/(w*w)); }

// travelling brightness around the rim — three lobes at different speeds and
// widths, which never quite re-align, so the light keeps re-pooling
float rimHot(float s, float t){
  float v = uE[0];
  v += 0.62 * pb(s - t*uE[4],             0.075);
  v += 0.44 * pb(s + t*uE[4]*0.63 + 0.41, 0.135);
  v += 0.30 * pb(s - t*uE[4]*0.34 + 0.73, 0.200);
  return v;
}
// soft band riding the pill edge, offset per channel to fringe across the stroke
float rimBand(float sd, float off){ return 1. - smoothstep(0., uBw*1.05, abs(sd + uBw*0.55 + off)); }

void main(){
  vec2  d  = gl_FragCoord.xy - uC;
  float sd = sdPill(d, uHalf, uHalf.y);
  if(sd > uBw*2.5 || sd < -uBw*3.5){ o = vec4(0.); return; }

  /* Each channel is offset both *across* the stroke and *along* it, so the rim
     fringes red-outside / cyan-inside and its hue also drifts as a highlight
     slides past — the two together are what read as metal rather than as a
     moving white dot. */
  float a = max(uHalf.x - uHalf.y, 0.);
  float s = perim(d, a, uHalf.y);
  float top = mix(1., 0.5 + 0.5 * (d.y / uHalf.y), uE[5]);

  // pressing lifts the whole outline, and each ripple flares it again as the
  // ring sweeps past — so the rim reports the press twice, once as a step and
  // once as a wave running round the edge
  // …and the stretch of outline nearest the cursor picks up a little too
  vec2  p   = vec2(d.x, -d.y) / (uHalf.y * 2.);
  float lift = 1. + uPress * uE[6] + ripple(p, uT) * uE[7]
             + pointerW(p) * uPtrK.w;

  o = vec4(vec3(
    rimBand(sd,  uE[2]) * rimHot(s + uE[3], uT),
    rimBand(sd,  0.   ) * rimHot(s,         uT),
    rimBand(sd, -uE[2]) * rimHot(s - uE[3], uT)
  ) * uE[1] * top * lift, 1.);
}`;

const FRAG_SCENE =
  HEAD +
  `
uniform float uP[21];    // tunables

float h21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  float a = h21(i), b = h21(i+vec2(1,0)), c = h21(i+vec2(0,1)), d = h21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y) * 2. - 1.;
}
// normalised to roughly -1..1; low gain keeps the first octave dominant, which
// is what keeps the ribbons big and smooth instead of turbulent
float fbm(vec2 p, float g){
  float s = 0., a = 1., n = 0.;
  for(int i=0;i<4;i++){ s += a*vn(p); n += a; p = p*2.03 + 11.7; a *= g; }
  return s / n;
}
float fbm(vec2 p){ return fbm(p, 0.5); }

/* p is in button-height units, +y down, origin at the pill centre.

   The bands in the reference are a *family of parallel curves*: one swooping
   valley repeated up the button, dense where the light is pinched and pulled
   wide open where it is not.  So the field is built that way explicitly —

       V = (y - valley(x)) * density(x)

   — rather than hoping 2-D noise happens to produce it.  Level sets of V are
   all vertical translates of the same valley curve, which is what makes the
   ribbons laminar and near-parallel; a density that varies along x is what makes
   them crowd into razor fringes at one end and open into a broad wash at the
   other.  A soft plateau over V then paints them, sampled once per
   wavelength at slightly offset heights, so every edge opens into a prism of
   width dispersion / |grad V|.                                             */

// smooth 1-D wiggle that drifts slowly with time
float wig(float x, float t, float seed){
  return vn(vec2(x,          t*0.150 + seed)) * 0.60
       + vn(vec2(x*2.07 + 4., t*0.105 + seed)) * 0.27
       + vn(vec2(x*4.30 - 7., t*0.080 + seed)) * 0.13;
}

float valleyAt(vec2 p, float t){ return wig(p.x*uP[0], t, 0.0) * uP[1]; }
float densAt  (vec2 p, float t){ return uP[2] * exp(uP[3] * wig(p.x*uP[4] + 9.0, t, 2.7)); }

float surface(vec2 p, float t){
  float V = (p.y - valleyAt(p,t)) * densAt(p,t);
  V += uP[5] * fbm(p*vec2(0.8, 1.7)*uP[6] + vec2(t*0.05, -t*0.03), uP[17]);
  return V - uP[7];
}
// One plateau per unit of V — so the density is literally bands per button height.
// A plateau rather than a step is what puts warm on the low edge and cool on
// the high edge of every ribbon.
float tone(float v){
  float u = fract(v);
  float e = uP[9], W = uP[10] * 0.5;
  return smoothstep(0.5-W-e, 0.5-W, u) * (1. - smoothstep(0.5+W, 0.5+W+e, u));
}
vec3 spec(float t){ return clamp(vec3(1.5) - abs(4.*t - vec3(3.,2.,1.)), 0., 1.); }

void main(){
  vec2  d  = gl_FragCoord.xy - uC;
  float sd = sdPill(d, uHalf, uHalf.y);
  float pill = 1. - smoothstep(-1., 1., sd);
  float S = uHalf.y * 2.;                 // button height, device px
  float t = uT;

  // rgb is premultiplied by the mask and alpha carries it, so the blur that
  // follows can normalise and keep a clean edge instead of a dark vignette
  if(uHover <= 0.0015 || pill <= 0.0015){ o = vec4(0., 0., 0., pill); return; }

  vec2  p = vec2(d.x, -d.y) / S;          // gl_FragCoord is y-up
  vec2  q = p + pointerWarp(p);           // the cursor drags the sheet

  // self-refraction: bend the lookup along the field's own slope, which piles
  // iso-lines up into folds instead of leaving them evenly spaced
  float h0 = surface(q, t);
  vec2  gp = vec2(dFdx(h0), -dFdy(h0)) * S;          // grad in p-units
  float V  = surface(q - gp * uP[8] / max(uP[2], .001), t);

  // gradient-aligned filaments: fast variation across the iso-lines, slow
  // along them, so the fine detail reads as drawn-out fibres of light
  vec2  gd = normalize(gp + vec2(1e-5));
  V += uP[13] * fbm(vec2(dot(q,gd)*uP[14], dot(q, vec2(-gd.y,gd.x))*uP[14]*0.04) + vec2(0., t*0.06));

  // press ripple: displacing the field rather than adding light means the
  // bands themselves bow outwards as the ring passes, which is what sells it
  // as a disturbance *in* the metal instead of a decal over it
  float rip  = ripple(p, t);
  float well = pointerW(p);
  V += rip * uRipK.w;

  // Real dispersion is not linear in wavelength — the blue end bends far more
  // than the red (Cauchy).  Skewing the sample offsets the same way is what
  // gives the reference its broad cool wash against a tight warm edge.
  const int N = 21;
  float mid = 1. - pow(0.5, uP[12]);
  vec3 col = vec3(0.), wsum = vec3(0.);
  for(int i=0;i<N;i++){
    float k = float(i)/float(N-1);
    vec3  w = spec(k);
    col  += w * tone(V + ((1. - pow(1. - k, uP[12])) - mid) * uP[11]);
    wsum += w;
  }
  col /= wsum;
  col = pow(col, vec3(uP[15]));

  // light envelope — the ribbons only exist where the sheet is lit, and the
  // dark upper region is bounded by the same valley curve the bands follow
  float lit = smoothstep(uP[18], uP[19], q.y - valleyAt(q, t));
  lit *= mix(1., lit, 0.55);                     // deepen the unlit crescent
  col *= uP[16] * lit;

  // the crest runs hotter, and carries a little light of its own so it stays
  // legible through the softening blur and across the unlit part of the pill
  col = col * (1. + rip * 1.15 + well * 0.60);

  o = vec4(col * pill * uHover, pill);
}`;

/* Downsample; optionally adding a second source (used to fold the rim into
   the bloom input).  Alpha rides along so the metal's coverage mask survives
   the blur chain. */
const FRAG_DOWN = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uTex, uTex2;
uniform vec2 uDstTexel;   // 1 / destination size  (maps dest fragCoord -> uv)
uniform vec2 uSrcTexel;   // 1 / source size       (tap spacing)
uniform float uAdd;       // 1 to include uTex2
void main(){
  vec2 uv = gl_FragCoord.xy * uDstTexel;
  // Taps sit a quarter of a *destination* texel out, so for a 2x reduction
  // they land exactly on the four source texel centres.  Spacing them by a
  // whole source texel instead — as this did originally — skips every other
  // pixel, and any fine detail in the field folds down into low-frequency
  // moiré that no amount of subsequent blurring can remove.
  vec2 e = uDstTexel * 0.25;
  vec4 s = texture(uTex, uv + vec2(-e.x,-e.y)) + texture(uTex, uv + vec2( e.x,-e.y))
         + texture(uTex, uv + vec2(-e.x, e.y)) + texture(uTex, uv + vec2( e.x, e.y));
  s *= 0.25;
  if(uAdd > 0.5){
    vec4 r = texture(uTex2, uv + vec2(-e.x,-e.y)) + texture(uTex2, uv + vec2( e.x,-e.y))
           + texture(uTex2, uv + vec2(-e.x, e.y)) + texture(uTex2, uv + vec2( e.x, e.y));
    s.rgb += r.rgb * 0.25;
  }
  o = s;
}`;

const FRAG_BLUR = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uTex; uniform vec2 uTexel; uniform vec2 uDir; uniform float uR;
void main(){
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec2 st = uTexel * uDir * uR;
  vec4 s = texture(uTex, uv) * 0.1964;
  s += (texture(uTex, uv + st*1.4118) + texture(uTex, uv - st*1.4118)) * 0.2969;
  s += (texture(uTex, uv + st*3.2941) + texture(uTex, uv - st*3.2941)) * 0.0944;
  s += (texture(uTex, uv + st*5.1765) + texture(uTex, uv - st*5.1765)) * 0.0104;
  o = s;
}`;

const FRAG_COMP =
  HEAD +
  `
uniform sampler2D uSoft, uRim, uGlow;
uniform vec2  uRes;
uniform float uGlowGain, uGlowIn, uOccl, uDim, uPunch;

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 glow = texture(uGlow, uv).rgb;

  vec2  d    = gl_FragCoord.xy - uC;
  float sd   = sdPill(d, uHalf, uHalf.y);
  float pill = 1. - smoothstep(-1., 1., sd);

  // normalised blur: dividing by the blurred coverage keeps the softened metal
  // full strength right up to the edge instead of fading into the mask
  vec4 m = texture(uSoft, uv);

  // Scrim, applied *after* the blur: knock the metal back through the middle
  // where the label sits, leaving the top and bottom at full brightness.  Doing
  // this before the blur would smear the protection away at high blur values.
  float veil = 1. - smoothstep(0.46, 0.88, abs(d.y) / uHalf.y);

  // Blurring flattens the tonal range into a wash; putting the contrast back
  // with a power curve — after the blur, so it costs no smoothness — is what
  // makes it read as poured metal rather than a soft glow.  Highlights keep
  // their level while the mid-tones drop away.
  vec3 metal = pow(max(m.rgb / max(m.a, 1e-3), 0.), vec3(uPunch));

  vec3 core = metal * pill * mix(1., uDim, veil) + texture(uRim, uv).rgb;

  // The ripple's own light is added here, after the blur, so the crease stays
  // a hard line.  Its displacement of the field still rides inside the
  // softened metal — the sheet bows, and the crest glints along the fold.
  float rip = ripple(vec2(d.x, -d.y) / (uHalf.y * 2.), uT);
  core += vec3(rip * rip) * uRipK2.w * pill * mix(1., 0.42, veil);

  // The button occludes its own bloom over the patch where its shadow falls,
  // so the drop shadow keeps its contrast even when the face is blown out.
  float sdSh = sdPill(d + vec2(0., uHalf.y * 0.62), uHalf * 0.94, uHalf.y * 0.94);
  float occl = uOccl * exp(-max(sdSh, 0.) / (uHalf.y * 0.75));

  // Bloom spills mostly outward; a little of it is allowed back inside so the
  // hot rim bleeds onto the face, as it does on the reference component.
  vec3 rgb = core + glow * uGlowGain * mix(1., uGlowIn, pill) * (1. - occl * (1. - pill));

  // premultiplied — the page's ambient pool and the button's drop shadow are
  // CSS underneath, and this layer adds light on top of them
  float a = clamp(max(rgb.r, max(rgb.g, rgb.b)), 0., 1.);
  o = vec4(min(rgb, vec3(1.)), a);
}`;

// the metal field — uP[0..20]
const P = {
  valFreq: 0.5,
  valAmp: 0.55,
  dens: 2.4,
  densVar: 2.2,
  densFreq: 0.32,
  wobAmp: 0.12,
  wobFreq: 1.6,
  lift: 0.05,
  refract: 0.18,
  edge: 0.04,
  width: 0.46,
  disp: 0.3,
  skew: 1.5,
  fineAmp: 0.0,
  fineFreq: 9.0,
  gamma: 1.0,
  gain: 1.9,
  octGain: 0.32,
  litLo: -0.26,
  litHi: 0.1,
  dim: 0.44,
};
// the animated rim — uE[0..7]
const E = {
  base: 0.2,
  hot: 0.82,
  chromA: 0.42,
  chromS: 0.03,
  speed: 0.07,
  top: 0.35,
  press: 0.85,
  ripple: 1.6,
};
// composite / JS-side only
const C = { glow: 1.95, glowR: 1.3, glowIn: 0.3, occl: 0.62, soften: 0.24, punch: 1.5 };
// disturbances — all distances in button heights, times in seconds
const R = {
  speed: 1.85,
  width: 0.2,
  decay: 1.35,
  amp: 1.35,
  facet: 0.18,
  lobes: 6.0,
  sharp: 1.15,
  emit: 0.45,
  ptrRad: 0.55,
  ptrAmp: 0.32,
  ptrFast: 0.4,
  ptrRim: 0.8,
  ptrLag: 0.0016,
  ptrVref: 4.5,
};
const P_ARR = new Float32Array(Object.values(P));
const E_ARR = new Float32Array(Object.values(E));

const PLATE_SHADOW = {
  rest: {
    background: "#0b0c0e",
    boxShadow:
      "0 calc(var(--h) * 0.10) calc(var(--h) * 0.22) rgba(0,0,0,.72), 0 calc(var(--h) * 0.30) calc(var(--h) * 0.66) rgba(0,0,0,.62), 0 calc(var(--h) * 0.62) calc(var(--h) * 1.30) rgba(0,0,0,.42)",
  },
  hot: {
    background: "#08090a",
    boxShadow:
      "0 calc(var(--h) * 0.12) calc(var(--h) * 0.26) rgba(0,0,0,.80), 0 calc(var(--h) * 0.40) calc(var(--h) * 0.86) rgba(0,0,0,.72), 0 calc(var(--h) * 0.86) calc(var(--h) * 1.80) rgba(0,0,0,.55)",
  },
  press: {
    background: "#070809",
    boxShadow:
      "0 calc(var(--h) * 0.05) calc(var(--h) * 0.13) rgba(0,0,0,.82), 0 calc(var(--h) * 0.16) calc(var(--h) * 0.40) rgba(0,0,0,.70), 0 calc(var(--h) * 0.34) calc(var(--h) * 0.80) rgba(0,0,0,.50)",
  },
};

const STYLES = `
.m-lmb-btn:focus-visible{outline:calc(4 * var(--u)) solid rgba(255,255,255,.55);outline-offset:calc(10 * var(--u))}
.m-lmb-play .m-lmb-btn:focus-visible{outline:2px solid rgba(255,255,255,.68);outline-offset:4px}
`;

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

function clampNum(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function LiquidMetalButton({
  variant = "pill",
  rendering = "colored",
  diameter = 88,
  strokeWidth = 3,
  text,
  embedded = false,
  onClick,
  className,
}: LiquidMetalButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const calmRef = useRef(false);
  calmRef.current = !!prefersReducedMotion;
  const strokeRef = useRef(3);

  const safeVariant = variant === "circle" || variant === "play" ? variant : "pill";
  const isPlay = safeVariant === "play";
  const safeText = String(
    text ?? (safeVariant === "pill" ? "Sign up" : safeVariant === "circle" ? "Add" : "Play"),
  ).slice(0, 24);
  const playDiameter = clampNum(diameter, 72, 160, 88);
  strokeRef.current = clampNum(strokeWidth, 1, 8, 3);

  const stageStyle: Record<string, string> = isPlay
    ? { "--h": `${playDiameter}px`, "--bw": "var(--h)" }
    : safeVariant === "circle"
      ? { "--h": "clamp(56px, 10vmin, 72px)", "--bw": "var(--h)" }
      : {
          "--h": "52px",
          "--bw": `calc(${Math.min(3000, Math.max(1407, 820 + safeText.length * 94))} * var(--u))`,
        };

  useEffect(() => {
    const cv = canvasRef.current;
    const stage = stageRef.current;
    const btn = btnRef.current;
    const plate = plateRef.current;
    const root = rootRef.current;
    if (!cv || !stage || !btn || !plate || !root) return;
    const gl = cv.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    function sh(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS))
        throw new Error(gl!.getShaderInfoLog(s) + "\n" + src);
      return s;
    }
    const shaders: WebGLShader[] = [];
    function prog(fs: string): Prog {
      const p = gl!.createProgram()!;
      const vs = sh(gl!.VERTEX_SHADER, VERT);
      const f = sh(gl!.FRAGMENT_SHADER, fs);
      shaders.push(vs, f);
      gl!.attachShader(p, vs);
      gl!.attachShader(p, f);
      gl!.bindAttribLocation(p, 0, "position");
      gl!.linkProgram(p);
      if (!gl!.getProgramParameter(p, gl!.LINK_STATUS))
        throw new Error(gl!.getProgramInfoLog(p) ?? "link failed");
      const u: Prog["u"] = {};
      const n = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl!.getActiveUniform(p, i)!;
        u[info.name.replace("[0]", "")] = gl!.getUniformLocation(p, info.name);
      }
      return { p, u };
    }
    const pScene = prog(FRAG_SCENE),
      pRim = prog(FRAG_RIM),
      pDown = prog(FRAG_DOWN),
      pBlur = prog(FRAG_BLUR),
      pComp = prog(FRAG_COMP);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const hasFloat = !!gl.getExtension("EXT_color_buffer_half_float");
    const targets: Target[] = [];
    function makeTarget(): Target {
      const tex = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      const fbo = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
      const t = { tex, fbo, w: 0, h: 0 };
      targets.push(t);
      return t;
    }
    function sizeTarget(t: Target, w: number, h: number) {
      if (t.w === w && t.h === h) return;
      t.w = w;
      t.h = h;
      gl!.bindTexture(gl!.TEXTURE_2D, t.tex);
      if (hasFloat)
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA16F, w, h, 0, gl!.RGBA, gl!.HALF_FLOAT, null);
      else gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, w, h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    }
    const T_core = makeTarget(),
      T_rim = makeTarget(),
      T_s1 = makeTarget(),
      T_s2 = makeTarget(),
      T_a = makeTarget(),
      T_b = makeTarget();

    let W = 0,
      H = 0,
      DPR = 1,
      BW = 0,
      BH = 0,
      CX = 0,
      CY = 0;
    let DOWN = 4;
    const GLOW_TEX = 129;
    let needResize = true;

    function resize() {
      const r = stage!.getBoundingClientRect();
      const br = btn!.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(r.width * DPR));
      const h = Math.max(2, Math.round(r.height * DPR));
      if (w !== W || h !== H) {
        W = w;
        H = h;
        cv!.width = W;
        cv!.height = H;
      }
      BW = br.width * DPR;
      BH = br.height * DPR;
      CX = (br.left - r.left) * DPR + BW / 2;
      CY = H - ((br.top - r.top) * DPR + BH / 2);
      sizeTarget(T_core, W, H);
      sizeTarget(T_rim, W, H);
      const hw = Math.max(2, Math.ceil(W / 2)),
        hh = Math.max(2, Math.ceil(H / 2));
      sizeTarget(T_s1, hw, hh);
      sizeTarget(T_s2, hw, hh);
      DOWN = Math.max(1, Math.min(4, Math.round(BH / GLOW_TEX)));
      const dw = Math.max(2, Math.ceil(W / DOWN)),
        dh = Math.max(2, Math.ceil(H / DOWN));
      sizeTarget(T_a, dw, dh);
      sizeTarget(T_b, dw, dh);
      needResize = false;
    }
    const ro = new ResizeObserver(() => {
      needResize = true;
    });
    ro.observe(stage);

    function drawTo(t: Target | null) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, t ? t.fbo : null);
      gl!.viewport(0, 0, t ? t.w : W, t ? t.h : H);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    let hover = 0,
      hoverTarget = 0,
      clock = 0,
      last = performance.now();
    const RIP = [0, 1, 2].map(() => ({ x: 0, y: 0, t: -99, on: 0 }));
    const ripArr = new Float32Array(12);
    let ripNext = 0,
      press = 0,
      pressTarget = 0;
    const ptr = { x: 0, y: 0 },
      ptrS = { x: 0, y: 0 };
    let ptrAmt = 0,
      ptrSpeed = 0;
    const on = { over: false, press: false, focus: false };

    function addRipple(x: number, y: number) {
      const r = RIP[ripNext];
      ripNext = (ripNext + 1) % RIP.length;
      r.x = x;
      r.y = y;
      r.t = clock;
      r.on = 1;
    }
    function localPt(e: PointerEvent): [number, number] {
      const b = btn!.getBoundingClientRect(),
        s = b.height;
      return [(e.clientX - (b.left + b.width / 2)) / s, (e.clientY - (b.top + b.height / 2)) / s];
    }

    let drawn: string | null = null;
    let raf = 0;
    let running = false;

    function frame(now: number) {
      const dtRaw = (now - last) / 1000;
      last = now;
      const dt = Math.min(dtRaw, 1 / 20);
      const calm = calmRef.current;
      if (!calm) clock += dt;

      const k = hoverTarget > hover ? 1 - Math.pow(0.0012, dt) : 1 - Math.pow(0.00012, dt);
      hover += (hoverTarget - hover) * k;
      if (Math.abs(hoverTarget - hover) < 0.0008) hover = hoverTarget;

      const pk = pressTarget > press ? 1 - Math.pow(1e-9, dt) : 1 - Math.pow(0.004, dt);
      press += (pressTarget - press) * pk;
      if (Math.abs(pressTarget - press) < 0.002) press = pressTarget;

      for (let i = 0; i < RIP.length; i++) {
        const r = RIP[i];
        if (r.on && clock - r.t > 4) r.on = 0;
        ripArr[i * 4] = r.x;
        ripArr[i * 4 + 1] = r.y;
        ripArr[i * 4 + 2] = r.t;
        ripArr[i * 4 + 3] = r.on;
      }
      const ripLive = RIP.some((r) => r.on);

      const lag = 1 - Math.pow(R.ptrLag, dt);
      const dx = (ptr.x - ptrS.x) * lag,
        dy = (ptr.y - ptrS.y) * lag;
      ptrS.x += dx;
      ptrS.y += dy;
      const inst = Math.min(Math.hypot(dx, dy) / Math.max(dt, 1e-3) / R.ptrVref, 1);
      ptrSpeed += (inst - ptrSpeed) * (1 - Math.pow(inst > ptrSpeed ? 0.001 : 0.02, dt));
      const wantWell = on.over || on.press ? 1 : 0;
      ptrAmt += (wantWell - ptrAmt) * (1 - Math.pow(0.004, dt));
      if (Math.abs(wantWell - ptrAmt) < 0.002) ptrAmt = wantWell;

      if (needResize) resize();

      const sig = calm && !ripLive && ptrAmt < 0.002 ? `${hover}|${press}|${W}|${H}` : null;
      if (sig !== null && sig === drawn) {
        raf = requestAnimationFrame(frame);
        return;
      }
      drawn = sig;

      const bw = isPlay
        ? Math.max(0.5 * DPR, strokeRef.current * DPR * 0.5)
        : Math.max(1.5, 3.2 * (BH / 516));

      // 1. metal, masked to the pill
      gl!.useProgram(pScene.p);
      gl!.uniform2f(pScene.u.uC, CX, CY);
      gl!.uniform2f(pScene.u.uHalf, BW / 2, BH / 2);
      gl!.uniform1f(pScene.u.uT, clock);
      gl!.uniform1f(pScene.u.uHover, hover);
      gl!.uniform1f(pScene.u.uPress, press);
      gl!.uniform4fv(pScene.u.uRip, ripArr);
      gl!.uniform4f(pScene.u.uRipK, R.speed, R.width, R.decay, R.amp);
      gl!.uniform4f(pScene.u.uRipK2, R.facet, R.lobes, R.sharp, R.emit);
      gl!.uniform4f(pScene.u.uPtr, ptrS.x, ptrS.y, ptrAmt, ptrSpeed);
      gl!.uniform4f(pScene.u.uPtrK, R.ptrRad, R.ptrAmp, R.ptrFast, R.ptrRim);
      gl!.uniform1fv(pScene.u.uP, P_ARR);
      drawTo(T_core);

      // 2. rim, kept out of the softening blur so the outline stays razor thin
      gl!.useProgram(pRim.p);
      gl!.uniform2f(pRim.u.uC, CX, CY);
      gl!.uniform2f(pRim.u.uHalf, BW / 2, BH / 2);
      gl!.uniform1f(pRim.u.uT, clock);
      gl!.uniform1f(pRim.u.uBw, bw);
      gl!.uniform1f(pRim.u.uPress, press);
      gl!.uniform4fv(pRim.u.uRip, ripArr);
      gl!.uniform4f(pRim.u.uRipK, R.speed, R.width, R.decay, R.amp);
      gl!.uniform4f(pRim.u.uRipK2, R.facet, R.lobes, R.sharp, R.emit);
      gl!.uniform4f(pRim.u.uPtr, ptrS.x, ptrS.y, ptrAmt, ptrSpeed);
      gl!.uniform4f(pRim.u.uPtrK, R.ptrRad, R.ptrAmp, R.ptrFast, R.ptrRim);
      gl!.uniform1fv(pRim.u.uE, E_ARR);
      drawTo(T_rim);

      // 3. soften the metal — half-res box down, then a separable gaussian
      gl!.useProgram(pDown.p);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, T_core.tex);
      gl!.uniform1i(pDown.u.uTex, 0);
      gl!.uniform1f(pDown.u.uAdd, 0);
      gl!.uniform2f(pDown.u.uDstTexel, 1 / T_s1.w, 1 / T_s1.h);
      gl!.uniform2f(pDown.u.uSrcTexel, 1 / W, 1 / H);
      drawTo(T_s1);

      gl!.useProgram(pBlur.p);
      gl!.uniform1i(pBlur.u.uTex, 0);
      gl!.uniform2f(pBlur.u.uTexel, 1 / T_s1.w, 1 / T_s1.h);
      const sigTex = C.soften * (BH * 0.5) * 0.95;
      if (sigTex > 0.1) {
        const iters = Math.min(4, Math.max(1, Math.ceil(sigTex / 3.0)));
        gl!.uniform1f(pBlur.u.uR, sigTex / Math.sqrt(iters) / 1.95);
        for (let i = 0; i < iters; i++) {
          gl!.bindTexture(gl!.TEXTURE_2D, T_s1.tex);
          gl!.uniform2f(pBlur.u.uDir, 1, 0);
          drawTo(T_s2);
          gl!.bindTexture(gl!.TEXTURE_2D, T_s2.tex);
          gl!.uniform2f(pBlur.u.uDir, 0, 1);
          drawTo(T_s1);
        }
      }

      // 4. bloom, fed by the softened metal plus the crisp rim
      gl!.useProgram(pDown.p);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, T_s1.tex);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, T_rim.tex);
      gl!.uniform1i(pDown.u.uTex, 0);
      gl!.uniform1i(pDown.u.uTex2, 1);
      gl!.uniform1f(pDown.u.uAdd, 1);
      gl!.uniform2f(pDown.u.uDstTexel, 1 / T_a.w, 1 / T_a.h);
      gl!.uniform2f(pDown.u.uSrcTexel, 1 / T_s1.w, 1 / T_s1.h);
      drawTo(T_a);

      gl!.useProgram(pBlur.p);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.uniform1i(pBlur.u.uTex, 0);
      gl!.uniform2f(pBlur.u.uTexel, 1 / T_a.w, 1 / T_a.h);
      const rs = (C.glowR * (BH / DOWN)) / GLOW_TEX;
      for (const r of [1.0, 2.3, 5.2, 9.0].map((v) => v * rs)) {
        gl!.uniform1f(pBlur.u.uR, r);
        gl!.bindTexture(gl!.TEXTURE_2D, T_a.tex);
        gl!.uniform2f(pBlur.u.uDir, 1, 0);
        drawTo(T_b);
        gl!.bindTexture(gl!.TEXTURE_2D, T_b.tex);
        gl!.uniform2f(pBlur.u.uDir, 0, 1);
        drawTo(T_a);
      }

      // 5. composite
      gl!.useProgram(pComp.p);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, T_s1.tex);
      gl!.uniform1i(pComp.u.uSoft, 0);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, T_rim.tex);
      gl!.uniform1i(pComp.u.uRim, 1);
      gl!.activeTexture(gl!.TEXTURE2);
      gl!.bindTexture(gl!.TEXTURE_2D, T_a.tex);
      gl!.uniform1i(pComp.u.uGlow, 2);
      gl!.uniform2f(pComp.u.uRes, W, H);
      gl!.uniform2f(pComp.u.uC, CX, CY);
      gl!.uniform2f(pComp.u.uHalf, BW / 2, BH / 2);
      gl!.uniform1f(pComp.u.uT, clock);
      gl!.uniform4fv(pComp.u.uRip, ripArr);
      gl!.uniform4f(pComp.u.uRipK, R.speed, R.width, R.decay, R.amp);
      gl!.uniform4f(pComp.u.uRipK2, R.facet, R.lobes, R.sharp, R.emit);
      gl!.uniform1f(pComp.u.uGlowGain, C.glow);
      gl!.uniform1f(pComp.u.uGlowIn, C.glowIn);
      gl!.uniform1f(pComp.u.uOccl, C.occl);
      gl!.uniform1f(pComp.u.uDim, P.dim);
      gl!.uniform1f(pComp.u.uPunch, C.punch);
      drawTo(null);

      raf = requestAnimationFrame(frame);
    }

    /* ---------------- interaction ---------------- */
    const sync = () => {
      hoverTarget = on.over || on.press || on.focus ? 1 : 0;
      pressTarget = on.press ? 1 : 0;
      const s = on.press
        ? PLATE_SHADOW.press
        : hoverTarget > 0.5
          ? PLATE_SHADOW.hot
          : PLATE_SHADOW.rest;
      plate!.style.background = s.background;
      plate!.style.boxShadow = s.boxShadow;
      plate!.style.transitionDuration = on.press ? ".10s" : ".38s";
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      [ptr.x, ptr.y] = localPt(e);
      ptrS.x = ptr.x;
      ptrS.y = ptr.y;
      ptrSpeed = 0;
      on.over = true;
      sync();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        on.over = false;
        sync();
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!on.over && !on.press) return;
      [ptr.x, ptr.y] = localPt(e);
    };
    const onDown = (e: PointerEvent) => {
      [ptr.x, ptr.y] = localPt(e);
      on.press = true;
      sync();
      addRipple(ptr.x, ptr.y);
    };
    const onUp = () => {
      on.press = false;
      sync();
    };
    const onFocus = () => {
      on.focus = btn.matches(":focus-visible");
      sync();
    };
    const onBlur = () => {
      on.focus = false;
      sync();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key !== "Enter" && e.key !== " ") || e.repeat) return;
      on.press = true;
      sync();
      addRipple(0, 0);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      on.press = false;
      sync();
    };
    btn.addEventListener("pointerenter", onEnter);
    btn.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointermove", onMove, { passive: true });
    btn.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    btn.addEventListener("focus", onFocus);
    btn.addEventListener("blur", onBlur);
    btn.addEventListener("keydown", onKeyDown);
    btn.addEventListener("keyup", onKeyUp);

    // pause off-screen and while the tab is hidden
    let visible = true;
    const update = () => {
      const want = visible && document.visibilityState !== "hidden";
      if (want && !running) {
        running = true;
        last = performance.now();
        drawn = null;
        raf = requestAnimationFrame(frame);
      } else if (!want && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", update);
    resize();
    update();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", update);
      btn.removeEventListener("pointerenter", onEnter);
      btn.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      btn.removeEventListener("focus", onFocus);
      btn.removeEventListener("blur", onBlur);
      btn.removeEventListener("keydown", onKeyDown);
      btn.removeEventListener("keyup", onKeyUp);
      for (const t of targets) {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      }
      for (const pr of [pScene, pRim, pDown, pBlur, pComp]) gl.deleteProgram(pr.p);
      for (const s of shaders) gl.deleteShader(s);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
    };
  }, [safeVariant, isPlay]);

  const u = "var(--u)";
  return (
    <div
      ref={rootRef}
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden",
        isPlay && "m-lmb-play",
        className,
      )}
      style={{
        background: embedded
          ? "#0e0f12"
          : "radial-gradient(46vmax 32vmax at 50% 47%, #191b21 0%, #0e0f13 34%, #050506 62%, #000 88%) #000",
        fontFamily: '"Inter",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif',
        fontOpticalSizing: "auto",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        ref={stageRef}
        style={
          {
            "--u": "calc(var(--h) / 516)",
            "--bh": "var(--h)",
            "--pad": "calc(900 * var(--u))",
            ...stageStyle,
            position: "relative",
            width: "calc(var(--bw) + 2 * var(--pad))",
            height: "calc(var(--bh) + 2 * var(--pad))",
            display: "grid",
            placeItems: "center",
            touchAction: "manipulation",
          } as CSSProperties
        }
      >
        <div
          ref={plateRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "var(--bw)",
            height: "var(--bh)",
            borderRadius: 999,
            ...PLATE_SHADOW.rest,
            transition:
              "box-shadow .38s cubic-bezier(.22,.61,.36,1), background .38s cubic-bezier(.22,.61,.36,1)",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            filter: isPlay && rendering === "monotone" ? "grayscale(1) contrast(1.04)" : "none",
          }}
        />
        <button
          ref={btnRef}
          className="m-lmb-btn"
          type="button"
          aria-label={
            safeVariant === "pill"
              ? safeText || "Button"
              : safeText.trim() || (isPlay ? "Play" : "Add")
          }
          onClick={onClick}
          style={{
            position: "relative",
            width: "var(--bw)",
            height: "var(--bh)",
            border: 0,
            background: "none",
            padding: 0,
            borderRadius: 999,
            display: "flex",
            flexDirection: isPlay ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: safeVariant === "pill" ? `calc(88 * ${u})` : 0,
            color: "#fff",
            fontFamily: "inherit",
            fontWeight: 500,
            fontSize: `calc(207 * ${u})`,
            lineHeight: 1,
            letterSpacing: 0,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            outline: "none",
          }}
        >
          {isPlay ? (
            <svg
              viewBox="0 0 48 48"
              aria-hidden="true"
              style={{
                width: "calc(var(--h) * .25)",
                height: "calc(var(--h) * .25)",
                display: "block",
                flex: "none",
                overflow: "visible",
                transform: "translateX(calc(var(--h) * .018))",
              }}
            >
              <path
                fill="currentColor"
                d="M15.5 10.75a2.2 2.2 0 0 1 3.32-1.9l18.04 13.25a2.35 2.35 0 0 1 0 3.8L18.82 39.15a2.2 2.2 0 0 1-3.32-1.9v-26.5Z"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 115 115"
              aria-hidden="true"
              style={{
                width: safeVariant === "circle" ? "28%" : `calc(115 * ${u})`,
                height: safeVariant === "circle" ? "28%" : `calc(115 * ${u})`,
                display: "block",
                flex: "none",
                overflow: "visible",
              }}
            >
              <g stroke="currentColor" strokeWidth="17" strokeLinecap="round">
                <path d="M57.5 8.5 V106.5" />
                <path d="M8.5 57.5 H106.5" />
              </g>
            </svg>
          )}
          {safeVariant === "pill" ? (
            <span style={{ display: "block", transform: `translateY(calc(2 * ${u}))` }}>
              {safeText}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
