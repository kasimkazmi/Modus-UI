"use client";

// Ported from ThreeUI Community's Laser (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type LaserVariant =
  "matrix-field" | "atmospheric-blade" | "vanishing-array" | "prism-aperture" | "halftone-relay";

interface LaserProps {
  variant?: LaserVariant;
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
  className?: string;
}

const VARIANT_INDEX: Record<Exclude<LaserVariant, "matrix-field">, number> = {
  "atmospheric-blade": 0,
  "vanishing-array": 1,
  "prism-aperture": 2,
  "halftone-relay": 3,
};

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_variant;
uniform float u_size;
uniform float u_length;
uniform float u_density;
uniform float u_hue;
uniform float u_saturation;
uniform float u_brightness;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float result = 0.0;
  float weight = 0.54;
  for (int i = 0; i < 4; i++) {
    result += valueNoise(p) * weight;
    p = mat2(1.62, 1.21, -1.21, 1.62) * p + 9.13;
    weight *= 0.48;
  }
  return result;
}

vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 0.6666667, 0.3333333)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

vec3 accent(float baseHue, float saturationScale) {
  float hue = fract(baseHue + u_hue / 360.0);
  return hsv2rgb(vec3(hue, clamp(u_saturation * saturationScale, 0.0, 1.0), 1.0));
}

vec2 laserProfile(float distanceToLine, float coreWidth, float glowWidth) {
  float core = exp(-pow(distanceToLine / max(coreWidth, 0.0002), 2.0));
  float glow = exp(-pow(distanceToLine / max(glowWidth, 0.001), 1.25));
  return vec2(core, glow);
}

vec3 atmosphericBlade(vec2 p) {
  float drift = sin(u_time * 0.21) * 0.025;
  float center = u_pointer.x * 0.16 + drift;
  float tilt = u_pointer.x * 0.055 + sin(u_time * 0.13) * 0.018;
  float distanceToBeam = abs(p.x - center - p.y * tilt);
  float verticalMask = 1.0 - smoothstep(0.68 * u_length, 1.35 * u_length, abs(p.y));
  vec2 beam = laserProfile(distanceToBeam, 0.0028 * u_size, 0.052 * u_size);

  vec2 fogUv = vec2(p.x * 3.4, p.y * 2.15 - u_time * 0.075);
  fogUv.x += sin(p.y * 3.2 - u_time * 0.17) * 0.18;
  float fogNoise = fbm(fogUv + u_pointer * 0.35);
  float fogEnvelope = exp(-pow(distanceToBeam / (0.24 * u_size), 1.35));
  float fog = smoothstep(0.34, 0.78, fogNoise) * fogEnvelope * u_density * verticalMask;

  float mirageDistance = abs(abs(p.x - center + p.y * tilt * 0.35) - 0.105 * u_length);
  vec2 mirage = laserProfile(mirageDistance, 0.0011 * u_size, 0.016 * u_size);
  float mirageMask = (1.0 - smoothstep(0.08, 1.2, abs(p.y))) * (0.35 + 0.65 * fogNoise);

  vec3 tint = accent(0.43, 0.82);
  vec3 color = vec3(0.0025, 0.004, 0.006);
  color += tint * fog * 0.34;
  color += tint * beam.y * verticalMask * (0.48 + 0.06 * sin(u_time * 1.1));
  color += mix(tint, vec3(1.0), 0.88) * beam.x * verticalMask * 1.65;
  color += tint * mirage.y * mirageMask * 0.12 * u_density;
  color += vec3(0.8, 0.98, 0.9) * mirage.x * mirageMask * 0.35 * u_density;

  float contact = exp(-length(vec2((p.x - center) * 2.5, p.y + 0.77 * u_length)) * 7.0);
  color += tint * contact * 0.45;
  return color;
}

