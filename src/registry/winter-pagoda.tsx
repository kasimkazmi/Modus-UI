"use client";
// Ported from ThreeUI Community's Temple Night (MIT, © 2026 Meng To).
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface WinterPagodaProps {
  /** Snowfall density, 0 to 1. */
  snow?: number;
  /** Colour shown behind the canvas while the scene loads. Defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
}

const DPR_CAP = 1.75;

/* Theme tokens are bare HSL channels ("222 47% 11%"). */
function token(name: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const [h = 0, s = 0, l = 0] = raw.split(/[\s,/]+/).map((v) => parseFloat(v));
  return new THREE.Color().setHSL(h / 360, s / 100, l / 100, THREE.SRGBColorSpace);
}

/* The whole look comes from the theme: daylight on paper in light mode,
   a pale winter moon over the background in dark mode. */
function readTheme() {
  const bg = token("--background");
  const fg = token("--foreground");
  const primary = token("--primary");
  const muted = token("--muted");
  const hsl = { h: 0, s: 0, l: 0 };
  bg.getHSL(hsl, THREE.SRGBColorSpace);
  const dark = hsl.l < 0.5;
  /* mix in sRGB so ramps read the way the tokens do, not brightened by linear blending */
  const mix = (a: THREE.Color, b: THREE.Color, t: number) => {
    const x = a.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
    const y = b.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
    return new THREE.Color().setRGB(
      x.r + (y.r - x.r) * t,
      x.g + (y.g - x.g) * t,
      x.b + (y.b - x.b) * t,
      THREE.SRGBColorSpace,
    );
  };
  primary.getHSL(hsl, THREE.SRGBColorSpace);
  /* a saturated, readable accent even when the primary is near-black */
  const glow = new THREE.Color().setHSL(
    hsl.h,
    Math.max(hsl.s, 0.55),
    dark ? Math.max(hsl.l, 0.62) : 0.55,
    THREE.SRGBColorSpace,
  );
  if (dark) {
    return {
      dark,
      skyTop: mix(bg, glow, 0.06).multiplyScalar(0.75),
      skyLow: mix(bg, fg, 0.06),
      fog: mix(bg, fg, 0.05),
      snow: mix(bg, fg, 0.52),
      ink: mix(bg, glow, 0.12).multiplyScalar(0.8),
      wood: mix(bg, glow, 0.35),
      stone: mix(muted, fg, 0.15),
      disc: mix(fg, glow, 0.08),
      glow,
      window: glow.clone(),
      flake: mix(fg, bg, 0.1),
      sun: mix(fg, glow, 0.1),
      sunI: 0.9,
      hemiI: 0.8,
      lampI: 7,
    };
  }
  return {
    dark,
    skyTop: mix(bg, primary, 0.06),
    skyLow: mix(bg, glow, 0.1).lerp(new THREE.Color(1, 1, 1), 0.3),
    fog: mix(bg, muted, 0.35),
    snow: mix(bg, new THREE.Color(1, 1, 1), 0.6),
    ink: mix(fg, muted, 0.45),
    wood: mix(fg, glow, 0.4),
    stone: mix(muted, fg, 0.22),
    disc: mix(bg, glow, 0.18).lerp(new THREE.Color(1, 1, 1), 0.4),
    glow,
    window: mix(glow, bg, 0.35),
    flake: mix(fg, muted, 0.55),
    sun: new THREE.Color(1, 1, 1),
    sunI: 2.1,
    hemiI: 1.3,
    lampI: 0,
  };
}

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* gentle rolling snowfield that climbs into the slope behind the pagoda */
function groundHeight(x: number, z: number) {
  const rise = Math.max(0, -z - 8) * 0.28;
  return (
    Math.sin(x * 0.18) * 0.5 +
    Math.cos(z * 0.21 + x * 0.07) * 0.45 +
    Math.sin(x * 0.53 + z * 0.37) * 0.12 +
    rise -
    Math.exp(-(x * x + z * z) / 40) * 0.6
  );
}

function createWinterPagoda(canvas: HTMLCanvasElement, reduced: boolean, density: number) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.3, 400);
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T) => (disposables.push(d), d);

  const mats = {
    snow: track(new THREE.MeshLambertMaterial()),
    ink: track(new THREE.MeshLambertMaterial()),
    wood: track(new THREE.MeshLambertMaterial()),
    stone: track(new THREE.MeshLambertMaterial()),
    window: track(new THREE.MeshBasicMaterial()),
    lamp: track(new THREE.MeshBasicMaterial()),
  };
  const fog = new THREE.Fog(0, 18, 120);
  scene.fog = fog;
  const hemi = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  sun.position.set(-30, 26, 18);
  scene.add(hemi, sun);

  /* sky dome: vertical gradient, ignores fog */
  const skyMat = track(
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uTop: { value: new THREE.Color() }, uLow: { value: new THREE.Color() } },
      vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform vec3 uTop; uniform vec3 uLow; varying float vY;
        void main(){ gl_FragColor = vec4(mix(uLow, uTop, smoothstep(-0.05, 0.55, vY)), 1.);
          #include <colorspace_fragment>
        }`,
    }),
  );
  scene.add(new THREE.Mesh(track(new THREE.SphereGeometry(300, 32, 16)), skyMat));

  /* sun or moon disc with a soft halo */
  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = haloCanvas.height = 128;
  const hc = haloCanvas.getContext("2d")!;
  const grad = hc.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.16, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  hc.fillStyle = grad;
  hc.fillRect(0, 0, 128, 128);
  const discMat = track(
    new THREE.SpriteMaterial({
      map: track(new THREE.CanvasTexture(haloCanvas)),
      fog: false,
      depthWrite: false,
      transparent: true,
    }),
  );
  const disc = new THREE.Sprite(discMat);
  disc.scale.setScalar(70);
  disc.position.set(-95, 62, -230);
  scene.add(disc);

  /* snowfield */
  const groundGeo = track(new THREE.PlaneGeometry(220, 220, 110, 110));
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < gp.count; i++) gp.setY(i, groundHeight(gp.getX(i), gp.getZ(i)));
  groundGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(groundGeo, mats.snow));

  /* far ridges: faceted peaks fading into the haze */
  const r = rand(7);
  const peakGeo = track(new THREE.ConeGeometry(1, 1, 7, 1));
  const capGeo = track(new THREE.ConeGeometry(1, 1, 7, 1));
  for (let i = 0; i < 9; i++) {
    const w = 26 + r() * 30;
    const h = 22 + r() * 30;
    const x = -150 + i * 38 + r() * 12;
    const z = -150 - r() * 50;
    const peak = new THREE.Mesh(peakGeo, mats.ink);
    peak.scale.set(w, h, w * 0.7);
    peak.position.set(x, h / 2 - 4, z);
    peak.rotation.y = r() * 3;
    const cap = new THREE.Mesh(capGeo, mats.snow);
    cap.scale.set(w * 0.42, h * 0.42, w * 0.3);
    cap.position.set(x, h - 4 - h * 0.21 + 0.4, z);
    cap.rotation.y = peak.rotation.y;
    scene.add(peak, cap);
  }

  /* the pagoda: five diminishing tiers with flared, snow-laden roofs */
  const pagoda = new THREE.Group();
  const box = track(new THREE.BoxGeometry(1, 1, 1));
  const roofGeo = track(new THREE.ConeGeometry(1, 1, 4, 1, true));
  const roofCapGeo = track(new THREE.ConeGeometry(1, 1, 4, 1));
  const rail = track(new THREE.CylinderGeometry(1, 1, 1, 8));
  const base = new THREE.Mesh(box, mats.stone);
  base.scale.set(7.4, 1, 7.4);
  base.position.y = 0.5;
  pagoda.add(base);
  let y = 1;
  for (let t = 0; t < 5; t++) {
    const s = 4.6 - t * 0.62;
    const h = t === 0 ? 2.6 : 1.55;
    const body = new THREE.Mesh(box, mats.wood);
    body.scale.set(s, h, s);
    body.position.y = y + h / 2;
    pagoda.add(body);
    for (const side of [0, 1, 2, 3]) {
      const win = new THREE.Mesh(box, mats.window);
      const a = (side * Math.PI) / 2;
      win.scale.set(s * 0.42, h * 0.38, 0.05);
      win.position.set(Math.sin(a) * (s / 2 + 0.02), y + h * 0.5, Math.cos(a) * (s / 2 + 0.02));
      win.rotation.y = a;
      pagoda.add(win);
    }
    y += h;
    const rw = s * 1.06 + 1.5;
    const roof = new THREE.Mesh(roofGeo, mats.ink);
    roof.scale.set(rw, 1.15, rw);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = y + 0.42;
    const snowCap = new THREE.Mesh(roofCapGeo, mats.snow);
    snowCap.scale.set(rw * 0.86, 0.9, rw * 0.86);
    snowCap.rotation.y = Math.PI / 4;
    snowCap.position.y = y + 0.56;
    pagoda.add(roof, snowCap);
    y += 0.35;
  }
  const spire = new THREE.Mesh(rail, mats.wood);
  spire.scale.set(0.09, 3.2, 0.09);
  spire.position.y = y + 1.8;
  pagoda.add(spire);
  for (let k = 0; k < 6; k++) {
    const ring = new THREE.Mesh(rail, mats.wood);
    ring.scale.set(0.3 - k * 0.025, 0.08, 0.3 - k * 0.025);
    ring.position.y = y + 0.9 + k * 0.38;
    pagoda.add(ring);
  }
  pagoda.position.set(0, groundHeight(0, 0) - 0.4, 0);
  scene.add(pagoda);

  /* stone lanterns lining the path up from the camera */
  const lampLights: THREE.PointLight[] = [];
  const lampSpots: [number, number][] = [
    [-2.6, 8],
    [2.6, 8],
    [-2.8, 15],
    [2.8, 15],
    [-3, 22],
  ];
  for (const [x, z] of lampSpots) {
    const g = new THREE.Group();
    const foot = new THREE.Mesh(rail, mats.stone);
    foot.scale.set(0.38, 0.3, 0.38);
    foot.position.y = 0.15;
    const post = new THREE.Mesh(rail, mats.stone);
    post.scale.set(0.14, 1.1, 0.14);
    post.position.y = 0.85;
    const lamp = new THREE.Mesh(box, mats.lamp);
    lamp.scale.set(0.42, 0.4, 0.42);
    lamp.position.y = 1.6;
    const hat = new THREE.Mesh(roofCapGeo, mats.stone);
    hat.scale.set(0.62, 0.38, 0.62);
    hat.rotation.y = Math.PI / 4;
    hat.position.y = 1.99;
    const hatSnow = new THREE.Mesh(roofCapGeo, mats.snow);
    hatSnow.scale.set(0.5, 0.3, 0.5);
    hatSnow.rotation.y = Math.PI / 4;
    hatSnow.position.y = 2.08;
    g.add(foot, post, lamp, hat, hatSnow);
    g.position.set(x, groundHeight(x, z) - 0.05, z);
    scene.add(g);
    if (Math.abs(z - 15) < 1) {
      const light = new THREE.PointLight(undefined, 0, 9, 1.6);
      light.position.set(x, g.position.y + 1.6, z);
      lampLights.push(light);
      scene.add(light);
    }
  }
  /* stepping stones */
  const stepGeo = track(new THREE.CylinderGeometry(0.55, 0.62, 0.14, 9));
  for (let z = 4.6; z < 26; z += 1.5) {
    const x = Math.sin(z * 0.35) * 0.4;
    const step = new THREE.Mesh(stepGeo, mats.stone);
    step.position.set(x, groundHeight(x, z) + 0.02, z);
    step.rotation.y = z;
    scene.add(step);
  }

  /* pine stands: three stacked cones with snow on their shoulders */
  const pr = rand(19);
  const pines: { x: number; z: number; s: number }[] = [];
  while (pines.length < 150) {
    const x = (pr() - 0.5) * 150;
    const z = 10 - pr() * 120;
    if (Math.abs(x) < 9 && z > -10) continue;
    if (Math.abs(x) < 5) continue;
    /* keep the sightline from the camera arc to the pagoda clear */
    if (z > -6 && x < 4 && x > -22 + z * 0.1) continue;
    pines.push({ x, z, s: 0.7 + pr() * 1.1 });
  }
  pines.push({ x: -24, z: 16, s: 2.4 }, { x: 9, z: 9, s: 2 });
  const needleGeo = track(new THREE.ConeGeometry(1, 1, 7));
  const pineSnowGeo = track(new THREE.ConeGeometry(1, 1, 7));
  const needles = new THREE.InstancedMesh(needleGeo, mats.ink, pines.length * 3);
  const pineSnow = new THREE.InstancedMesh(pineSnowGeo, mats.snow, pines.length * 3);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  pines.forEach((p, i) => {
    const gy = groundHeight(p.x, p.z);
    for (let k = 0; k < 3; k++) {
      const w = (1.5 - k * 0.38) * p.s;
      const h = (2.4 - k * 0.4) * p.s;
      const cy = gy + (0.9 + k * 1.25) * p.s + h / 2;
      m.compose(v.set(p.x, cy, p.z), q, sc.set(w, h, w));
      needles.setMatrixAt(i * 3 + k, m);
      m.compose(v.set(p.x, cy + h * 0.2, p.z), q, sc.set(w * 0.62, h * 0.6, w * 0.62));
      pineSnow.setMatrixAt(i * 3 + k, m);
    }
  });
  scene.add(needles, pineSnow);

  /* snowfall: points drifting on a looping column around the camera */
  const COUNT = Math.round(600 + 2400 * Math.max(0, Math.min(1, density)));
  const flakeGeo = track(new THREE.BufferGeometry());
  const fp = new Float32Array(COUNT * 3);
  const fs = new Float32Array(COUNT);
  const fr = rand(3);
  for (let i = 0; i < COUNT; i++) {
    fp[i * 3] = (fr() - 0.5) * 60;
    fp[i * 3 + 1] = fr() * 26;
    fp[i * 3 + 2] = fr() * 50 - 20;
    fs[i] = 0.4 + fr();
  }
  flakeGeo.setAttribute("position", new THREE.BufferAttribute(fp, 3));
  flakeGeo.setAttribute("aSeed", new THREE.BufferAttribute(fs, 1));
  const flakeMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uT: { value: 0 },
        uPx: { value: 600 },
        uColor: { value: new THREE.Color() },
        uAlpha: { value: 1 },
      },
      vertexShader: `uniform float uT; uniform float uPx; attribute float aSeed; varying float vA;
        void main(){
          vec3 p = position;
          p.y = mod(p.y - uT * (0.9 + aSeed * 0.8), 26.0) - 1.0;
          p.x += sin(uT * 0.6 * aSeed + p.y * 0.4 + aSeed * 9.0) * 0.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uPx * 0.035 * aSeed / -mv.z;
          vA = smoothstep(60.0, 8.0, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, smoothstep(0.5, 0.15, d) * vA * uAlpha);
          #include <colorspace_fragment>
        }`,
    }),
  );
  scene.add(new THREE.Points(flakeGeo, flakeMat));

  function applyTheme() {
    const th = readTheme();
    skyMat.uniforms.uTop.value.copy(th.skyTop);
    skyMat.uniforms.uLow.value.copy(th.skyLow);
    fog.color.copy(th.fog);
    fog.near = th.dark ? 14 : 22;
    fog.far = th.dark ? 105 : 150;
    mats.snow.color.copy(th.snow);
    mats.ink.color.copy(th.ink);
    mats.wood.color.copy(th.wood);
    mats.stone.color.copy(th.stone);
    mats.window.color.copy(th.window);
    mats.lamp.color.copy(th.dark ? th.glow : th.stone.clone().lerp(th.window, 0.3));
    discMat.color.copy(th.disc);
    disc.scale.setScalar(th.dark ? 46 : 90);
    disc.position.y = th.dark ? 70 : 34;
    hemi.color.copy(th.dark ? th.disc : th.skyTop.clone().lerp(new THREE.Color(1, 1, 1), 0.5));
    hemi.groundColor.copy(th.dark ? th.ink : th.snow);
    hemi.intensity = th.hemiI;
    sun.color.copy(th.sun);
    sun.intensity = th.sunI;
    sun.position.set(th.dark ? -30 : 40, th.dark ? 30 : 14, th.dark ? -10 : -30);
    lampLights.forEach((l) => {
      l.color.copy(th.glow);
      l.intensity = th.lampI;
    });
    flakeMat.uniforms.uColor.value.copy(th.flake);
    flakeMat.uniforms.uAlpha.value = th.dark ? 0.85 : 0.6;
  }
  applyTheme();

  /* camera: a slow arc across the path, framing the pagoda off-centre */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let clock = 0;
  let prev = 0;
  function placeCamera() {
    const a = -0.42 + Math.sin(clock * 0.045) * 0.16;
    const rad = 30 - Math.sin(clock * 0.03) * 2;
    camera.position.set(
      Math.sin(a) * rad + pointer.x * 0.9,
      3.2 + pointer.y * 0.5,
      Math.cos(a) * rad,
    );
    const wide = camera.aspect > 1.2;
    camera.lookAt(wide ? -4.5 : 0, 6.8, 0);
  }

  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 50 : 34;
    camera.updateProjectionMatrix();
    flakeMat.uniforms.uPx.value = h * renderer.getPixelRatio();
  }

  function render(now: number) {
    const dt = reduced ? 0 : Math.min(prev ? (now - prev) / 1000 : 0, 0.05);
    prev = now;
    clock += dt;
    pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-2.5 * dt));
    pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-2.5 * dt));
    flakeMat.uniforms.uT.value = reduced ? 7 : clock;
    placeCamera();
    renderer.render(scene, camera);
  }

  return {
    render,
    resize,
    applyTheme,
    setPointer(x: number, y: number) {
      pointer.tx = x;
      pointer.ty = y;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      needles.dispose();
      pineSnow.dispose();
      renderer.dispose();
    },
  };
}

export function WinterPagoda({ snow = 0.6, backgroundColor, className }: WinterPagodaProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const reduced = !!prefersReducedMotion;
    let scene: ReturnType<typeof createWinterPagoda>;
    try {
      scene = createWinterPagoda(canvas, reduced, snow);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown renderer error");
      setState("unavailable");
      return;
    }
    let frame = 0;
    let visible = true;
    let disposed = false;
    const schedule = () => {
      if (!disposed && visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
    };
    const tick = (time: number) => {
      frame = 0;
      scene.render(time);
      setState("ready");
      if (!reduced) schedule();
    };
    const resize = () => {
      scene.resize();
      schedule();
    };
    const onPointer = (event: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      scene.setPointer(
        ((event.clientX - b.left) / Math.max(1, b.width)) * 2 - 1,
        1 - ((event.clientY - b.top) / Math.max(1, b.height)) * 2,
      );
      schedule();
    };
    const clearPointer = () => {
      scene.setPointer(0, 0);
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    const themeObserver = new MutationObserver(() => {
      scene.applyTheme();
      schedule();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    });
    intersectionObserver.observe(host);
    canvas.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("pointerleave", clearPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", clearPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.dispose();
    };
  }, [prefersReducedMotion, snow]);

  return (
    <div
      ref={hostRef}
      data-state={state}
      className={cn("absolute inset-0 overflow-hidden bg-background", className)}
      style={backgroundColor ? { background: backgroundColor } : undefined}
    >
      <canvas
        ref={canvasRef}
        aria-label="A five-tier pagoda among snowy pines, under falling snow"
        className="block h-full w-full touch-none transition-opacity duration-700"
        style={{ opacity: state === "ready" ? 1 : 0 }}
      />
      {state === "unavailable" ? (
        <p
          role="status"
          className="absolute inset-0 m-0 grid place-items-center bg-background font-mono text-xs uppercase tracking-widest text-muted-foreground"
        >
          WebGL is unavailable: {errorMessage || "unsupported context"}.
        </p>
      ) : null}
    </div>
  );
}
