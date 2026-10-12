"use client";
// Ported from ThreeUI Community's Energy Orb (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LumenCoreProps {
  speed?: number;
  scale?: number;
  smokeScale?: number;
  smokeStrength?: number;
  smokeSpeed?: number;
  hue?: number;
  saturation?: number;
  glow?: number;
  starDensity?: number;
  starSpeed?: number;
  starSize?: number;
  brightness?: number;
  opacity?: number;
  /** Colour behind the core; defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
}

type Hsl = [number, number, number];

/** Theme tokens are bare HSL channels ("24 8% 20%"). */
function readTheme() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): Hsl => {
    const [h = 0, s = 0, l = 0] = style
      .getPropertyValue(name)
      .trim()
      .split(/[\s,/%]+/)
      .map(Number);
    return [h, s, l];
  };
  const background = read("--background");
  return {
    dark: background[2] < 50,
    background,
    foreground: read("--foreground"),
    primary: read("--primary"),
    muted: read("--muted-foreground"),
  };
}

/** Comma-separated hsl(), which both canvas and THREE.Color parse. */
const hsl = ([h, s, l]: Hsl, alpha = 1) =>
  `hsla(${Math.round(h)}, ${Math.round(Math.min(100, Math.max(0, s)))}%, ${Math.round(Math.min(100, Math.max(0, l)))}%, ${alpha})`;

/** HSL channels to linear-free 0..1 RGB for shader uniforms. */
function rgb([h, s, l]: Hsl) {
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

/** Bumps on light/dark or palette changes so canvas colours re-resolve. */
function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return version;
}

type Star = { x: number; y: number; depth: number; phase: number; drift: number; size: number };

const VERTEX_SHADER = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const FRAGMENT_SHADER = [
  "precision highp float;",
  "uniform float uT;uniform vec2 uR;",
  "uniform float uSmokeScale;uniform float uSmokeStrength;uniform float uSmokeSpeed;",
  "uniform float uHue;uniform float uSaturation;uniform float uGlow;",
  "uniform vec3 uDeep;uniform vec3 uMid;uniform vec3 uBright;uniform vec3 uRim;",
  "float hash(vec3 p){p=fract(p*0.3183099+vec3(0.1,0.2,0.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}",
  "float noise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);",
  " return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),",
  " mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}",
  "float fbm(vec3 p){float v=0.0;float a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec3(1.7);a*=0.5;}return v;}",
  "vec3 gradeColor(vec3 color){",
  " float luminance=dot(color,vec3(0.2126,0.7152,0.0722));",
  " color=mix(vec3(luminance),color,uSaturation);",
  " vec3 axis=normalize(vec3(1.0));",
  " return max(vec3(0.0),color*cos(uHue)+cross(axis,color)*sin(uHue)+axis*dot(axis,color)*(1.0-cos(uHue)));",
  "}",
  "void main(){",
  " vec2 uv=(gl_FragCoord.xy-vec2(0.6,0.46)*uR)/min(uR.x,uR.y);",
  " float r=length(uv);",
  " float R=0.24;",
  " vec3 col=vec3(0.0);float alpha=0.0;",
  " if(r<R){",
  "   float z=sqrt(R*R-r*r);",
  "   vec3 n=normalize(vec3(uv,z));",
  "   float ca=uT*0.15;",
  "   mat3 rot=mat3(cos(ca),0.,sin(ca),0.,1.,0.,-sin(ca),0.,cos(ca));",
  "   vec3 sp=rot*n;",
  "   float smokeTime=uT*uSmokeSpeed;",
  "   float f1=fbm(sp*(2.6*uSmokeScale)+vec3(0.0,smokeTime*0.12,0.0));",
  "   float f2=fbm(sp*(4.5*uSmokeScale)-vec3(smokeTime*0.08,0.0,smokeTime*0.05)+f1*1.8);",
  "   float veil=smoothstep(0.35,0.75,f2);",
  "   col=mix(uDeep,uMid,f1*1.2);",
  "   col=mix(col,uBright,clamp(veil*0.65*uSmokeStrength,0.0,1.0));",
  "   float fres=pow(1.0-z/R,2.2);",
  "   col=mix(col,uRim,clamp(fres*1.1*uGlow,0.0,1.0));",
  "   float top=pow(max(dot(n,normalize(vec3(0.0,0.7,0.7))),0.0),3.0);",
  "   col=mix(col,uBright,clamp(top*0.35*uGlow,0.0,1.0));",
  "   alpha=1.0;",
  " }",
  " float glow=exp(-(r-R)*14.0);",
  " if(r>=R){",
  "   glow=clamp(glow,0.0,1.0);",
  "   col=uRim;",
  "   alpha=clamp(glow*0.7*uGlow,0.0,1.0);",
  " } else {",
  "   float rim=smoothstep(R-0.03,R,r);",
  "   col=mix(col,uRim,clamp(rim*0.6*uGlow,0.0,1.0));",
  " }",
  " col=gradeColor(col);",
  " gl_FragColor=vec4(col,alpha);",
  "}",
].join("\n");

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Lumen Core shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Lumen Core shader compilation failed");
  }
  return shader;
}