vec3 vanishingArray(vec2 p) {
  vec2 origin = vec2(u_pointer.x * 0.16, 0.12 + u_pointer.y * 0.075);
  vec2 q = p - origin;
  float radius = length(q);
  float angle = atan(q.y, q.x);
  float spokeCount = floor(11.0 + u_density * 10.0);
  float angularDistance = abs(sin(angle * spokeCount));
  float spoke = exp(-angularDistance * max(radius, 0.06) / (0.0075 * u_size));
  float reach = smoothstep(0.035, 0.16, radius) * (1.0 - smoothstep(0.42 * u_length, 1.55 * u_length, radius));
  float lowerField = 1.0 - smoothstep(-0.12, 0.22, q.y);
  float upperField = smoothstep(0.02, 0.52, q.y) * 0.48;
  float fieldMask = max(lowerField, upperField);

  float carrier = 0.55 + 0.45 * sin(radius * 16.0 - u_time * 4.1 + angle * 2.0);
  carrier = pow(max(carrier, 0.0), 7.0);
  float rail = spoke * reach * fieldMask;
  float railCore = pow(rail, 2.1);

  float ringPhase = abs(sin((radius * 13.0 - u_time * 1.5) / max(u_length, 0.35)));
  float rings = exp(-ringPhase / (0.035 * u_size)) * (1.0 - smoothstep(0.1, 1.2, radius)) * lowerField;
  float horizon = exp(-abs(q.y) / (0.0035 * u_size)) * (1.0 - smoothstep(0.12, 1.15, abs(q.x)));

  vec3 violet = accent(0.70, 0.78);
  vec3 amber = accent(0.055, 0.84);
  vec3 railTint = mix(violet, amber, 0.5 + 0.5 * sin(angle * 3.0));
  vec3 color = vec3(0.004, 0.0035, 0.009);
  color += railTint * rail * (0.24 + carrier * 0.72);
  color += mix(railTint, vec3(1.0), 0.9) * railCore * (0.52 + carrier * 0.92);
  color += violet * rings * 0.14 * u_density;
  color += vec3(0.82, 0.9, 1.0) * horizon * 0.38;
  color += violet * exp(-radius * 15.0) * 0.95;
  return color;
}

vec3 prismAperture(vec2 p) {
  vec2 center = u_pointer * vec2(0.12, 0.08);
  vec2 q = p - center;
  float breathing = 0.46 * u_length + sin(u_time * 0.72) * 0.012;
  float warp = (fbm(q * 3.2 + vec2(0.0, -u_time * 0.08)) - 0.5) * 0.025 * u_density;
  float diamond = abs(q.x * 0.82) + abs(q.y) - breathing - warp;
  float innerDiamond = abs(q.x * 0.82) + abs(q.y) - breathing * 0.66 + warp * 0.45;
  vec2 outer = laserProfile(abs(diamond), 0.0024 * u_size, 0.046 * u_size);
  vec2 inner = laserProfile(abs(innerDiamond), 0.0012 * u_size, 0.018 * u_size);

  float edgeMask = 1.0 - smoothstep(0.25, 1.18, length(q));
  float perimeterPhase = sin((q.x - q.y) * 15.0 - u_time * 3.3);
  float packets = pow(max(perimeterPhase, 0.0), 10.0) * outer.y;
  float axisX = exp(-abs(q.x) / (0.002 * u_size)) * (1.0 - smoothstep(0.04, breathing, abs(q.y)));
  float axisY = exp(-abs(q.y) / (0.002 * u_size)) * (1.0 - smoothstep(0.04, breathing, abs(q.x)));

  float redFringe = exp(-pow(abs(diamond - 0.011 * u_size) / (0.011 * u_size), 1.4));
  float blueFringe = exp(-pow(abs(diamond + 0.011 * u_size) / (0.011 * u_size), 1.4));
  vec3 tint = accent(0.79, 0.8);
  vec3 color = vec3(0.004, 0.0025, 0.007);
  color += tint * outer.y * edgeMask * 0.5;
  color += mix(tint, vec3(1.0), 0.9) * outer.x * edgeMask * 1.5;
  color += tint * inner.y * edgeMask * 0.18 * u_density;
  color += vec3(1.0) * inner.x * edgeMask * 0.48 * u_density;
  color += accent(0.98, 0.92) * redFringe * 0.13;
  color += accent(0.54, 0.9) * blueFringe * 0.16;
  color += vec3(0.92, 0.96, 1.0) * (axisX + axisY) * 0.2;
  color += tint * packets * 0.85;
  color += tint * exp(-length(q) * 9.0) * 0.22;
  return color;
}

