"use client";

// Ported from ThreeUI Community's Energy Orb (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnergyOrbProps {
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
  backgroundColor?: string;
  className?: string;
}

type Star = { x: number; y: number; depth: number; phase: number; drift: number; size: number };

const VERTEX_SHADER = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const FRAGMENT_SHADER = [
  "precision highp float;",
  "uniform float uT;uniform vec2 uR;",
  "uniform float uSmokeScale;uniform float uSmokeStrength;uniform float uSmokeSpeed;",
  "uniform float uHue;uniform float uSaturation;uniform float uGlow;",
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
  " vec2 uv=(gl_FragCoord.xy-0.5*uR)/min(uR.x,uR.y);",
  " float r=length(uv);",
  " float R=0.31;",
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
  "   vec3 deep=vec3(0.04,0.02,0.12);",
  "   vec3 mid=vec3(0.22,0.16,0.55);",
  "   vec3 bright=vec3(0.62,0.60,0.98);",
  "   col=mix(deep,mid,f1*1.2);",
  "   col=mix(col,bright,clamp(veil*0.65*uSmokeStrength,0.0,1.0));",
  "   float fres=pow(1.0-z/R,2.2);",
  "   col+=vec3(0.55,0.55,1.0)*fres*1.1*uGlow;",
  "   float top=pow(max(dot(n,normalize(vec3(0.0,0.7,0.7))),0.0),3.0);",
  "   col+=vec3(0.45,0.42,0.9)*top*0.35*uGlow;",
  "   alpha=1.0;",
  " }",
  " float glow=exp(-(r-R)*14.0);",
  " if(r>=R){",
  "   glow=clamp(glow,0.0,1.0);",
  "   col=vec3(0.55,0.52,1.0)*glow*0.8*uGlow;",
  "   alpha=glow*0.85;",
  " } else {",
  "   float rim=smoothstep(R-0.03,R,r);",
  "   col+=vec3(0.6,0.58,1.0)*rim*0.6*uGlow;",
  " }",
  " col=gradeColor(col);",
  " gl_FragColor=vec4(col,alpha);",
  "}",
].join("\n");

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Energy Orb shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Energy Orb shader compilation failed");
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

export function EnergyOrb({
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
  backgroundColor = "#05030e",
  className,
}: EnergyOrbProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
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
      throw new Error(gl.getProgramInfoLog(program) ?? "Energy Orb program link failed");
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
      starContext.globalCompositeOperation = "screen";
      const particleTime = prefersReducedMotion ? 0 : elapsed * Math.max(0, options.starSpeed);
      const colorHue = fract((252 + options.hue) / 360) * 360;
      for (let index = 0; index < count; index += 1) {
        const star = stars[index];
        const x = fract(star.x + particleTime * 0.0022 * star.drift) * width;
        const y = fract(star.y - particleTime * 0.0008 * star.depth + 1) * height;
        const twinkle = prefersReducedMotion
          ? 0.78
          : 0.58 + Math.sin(particleTime * (0.8 + star.depth) + star.phase) * 0.24;
        const alpha = Math.max(0.08, twinkle * (0.22 + star.depth * 0.48));
        const radius = Math.max(0.35, star.size * star.depth * Math.max(0.25, options.starSize));
        starContext.fillStyle = `hsla(${colorHue}, 84%, ${72 + star.depth * 20}%, ${alpha})`;
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
  }, [prefersReducedMotion]);

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