function seeded(index: number, salt: number) {
  return Math.abs(Math.sin(index * 91.173 + salt * 17.719) * 43758.5453) % 1;
}

function createStars(count: number): Star[] {
  return Array.from({ length: count }, (_, index) => ({
    x: seeded(index, 1),
    y: seeded(index, 2),
    depth: 0.25 + seeded(index, 3) * 0.75,
    phase: seeded(index, 4) * Math.PI * 2,
    drift: 0.35 + seeded(index, 5) * 0.65,
    size: 0.45 + seeded(index, 6) * 1.15,
  }));
}

function fract(value: number) {
  return value - Math.floor(value);
}

export function LumenCore({
  speed = 1,
  scale = 1,
  smokeScale = 1,
  smokeStrength = 1,
  smokeSpeed = 1,
  hue = 0,
  saturation = 1,
  glow = 1,
  starDensity = 1,
  starSpeed = 1,
  starSize = 1,
  brightness = 1,
  opacity = 1,
  backgroundColor = "hsl(var(--background))",
  className,
}: LumenCoreProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const theme = useThemeVersion();
  const optionsRef = useRef({
    speed,
    smokeScale,
    smokeStrength,
    smokeSpeed,
    hue,
    saturation,
    glow,
    starDensity,
    starSpeed,
    starSize,
  });
  optionsRef.current = {
    speed,
    smokeScale,
    smokeStrength,
    smokeSpeed,
    hue,
    saturation,
    glow,
    starDensity,
    starSpeed,
    starSize,
  };

  useEffect(() => {
    const host = hostRef.current;
    const starCanvas = starCanvasRef.current;
    const canvas = canvasRef.current;
    if (!host || !starCanvas || !canvas) return;

    // The core is shaded with a lightness ramp on the theme's primary hue.
    const { dark, primary } = readTheme();
    const [h, s] = primary;
    const sat = Math.max(s, 36);
    const ramp = dark
      ? {
          deep: rgb([h, sat, 7]),
          mid: rgb([h, sat, 30]),
          bright: rgb([h - 16, sat, 80]),
          rim: rgb([h, sat * 0.7, 86]),
        }
      : {
          deep: rgb([h, sat, 12]),
          mid: rgb([h, sat, 30]),
          bright: rgb([h - 16, sat, 66]),
          rim: rgb([h, sat, 46]),
        };

    const starContext = starCanvas.getContext("2d", { alpha: true });
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });
    if (!starContext || !gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Lumen Core program link failed");
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      time: gl.getUniformLocation(program, "uT"),
      resolution: gl.getUniformLocation(program, "uR"),
      smokeScale: gl.getUniformLocation(program, "uSmokeScale"),
      smokeStrength: gl.getUniformLocation(program, "uSmokeStrength"),
      smokeSpeed: gl.getUniformLocation(program, "uSmokeSpeed"),
      hue: gl.getUniformLocation(program, "uHue"),
      saturation: gl.getUniformLocation(program, "uSaturation"),
      glow: gl.getUniformLocation(program, "uGlow"),
      deep: gl.getUniformLocation(program, "uDeep"),
      mid: gl.getUniformLocation(program, "uMid"),
      bright: gl.getUniformLocation(program, "uBright"),
      rim: gl.getUniformLocation(program, "uRim"),
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const stars = createStars(180);
    let width = 1;
    let height = 1;
    let starDpr = 1;
    let frame = 0;
    let visible = true;
    const startedAt = performance.now();

    const drawStars = (elapsed: number) => {
      const options = optionsRef.current;
      starContext.setTransform(1, 0, 0, 1, 0, 0);
      starContext.clearRect(0, 0, starCanvas.width, starCanvas.height);
      const density = Math.max(0, options.starDensity);
      const count = Math.min(stars.length, Math.round(((width * height) / 4_200) * density));
      if (!count) return;

      starContext.setTransform(starDpr, 0, 0, starDpr, 0, 0);
      starContext.globalCompositeOperation = dark ? "screen" : "multiply";
      const particleTime = prefersReducedMotion ? 0 : elapsed * Math.max(0, options.starSpeed);
      const colorHue = fract((h + options.hue) / 360) * 360;
      for (let index = 0; index < count; index += 1) {
        const star = stars[index];
        const x = fract(star.x + particleTime * 0.0022 * star.drift) * width;
        const y = fract(star.y - particleTime * 0.0008 * star.depth + 1) * height;
        const twinkle = prefersReducedMotion
          ? 0.78
          : 0.58 + Math.sin(particleTime * (0.8 + star.depth) + star.phase) * 0.24;
        const alpha = Math.max(0.08, twinkle * (0.22 + star.depth * 0.48));
        const radius = Math.max(0.35, star.size * star.depth * Math.max(0.25, options.starSize));
        starContext.fillStyle = `hsla(${colorHue}, ${sat}%, ${dark ? 72 + star.depth * 20 : 40 - star.depth * 20}%, ${alpha})`;
        starContext.beginPath();
        starContext.arc(x, y, radius, 0, Math.PI * 2);
        starContext.fill();
      }
      starContext.globalCompositeOperation = "source-over";
    };

    const draw = (elapsed: number) => {
      const options = optionsRef.current;
      drawStars(elapsed);
      gl.uniform1f(uniforms.time, elapsed * options.speed);
      gl.uniform1f(uniforms.smokeScale, Math.max(0.01, options.smokeScale));
      gl.uniform1f(uniforms.smokeStrength, Math.max(0, options.smokeStrength));
      gl.uniform1f(uniforms.smokeSpeed, Math.max(0, options.smokeSpeed));
      gl.uniform1f(uniforms.hue, (options.hue * Math.PI) / 180);
      gl.uniform1f(uniforms.saturation, Math.max(0, options.saturation));
      gl.uniform1f(uniforms.glow, Math.max(0, options.glow));
      gl.uniform3fv(uniforms.deep, ramp.deep);
      gl.uniform3fv(uniforms.mid, ramp.mid);
      gl.uniform3fv(uniforms.bright, ramp.bright);
      gl.uniform3fv(uniforms.rim, ramp.rim);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const render = (now: number) => {
      frame = 0;
      draw((now - startedAt) * 0.001);
      if (visible && !document.hidden) frame = requestAnimationFrame(render);
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bufferWidth = Math.max(1, Math.round(width * dpr));
      const bufferHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
      }
      gl.viewport(0, 0, bufferWidth, bufferHeight);
      gl.uniform2f(uniforms.resolution, bufferWidth, bufferHeight);

      starDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const starWidth = Math.max(1, Math.round(width * starDpr));
      const starHeight = Math.max(1, Math.round(height * starDpr));
      if (starCanvas.width !== starWidth || starCanvas.height !== starHeight) {
        starCanvas.width = starWidth;
        starCanvas.height = starHeight;
      }
      if (prefersReducedMotion) draw(4);
    };

    const start = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let intersection: IntersectionObserver | undefined;
    if (!prefersReducedMotion) {
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible) start();
        else stop();
      });
      intersection.observe(host);
      document.addEventListener("visibilitychange", onVisibilityChange);
      start();
    }

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
    };
  }, [prefersReducedMotion, theme]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor }}
    >
      <canvas ref={starCanvasRef} className="absolute inset-0 z-0 block h-full w-full" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[1] block h-full w-full"
        style={{ opacity, filter: `brightness(${brightness})`, transform: `scale(${scale})` }}
      />
    </div>
  );
}