vec3 halftoneRelay(vec2 p) {
  float center = 0.29 + u_pointer.x * 0.12;
  float bend = sin(p.y * 2.1 - u_time * 0.25) * 0.018;
  float mainDistance = abs(p.x - center - bend);
  float relayDistance = abs(p.x - center + 0.075 * u_length + bend * 0.45);
  vec2 mainBeam = laserProfile(mainDistance, 0.0022 * u_size, 0.072 * u_size);
  vec2 relayBeam = laserProfile(relayDistance, 0.0012 * u_size, 0.025 * u_size);

  vec2 fogUv = vec2(p.x * 3.0, p.y * 2.5 - u_time * 0.1);
  float fogNoise = fbm(fogUv + vec2(sin(u_time * 0.16), 0.0));
  float fog = smoothstep(0.28, 0.78, fogNoise) * exp(-mainDistance * 9.5 / u_size) * u_density;

  float dotScale = mix(9.0, 4.5, clamp((u_density - 0.25) / 2.25, 0.0, 1.0));
  vec2 dotCell = fract(gl_FragCoord.xy / dotScale) - 0.5;
  float dot = 1.0 - smoothstep(0.08, 0.34, length(dotCell));
  float dotMask = dot * smoothstep(0.08, 0.68, fog + mainBeam.y * 0.65);

  float pulse = pow(max(0.0, sin(p.y * 9.0 - u_time * 4.0)), 12.0);
  float horizontalRelay = exp(-abs(p.y + 0.34 - u_pointer.y * 0.08) / (0.0024 * u_size));
  horizontalRelay *= 1.0 - smoothstep(0.1, 1.05 * u_length, abs(p.x - center));

  vec3 tint = accent(0.54, 0.84);
  vec3 color = vec3(0.002, 0.005, 0.009);
  color += tint * fog * 0.24;
  color += tint * mainBeam.y * 0.54;
  color += mix(tint, vec3(1.0), 0.9) * mainBeam.x * 1.48;
  color += tint * relayBeam.y * 0.2;
  color += vec3(0.78, 0.95, 1.0) * relayBeam.x * 0.5;
  color += tint * dotMask * (0.3 + pulse * 0.42);
  color += mix(tint, vec3(1.0), 0.8) * horizontalRelay * (0.22 + pulse * 0.58);
  return color;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec3 color;

  if (u_variant < 0.5) {
    color = atmosphericBlade(p);
  } else if (u_variant < 1.5) {
    color = vanishingArray(p);
  } else if (u_variant < 2.5) {
    color = prismAperture(p);
  } else {
    color = halftoneRelay(p);
  }

  float vignette = 1.0 - smoothstep(0.24, 1.45, length(p * vec2(0.72, 0.88)));
  color *= 0.55 + vignette * 0.45;
  color *= u_brightness;
  color = color / (color + vec3(0.72));
  color = pow(max(color, vec3(0.0)), vec3(0.82));
  gl_FragColor = vec4(color, 1.0);
}
`;

// Matrix Field (ThreeUI "Matrix Junction") keeps its original standalone shader.
const MATRIX_FIELD_SHADER = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform float u_intensity;

float hash(float n) { return fract(sin(n)*753.5453123); }
float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f*f*(3.0-2.0*f);
    return mix(hash(i), hash(i+1.0), f);
}

vec2 sdLine(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return vec2(length(pa - ba * h), h);
}

float lightning(vec2 uv, vec2 a, vec2 b, float t) {
    vec2 ab = b - a;
    float len = length(ab);
    if(len < 0.01) return 0.0;
    vec2 dir = ab / len;

    vec2 pa = uv - a;
    float h = clamp(dot(pa, dir) / len, 0.0, 1.0);
    float dist = length(pa - dir * (h * len));

    float env = sin(h * 3.1415);

    float offset = (noise(h * 25.0 - t * 35.0) - 0.5) * 0.08 * env;
    offset += (noise(h * 70.0 + t * 50.0) - 0.5) * 0.02 * env;

    float d = abs(dist + offset);

    return (0.0002 / (d + 0.0002) + 0.00001 / (d*d + 0.00001)) * env;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 mouseUV = u_mouse / u_resolution.xy;
    mouseUV = mouseUV * 2.0 - 1.0;
    mouseUV.x *= u_resolution.x / u_resolution.y;

    vec2 center = vec2(-0.8, -0.2);
    center.x += sin(u_time * 0.4) * 0.03;
    center.y += cos(u_time * 0.3) * 0.03;

    vec2 dirUp = normalize(vec2(0.15, 1.0));
    vec2 dirRight = normalize(vec2(1.0, -0.25));
    vec2 dirDownLeft = normalize(vec2(-0.8, -0.6));

    vec2 l1 = sdLine(uv, center, center + dirUp * 5.0);
    vec2 l2 = sdLine(uv, center, center + dirRight * 5.0);
    vec2 l3 = sdLine(uv, center, center + dirDownLeft * 5.0);

    float intensity = u_intensity;
    float glow = intensity / (l1.x + 0.001) +
                 intensity / (l2.x + 0.001) +
                 (intensity * 0.4) / (l3.x + 0.001);

    float pulse1 = smoothstep(0.1, 0.0, abs(l1.y - fract(u_time * 0.4))) * 0.03 / (l1.x + 0.001);
    float pulse2 = smoothstep(0.1, 0.0, abs(l2.y - fract(u_time * 0.5 + 0.3))) * 0.03 / (l2.x + 0.001);
    float pulse3 = smoothstep(0.1, 0.0, abs(l3.y - fract(u_time * 0.3 + 0.7))) * 0.015 / (l3.x + 0.001);
    glow += pulse1 + pulse2 + pulse3;

    vec2 p1 = center + dirUp * clamp(dot(mouseUV - center, dirUp), 0.0, 5.0);
    vec2 p2 = center + dirRight * clamp(dot(mouseUV - center, dirRight), 0.0, 5.0);
    vec2 p3 = center + dirDownLeft * clamp(dot(mouseUV - center, dirDownLeft), 0.0, 5.0);

    float lgt1 = lightning(uv, p1, mouseUV, u_time);
    float lgt2 = lightning(uv, p2, mouseUV, u_time + 10.0);
    float lgt3 = lightning(uv, p3, mouseUV, u_time + 20.0);

    float flicker = step(0.1, noise(u_time * 60.0)) * (noise(u_time * 150.0) * 0.8 + 0.2);

    float d1 = length(mouseUV - p1);
    float d2 = length(mouseUV - p2);
    float d3 = length(mouseUV - p3);

    glow += lgt1 * smoothstep(2.0, 0.0, d1) * u_mouseActive * flicker;
    glow += lgt2 * smoothstep(2.0, 0.0, d2) * u_mouseActive * flicker;
    glow += lgt3 * smoothstep(2.0, 0.0, d3) * u_mouseActive * flicker;

    float distToCenter = length(uv - center);
    glow += 0.04 / (distToCenter + 0.01);

    vec3 baseColor = vec3(0.6, 0.75, 1.0);
    vec3 finalColor = baseColor * glow;

    finalColor *= 0.85 + 0.15 * sin(u_time * 2.0 - distToCenter * 8.0);

    float vignette = 1.0 - smoothstep(0.4, 2.0, length(uv));
    finalColor *= vignette;

    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    finalColor += n * 0.02;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Laser shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Laser shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function Laser({
  variant = "atmospheric-blade",
  speed = 1,
  size = 1,
  length = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor = "#020305",
  className,
}: LaserProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redrawRef = useRef<() => void>(() => undefined);
  const prefersReducedMotion = useReducedMotion();
  const optionsRef = useRef({ variant, speed, size, length, density, hue, saturation, brightness });
  optionsRef.current = { variant, speed, size, length, density, hue, saturation, brightness };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const matrixShader = compile(gl, gl.FRAGMENT_SHADER, MATRIX_FIELD_SHADER);
    const link = (fragment: WebGLShader) => {
      const linked = gl.createProgram();
      if (!linked) throw new Error("Unable to create Laser program");
      gl.attachShader(linked, vertexShader);
      gl.attachShader(linked, fragment);
      gl.bindAttribLocation(linked, 0, "a_position");
      gl.linkProgram(linked);
      if (!gl.getProgramParameter(linked, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(linked) ?? "Laser program link failed";
        gl.deleteProgram(linked);
        throw new Error(message);
      }
      return linked;
    };
    const program = link(fragmentShader);
    const matrixProgram = link(matrixShader);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      time: gl.getUniformLocation(program, "u_time"),
      variant: gl.getUniformLocation(program, "u_variant"),
      size: gl.getUniformLocation(program, "u_size"),
      length: gl.getUniformLocation(program, "u_length"),
      density: gl.getUniformLocation(program, "u_density"),
      hue: gl.getUniformLocation(program, "u_hue"),
      saturation: gl.getUniformLocation(program, "u_saturation"),
      brightness: gl.getUniformLocation(program, "u_brightness"),
    };

    const matrixUniforms = {
      resolution: gl.getUniformLocation(matrixProgram, "u_resolution"),
      time: gl.getUniformLocation(matrixProgram, "u_time"),
      mouse: gl.getUniformLocation(matrixProgram, "u_mouse"),
      mouseActive: gl.getUniformLocation(matrixProgram, "u_mouseActive"),
      intensity: gl.getUniformLocation(matrixProgram, "u_intensity"),
    };

    let frame = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let lastMouseMove = -Infinity;
    let mouseActive = 0;
    let visible = true;
    let targetX = 0;
    let targetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    const startedAt = performance.now();

    const draw = (now: number) => {
      const options = optionsRef.current;
      const time = prefersReducedMotion
        ? 2.75
        : (now - startedAt) * 0.001 * clamp(options.speed, 0, 3);

      if (options.variant === "matrix-field") {
        const sinceMove = now - lastMouseMove;
        const targetActive = prefersReducedMotion
          ? 0
          : sinceMove < 150
            ? 1
            : Math.max(0, 1 - (sinceMove - 150) / 350);
        mouseActive += (targetActive - mouseActive) * 0.15;
        gl.useProgram(matrixProgram);
        gl.uniform2f(matrixUniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(matrixUniforms.time, time);
        gl.uniform2f(matrixUniforms.mouse, mouseX, mouseY);
        gl.uniform1f(matrixUniforms.mouseActive, mouseActive);
        gl.uniform1f(
          matrixUniforms.intensity,
          0.006 * clamp(options.size, 0.05, 200) * clamp(options.length, 0.35, 2.5),
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return;
      }

      const index = VARIANT_INDEX[options.variant] ?? 0;
      pointerX += (targetX - pointerX) * (prefersReducedMotion ? 1 : 0.055);
      pointerY += (targetY - pointerY) * (prefersReducedMotion ? 1 : 0.055);

      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, pointerX, pointerY);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.variant, index);
      gl.uniform1f(uniforms.size, clamp(options.size, 0.35, 2.5));
      gl.uniform1f(uniforms.length, clamp(options.length, 0.35, 2.5));
      gl.uniform1f(uniforms.density, clamp(options.density, 0.25, 2.5));
      gl.uniform1f(uniforms.hue, clamp(options.hue, -180, 180));
      gl.uniform1f(uniforms.saturation, clamp(options.saturation, 0, 2));
      gl.uniform1f(uniforms.brightness, clamp(options.brightness, 0.35, 1.65));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = (now: number) => {
      frame = 0;
      draw(now);
      if (!prefersReducedMotion && visible && !document.hidden) {
        frame = requestAnimationFrame(render);
      }
    };

    const sync = () => {
      if (prefersReducedMotion || !visible || document.hidden) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        draw(performance.now());
        return;
      }
      if (!frame) frame = requestAnimationFrame(render);
    };
    redrawRef.current = () => draw(performance.now());

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw(performance.now());
    };

    // Listen on window so content layered above the background does not block the beam.
    const handlePointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      const inside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      if (inside) {
        const pixelRatio = canvas.width / Math.max(1, bounds.width);
        mouseX = (event.clientX - bounds.left) * pixelRatio;
        mouseY = (bounds.bottom - event.clientY) * pixelRatio;
        lastMouseMove = performance.now();
        targetX = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
        targetY = -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1);
      } else {
        targetX = 0;
        targetY = 0;
      }
      if (prefersReducedMotion) draw(performance.now());
    };
    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      if (prefersReducedMotion) draw(performance.now());
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    });
    resizeObserver.observe(host);
    intersection.observe(host);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", sync);
    resize();
    sync();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", sync);
      redrawRef.current = () => undefined;
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(matrixShader);
      gl.deleteProgram(program);
      gl.deleteProgram(matrixProgram);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    redrawRef.current();
  }, [variant, speed, size, length, density, hue, saturation, brightness]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full"
        style={{
          opacity: clamp(opacity, 0.05, 1),
          // ThreeUI tints Matrix Field with a CSS filter instead of in the shader.
          filter:
            variant === "matrix-field" && (hue !== 0 || saturation !== 1 || brightness !== 1)
              ? `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`
              : undefined,
        }}
      />
    </div>
  );
}
