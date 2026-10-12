"use client";
// Ported from ThreeUI Community's Cloud Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CloudFieldProps {
  speed?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
  className?: string;
}

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(float n){ return fract(sin(n)*43758.5453123); }
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }

float noise(float x){
    float i = floor(x);
    float f = fract(x);
    f = f*f*(3.0-2.0*f);
    return mix(hash(i), hash(i+1.0), f);
}

float fbm(float x, float octaves){
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for(int i = 0; i < 6; i++){
        if(float(i) >= octaves) break;
        val += amp * noise(x * freq);
        freq *= 2.17;
        amp *= 0.48;
    }
    return val;
}

float meteor(vec2 uv, float t){
    float cycle = mod(t * 0.15, 1.0);
    float seed = floor(t * 0.15);
    float h = hash(seed * 7.31);
    float h2 = hash(seed * 13.17);
    if(h > 0.30) return 0.0;
    vec2 start = vec2(0.2 + h2 * 0.6, 0.7 + h * 0.25);
    vec2 dir = normalize(vec2(1.0, -0.6 - h * 0.3));
    float progress = smoothstep(0.0, 0.7, cycle);
    vec2 pos = start + dir * progress * 0.5;
    vec2 toP = uv - pos;
    float along = dot(toP, dir);
    float perp = length(toP - dir * along);
    float trail = smoothstep(0.0, -0.12, along) * smoothstep(-0.18, -0.04, along);
    float core = smoothstep(0.003, 0.0, perp) * trail;
    float glow = smoothstep(0.012, 0.0, perp) * trail * 0.3;
    float fade = smoothstep(0.0, 0.1, cycle) * smoothstep(0.8, 0.55, cycle);
    return (core + glow) * fade;
}

