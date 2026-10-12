"use client";

// Ported from ThreeUI Community's Liquid Form (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiquidFormProps {
  speed?: number;
  morph?: number;
  noiseScale?: number;
  mouseAmount?: number;
  metal?: number;
  camera?: number;
  tintHue?: number;
  tintAmount?: number;
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
uniform float u_morph;
uniform float u_noise_scale;
uniform float u_mouse_amount;
uniform float u_metal;
uniform float u_camera;

#define MAX_STEPS 70
#define MAX_DIST 20.0
#define SURF_DIST 0.002

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float map(vec3 p, float t) {
  float radius = 1.8;
  float morph = snoise(p * (0.8 * u_noise_scale) + t * 0.1) * 0.2;
  morph += snoise(p * (1.5 * u_noise_scale) - t * 0.05 + 10.0) * 0.08;
  morph += snoise(p * (3.0 * u_noise_scale) + t * 0.02) * 0.02;
  return length(p) - radius + morph * u_morph;
}

vec3 calcNormal(vec3 p, float t) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(
    map(p+e.xyy, t) - map(p-e.xyy, t),
    map(p+e.yxy, t) - map(p-e.yxy, t),
    map(p+e.yyx, t) - map(p-e.yyx, t)
  ));
}

vec3 envLighting(vec3 rd, vec2 mouse) {
  vec3 col = vec3(0.03, 0.03, 0.03);
  vec3 keyDir = normalize(vec3(0.5 + mouse.x, 1.0 + mouse.y * 0.5, 1.2));
  float key = pow(max(dot(rd, keyDir), 0.0), 12.0);
  col += vec3(0.95, 0.93, 0.9) * key * 1.5;
  vec3 rimDir = normalize(vec3(-0.8, -0.2, -1.0));
  float rim = pow(max(dot(rd, rimDir), 0.0), 6.0);
  col += vec3(0.4, 0.42, 0.45) * rim * 0.8;
  vec3 fillDir = normalize(vec3(-1.0, 0.5, 0.5));
  float fill = pow(max(dot(rd, fillDir), 0.0), 3.0);
  col += vec3(0.2, 0.2, 0.2) * fill * 0.6;
  float panel = exp(-pow((rd.y - 0.2) * 4.0, 2.0)) * smoothstep(-0.5, 0.5, rd.z);
  col += vec3(0.15) * panel;
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);
  float t = u_time * 0.8;
  vec2 m = u_mouse * u_mouse_amount;
  vec3 ro = vec3(0.0, 0.0, u_camera);
  vec3 lookAt = vec3(m.x, m.y, 0.0);
  vec3 fwd = normalize(lookAt - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(fwd + uv.x * right + uv.y * up);
  vec3 bgCol = mix(vec3(0.02), vec3(0.05), length(uv) * 0.5);
  vec3 col = bgCol;
  float d = 0.0;
  for(int i=0; i<MAX_STEPS; i++) {
    vec3 p = ro + rd * d;
    float ds = map(p, t);
    d += ds;
    if(d > MAX_DIST || abs(ds) < SURF_DIST) break;
  }
  if(d < MAX_DIST) {
    vec3 p = ro + rd * d;
    vec3 n = calcNormal(p, t);
    vec3 ref = reflect(rd, n);
    float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
    fresnel = mix(0.4, 1.0, fresnel);
    vec3 env = envLighting(ref, u_mouse);
    col = env * fresnel * 1.8 * u_metal;
    vec3 lightPos = normalize(vec3(0.5 + u_mouse.x, 1.0, 1.0));
    float spec = pow(max(dot(ref, lightPos), 0.0), 60.0);
    col += vec3(1.0) * spec * 2.0 * u_metal;
    float disp = map(p, t) - (length(p) - 1.8);
    col *= mix(0.7, 1.0, smoothstep(-0.1, 0.1, disp));
  }
  float bloom = exp(-length(uv) * 2.5);
  col += vec3(0.02, 0.02, 0.02) * bloom;
  col = col / (col + 0.5);
  col = pow(col, vec3(1.0/2.2));
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Liquid Form shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Liquid Form shader compilation failed");
  }
  return shader;
}

export function LiquidForm({
  speed = 1,
  morph = 1,
  noiseScale = 1,
  mouseAmount = 0.15,
  metal = 1,
  camera = 5.5,
  tintHue = 220,
  tintAmount = 0,
  className,
}: LiquidFormProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const optionsRef = useRef({ speed, morph, noiseScale, mouseAmount, metal, camera });
  optionsRef.current = { speed, morph, noiseScale, mouseAmount, metal, camera };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Liquid Form program link failed");
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_res"),
      time: gl.getUniformLocation(program, "u_time"),
      mouse: gl.getUniformLocation(program, "u_mouse"),
      morph: gl.getUniformLocation(program, "u_morph"),
      noiseScale: gl.getUniformLocation(program, "u_noise_scale"),
      mouseAmount: gl.getUniformLocation(program, "u_mouse_amount"),
      metal: gl.getUniformLocation(program, "u_metal"),
      camera: gl.getUniformLocation(program, "u_camera"),
    };
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let frame = 0;
    let visible = true;
    const startedAt = performance.now();

    const draw = (elapsed: number) => {
      const options = optionsRef.current;
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, elapsed * options.speed);
      gl.uniform2f(uniforms.mouse, mouseX, mouseY);
      gl.uniform1f(uniforms.morph, options.morph);
      gl.uniform1f(uniforms.noiseScale, options.noiseScale);
      gl.uniform1f(uniforms.mouseAmount, options.mouseAmount);
      gl.uniform1f(uniforms.metal, options.metal);
      gl.uniform1f(uniforms.camera, options.camera);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const render = (now: number) => {
      draw((now - startedAt) * 0.001);
      frame = visible && !document.hidden ? requestAnimationFrame(render) : 0;
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (prefersReducedMotion) draw(6);
    };

    const pointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        return;
      }
      targetX = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
      targetY = -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let intersection: IntersectionObserver | undefined;
    if (!prefersReducedMotion) {
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible && !frame) frame = requestAnimationFrame(render);
        if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      });
      intersection.observe(host);
      window.addEventListener("pointermove", pointer, { passive: true });
      frame = requestAnimationFrame(render);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection?.disconnect();
      window.removeEventListener("pointermove", pointer);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
    };
  }, [prefersReducedMotion]);

  const tintFilter =
    tintAmount > 0
      ? `sepia(${tintAmount}) saturate(${1 + tintAmount * 5}) hue-rotate(${tintHue - 35}deg)`
      : undefined;

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("absolute inset-0 isolate overflow-hidden bg-black", className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ filter: tintFilter }}
      />
    </div>
  );
}