float stars(vec2 uv, float density){
    vec2 cell = floor(uv * density);
    vec2 sub = fract(uv * density);
    float h = hash2(cell);
    float brightness = step(0.975, h);
    float size = 0.025 + h * 0.045;
    float d = length(sub - vec2(hash2(cell + 100.0), hash2(cell + 200.0)));
    float star = brightness * smoothstep(size, 0.0, d);
    star *= 0.5 + 0.5 * sin(u_time * (1.0 + h * 3.0) + h * 6.28);
    return star;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_res;
    float aspect = u_res.x / u_res.y;

    vec2 mouse = u_mouse * 2.0 - 1.0;

    vec3 skyTop    = vec3(0.015, 0.012, 0.045);
    vec3 skyMid    = vec3(0.035, 0.025, 0.085);
    vec3 skyBottom = vec3(0.065, 0.045, 0.14);

    float skyGrad = uv.y;
    vec3 col = mix(skyBottom, skyMid, smoothstep(0.3, 0.6, skyGrad));
    col = mix(col, skyTop, smoothstep(0.6, 1.0, skyGrad));

    float horizonY = 0.35;
    float horizonGlow = exp(-pow((uv.y - horizonY) * 3.8, 2.0));
    col += vec3(0.15, 0.07, 0.26) * horizonGlow * 0.8;

    float centerGlow = exp(-pow((uv.x - 0.5) * 1.5, 2.0)) * exp(-pow((uv.y - horizonY) * 4.0, 2.0));
    col += vec3(0.14, 0.10, 0.24) * centerGlow * 0.6;

    float starField = stars(uv * vec2(aspect, 1.0), 60.0)
                    + stars(uv * vec2(aspect, 1.0) + 500.0, 100.0) * 0.7
                    + stars(uv * vec2(aspect, 1.0) + 900.0, 160.0) * 0.4;

    float starMask = 1.0;
    float xC, yS, prof, mTop, mtn, rDist, rGlow, rAmb;
    vec3 lC;

    // Layer 0
    lC = vec3(0.14, 0.10, 0.24);
    xC = uv.x * aspect * 1.6 + u_time * 0.006 + mouse.x * 0.010;
    yS = mouse.y * 0.003;
    prof = fbm(xC, 5.0) * 0.10 + fbm(xC * 0.3 + 17.0, 3.0) * 0.07;
    mTop = 0.40 + prof + yS;
    mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
    rDist = abs(uv.y - mTop);
    rGlow = smoothstep(0.012, 0.0, rDist) * 0.18;
    rAmb = smoothstep(0.04, 0.0, rDist) * 0.06;
    col = mix(col, lC, mtn);
    col += vec3(0.20, 0.10, 0.35) * rGlow;
    col += vec3(0.12, 0.06, 0.22) * rAmb;
    starMask *= (1.0 - mtn);

    // Layer 1
    lC = vec3(0.11, 0.07, 0.19);
    xC = uv.x * aspect * 2.0 + u_time * 0.012 + mouse.x * 0.020;
    yS = mouse.y * 0.006;
    prof = fbm(xC, 5.0) * 0.13 + fbm(xC * 0.3 + 34.0, 3.0) * 0.091;
    mTop = 0.33 + prof + yS;
    mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
    rDist = abs(uv.y - mTop);
    rGlow = smoothstep(0.012, 0.0, rDist) * 0.15;
    rAmb = smoothstep(0.04, 0.0, rDist) * 0.045;
    col = mix(col, lC, mtn);
    col += vec3(0.20, 0.10, 0.35) * rGlow;
    col += vec3(0.12, 0.06, 0.22) * rAmb;
    starMask *= (1.0 - mtn);

    // Layer 2
    lC = vec3(0.08, 0.05, 0.14);
    xC = uv.x * aspect * 2.6 + u_time * 0.020 + mouse.x * 0.034;
    yS = mouse.y * 0.010;
    prof = fbm(xC, 5.0) * 0.16 + fbm(xC * 0.3 + 51.0, 3.0) * 0.112;
    mTop = 0.26 + prof + yS;
    mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
    rDist = abs(uv.y - mTop);
    rGlow = smoothstep(0.012, 0.0, rDist) * 0.12;
    rAmb = smoothstep(0.04, 0.0, rDist) * 0.03;
    col = mix(col, lC, mtn);
    col += vec3(0.20, 0.10, 0.35) * rGlow;
    col += vec3(0.12, 0.06, 0.22) * rAmb;
    starMask *= (1.0 - mtn);

    // Layer 3
    lC = vec3(0.05, 0.03, 0.09);
    xC = uv.x * aspect * 3.2 + u_time * 0.030 + mouse.x * 0.050;
    yS = mouse.y * 0.015;
    prof = fbm(xC, 5.0) * 0.14 + fbm(xC * 0.3 + 68.0, 3.0) * 0.098;
    mTop = 0.18 + prof + yS;
    mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
    rDist = abs(uv.y - mTop);
    rGlow = smoothstep(0.012, 0.0, rDist) * 0.09;
    col = mix(col, lC, mtn);
    col += vec3(0.20, 0.10, 0.35) * rGlow;
    starMask *= (1.0 - mtn);

    // Layer 4
    lC = vec3(0.03, 0.018, 0.055);
    xC = uv.x * aspect * 4.0 + u_time * 0.044 + mouse.x * 0.070;
    yS = mouse.y * 0.021;
    prof = fbm(xC, 5.0) * 0.11 + fbm(xC * 0.3 + 85.0, 3.0) * 0.077;
    mTop = 0.09 + prof + yS;
    mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
    rDist = abs(uv.y - mTop);
    rGlow = smoothstep(0.012, 0.0, rDist) * 0.06;
    col = mix(col, lC, mtn);
    col += vec3(0.20, 0.10, 0.35) * rGlow;
    starMask *= (1.0 - mtn);

    col += vec3(0.9, 0.8, 1.0) * starField * starMask;
    float met = meteor(uv * vec2(aspect, 1.0), u_time);
    col += vec3(0.8, 0.6, 1.0) * met * starMask;

    float vig = 1.0 - 0.3 * pow(length((uv - 0.5) * vec2(1.1, 1.6)), 2.0);
    col *= vig;

    float haze = exp(-pow((uv.y - 0.33) * 5.0, 2.0)) * 0.05;
    col += vec3(0.15, 0.10, 0.30) * haze;

    col = pow(col, vec3(0.95));

    gl_FragColor = vec4(col, 1.0);
}
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function CloudField({
  speed = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor = "#071010",
  className,
}: CloudFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    if (!host || !canvas || !gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mx = 0.5;
    let my = 0.5;
    let smx = 0.5;
    let smy = 0.5;
    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    let visible = true;

    const draw = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, smx, smy);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const tick = (now: number) => {
      elapsed += ((now - last) / 1000) * clamp(speedRef.current, 0, 3);
      last = now;
      smx += (mx - smx) * 0.04;
      smy += (my - smy) * 0.04;
      draw();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (prefersReducedMotion || !visible || document.hidden || frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = host.offsetWidth * dpr;
      canvas.height = host.offsetHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      mx = (event.clientX - bounds.left) / Math.max(1, bounds.width);
      my = 1.0 - (event.clientY - bounds.top) / Math.max(1, bounds.height);
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    const onVisibility = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVisibility);
    if (!prefersReducedMotion)
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    resizeObserver.observe(host);
    intersection.observe(host);
    if (prefersReducedMotion) elapsed = 4;
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(buf);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(prog);
    };
  }, [prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor, filter }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
