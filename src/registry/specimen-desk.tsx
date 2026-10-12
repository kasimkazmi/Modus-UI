"use client";
// Ported from ThreeUI Community's Bookshelf (MIT, © 2026 Meng To).
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cn } from "@/lib/utils";

export interface SpecimenDeskCard {
  /** Short name printed on the card and in the caption. */
  name: string;
  /** Glyphs set large on the card face. */
  glyph: string;
  /** Which Modus font family the specimen is set in. */
  face: "heading" | "body" | "mono";
}

const DEFAULT_CARDS: SpecimenDeskCard[] = [
  { name: "Display", glyph: "Aa", face: "heading" },
  { name: "Text", glyph: "Rg", face: "body" },
  { name: "Code", glyph: "{}", face: "mono" },
  { name: "Italic", glyph: "&", face: "heading" },
  { name: "Numerals", glyph: "27", face: "body" },
  { name: "Labels", glyph: "Mx", face: "mono" },
  { name: "Capitals", glyph: "Q", face: "heading" },
];

// Neutral desk materials: oiled oak at night, a pale felt mat by day.
const OAK = "#4a3426";
const OAK_DARK = "#2a1d15";

const CARD_W = 1.15;
const CARD_L = 1.75;
const CARD_T = 0.018;
const SPREAD = 0.3;

type Tokens = {
  background: THREE.Color;
  foreground: THREE.Color;
  primary: THREE.Color;
  muted: THREE.Color;
  dark: boolean;
  css: { background: string; foreground: string; primary: string; muted: string };
  fonts: { heading: string; body: string; mono: string };
};

function readTokens(): Tokens {
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  const channel = (name: string) => root.getPropertyValue(name).trim() || "0 0% 50%";
  const toColor = (value: string) => {
    const [h, s, l] = value
      .replace(/%/g, "")
      .split(/[\s,]+/)
      .map(Number);
    return new THREE.Color().setHSL((h || 0) / 360, (s || 0) / 100, (l || 0) / 100);
  };
  const css = {
    background: channel("--background"),
    foreground: channel("--foreground"),
    primary: channel("--primary"),
    muted: channel("--muted"),
  };
  const background = toColor(css.background);
  const hsl = { h: 0, s: 0, l: 0 };
  background.getHSL(hsl);
  const font = (name: string, fallback: string) =>
    body.getPropertyValue(name).trim() || root.getPropertyValue(name).trim() || fallback;
  return {
    background,
    foreground: toColor(css.foreground),
    primary: toColor(css.primary),
    muted: toColor(css.muted),
    dark: hsl.l < 0.5,
    css,
    fonts: {
      heading: font("--font-heading", "Georgia, serif"),
      body: font("--font-body", "system-ui, sans-serif"),
      mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
  };
}

// Card stock tone i of n: a ramp from paper through the primary to ink.
function cardTone(tokens: Tokens, index: number, count: number) {
  const t = count > 1 ? index / (count - 1) : 0;
  const paper = tokens.background.clone().lerp(tokens.muted, 0.5);
  const ink = tokens.dark ? tokens.background.clone().lerp(tokens.primary, 0.12) : tokens.primary;
  const accent = tokens.primary.clone();
  const hsl = { h: 0, s: 0, l: 0 };
  accent.getHSL(hsl);
  accent.setHSL(hsl.h, Math.min(1, hsl.s + 0.25), tokens.dark ? 0.42 : 0.55);
  if (t < 0.5) return paper.lerp(accent, t * 2 * 0.85);
  return accent.lerp(ink, (t - 0.5) * 2);
}

function drawCardFace(tokens: Tokens, card: SpecimenDeskCard, index: number, count: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 780;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const tone = cardTone(tokens, index, count);
  const hsl = { h: 0, s: 0, l: 0 };
  tone.getHSL(hsl);
  const light = hsl.l > 0.42;
  const ink = light ? "rgba(20,16,14,0.86)" : "rgba(255,252,246,0.92)";
  const faint = light ? "rgba(20,16,14,0.32)" : "rgba(255,252,246,0.36)";
  ctx.fillStyle = `#${tone.getHexString(THREE.SRGBColorSpace)}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = faint;
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
  const family = tokens.fonts[card.face];
  ctx.fillStyle = ink;
  ctx.font = `500 22px ${tokens.fonts.mono}`;
  ctx.textBaseline = "top";
  ctx.fillText(`NO. ${String(index + 1).padStart(2, "0")}`, 52, 56);
  ctx.textAlign = "right";
  ctx.fillText(card.face.toUpperCase(), canvas.width - 52, 56);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `400 250px ${family}`;
  ctx.fillText(card.glyph, canvas.width / 2, 330);
  ctx.fillStyle = faint;
  ctx.fillRect(52, 520, canvas.width - 104, 2);
  ctx.fillStyle = ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 54px ${tokens.fonts.heading}`;
  ctx.fillText(card.name, 52, 600);
  ctx.font = `400 22px ${family}`;
  ctx.fillText("abcdefghijklm 0123456789", 52, 660);
  ctx.font = `500 18px ${tokens.fonts.mono}`;
  ctx.fillStyle = faint;
  ctx.fillText("MODUS SPECIMEN", 52, 712);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, tone };
}

interface SceneOptions {
  cards: SpecimenDeskCard[];
  reducedMotion: boolean;
  onSelect: (index: number) => void;
}

function createSpecimenDesk(host: HTMLElement, canvas: HTMLCanvasElement, options: SceneOptions) {
  const { cards, reducedMotion, onSelect } = options;
  const count = cards.length;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 7, 15);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);

  // Desk and mat.
  const desk = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ roughness: 0.85 }),
  );
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = true;
  scene.add(desk);
  const mat = new THREE.Mesh(
    new RoundedBoxGeometry(5.6, 0.02, 3.6, 2, 0.04),
    new THREE.MeshStandardMaterial({ roughness: 0.95 }),
  );
  mat.position.set(-0.2, 0.01, 0.1);
  mat.receiveShadow = true;
  scene.add(mat);

  // The fan of specimen cards, pinned at one corner.
  const pivot = new THREE.Vector3(0, 0.03, 1.15);
  const cardGeometry = new RoundedBoxGeometry(CARD_W, CARD_T, CARD_L, 2, 0.006);
  cardGeometry.translate(0, 0, -CARD_L / 2 + 0.12);
  const edgeMaterial = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const cardGroups: THREE.Group[] = [];
  const faceMaterials: THREE.MeshStandardMaterial[] = [];
  cards.forEach((_, index) => {
    const group = new THREE.Group();
    group.position.copy(pivot);
    group.position.y += index * (CARD_T + 0.004);
    const face = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    faceMaterials.push(face);
    const mesh = new THREE.Mesh(cardGeometry, face);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.index = index;
    group.add(mesh);
    scene.add(group);
    cardGroups.push(group);
  });
  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.2, 24),
    new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.3 }),
  );
  pin.position.set(pivot.x, 0.1, pivot.z);
  pin.castShadow = true;
  scene.add(pin);

  // Props: a closed notebook, a pencil and an ink pot.
  const notebook = new THREE.Mesh(
    new RoundedBoxGeometry(1.6, 0.12, 2.2, 2, 0.03),
    new THREE.MeshStandardMaterial({ roughness: 0.8 }),
  );
  notebook.position.set(-2.4, 0.07, -0.4);
  notebook.rotation.y = 0.28;
  notebook.castShadow = true;
  notebook.receiveShadow = true;
  scene.add(notebook);
  const pencil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.7, 6),
    new THREE.MeshStandardMaterial({ roughness: 0.6 }),
  );
  pencil.rotation.set(Math.PI / 2, 0, -0.9);
  pencil.position.set(1.9, 0.05, 0.9);
  pencil.castShadow = true;
  scene.add(pencil);
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.42, 32),
    new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1 }),
  );
  pot.position.set(2.3, 0.21, -0.9);
  pot.castShadow = true;
  scene.add(pot);

  // Lights: a daylight window by day, a lamp pool by night.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  scene.add(hemi);
  const key = new THREE.SpotLight(0xffffff, 1, 18, 0.55, 0.85, 1.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);

  let tokens = readTokens();
  let textures: THREE.Texture[] = [];

  function applyTheme() {
    tokens = readTokens();
    textures.forEach((texture) => texture.dispose());
    textures = [];
    const { background, foreground, primary, muted, dark } = tokens;
    const sky = dark
      ? background.clone().lerp(primary, 0.06).multiplyScalar(0.7)
      : background.clone().lerp(new THREE.Color(1, 1, 1), 0.3);
    scene.background = sky;
    (scene.fog as THREE.Fog).color.copy(sky);
    (desk.material as THREE.MeshStandardMaterial).color.set(
      dark ? OAK_DARK : background.clone().lerp(muted, 0.6),
    );
    (mat.material as THREE.MeshStandardMaterial).color.set(
      dark ? OAK : background.clone().lerp(new THREE.Color(1, 1, 1), 0.6),
    );
    const accent = primary.clone();
    const hsl = { h: 0, s: 0, l: 0 };
    accent.getHSL(hsl);
    (notebook.material as THREE.MeshStandardMaterial).color.setHSL(
      hsl.h,
      Math.min(1, hsl.s + 0.2),
      dark ? 0.3 : 0.4,
    );
    (pencil.material as THREE.MeshStandardMaterial).color.copy(foreground);
    (pot.material as THREE.MeshStandardMaterial).color.copy(
      dark ? foreground.clone().lerp(background, 0.85) : primary,
    );
    (pin.material as THREE.MeshStandardMaterial).color.setHSL(hsl.h, 0.35, 0.6);
    edgeMaterial.color.copy(background);
    cards.forEach((card, index) => {
      const { texture } = drawCardFace(tokens, card, index, count);
      textures.push(texture);
      faceMaterials[index].map = texture;
      faceMaterials[index].needsUpdate = true;
    });

    if (dark) {
      const lamp = foreground.clone().lerp(new THREE.Color().setHSL(hsl.h, 0.7, 0.7), 0.4);
      hemi.color.copy(sky).multiplyScalar(1.6);
      hemi.groundColor.copy(background);
      hemi.intensity = 0.9;
      key.color.copy(lamp);
      key.intensity = 70;
      key.angle = 0.75;
      key.penumbra = 0.9;
      key.position.set(-1.6, 4.4, -0.6);
      renderer.toneMappingExposure = 1.05;
    } else {
      hemi.color.copy(background).lerp(new THREE.Color(1, 1, 1), 0.5);
      hemi.groundColor.copy(muted);
      hemi.intensity = 1.5;
      key.color.copy(new THREE.Color(1, 1, 1).lerp(background, 0.3));
      key.intensity = 55;
      key.angle = 0.9;
      key.penumbra = 1;
      key.position.set(3.5, 7, -3);
      renderer.toneMappingExposure = 0.95;
    }
  }
  applyTheme();

  // Fan state.
  let selected = Math.floor(count / 2);
  let inspecting = false;
  const angles = cardGroups.map(() => 0);
  const lifts = cardGroups.map(() => 0);
  const tilts = cardGroups.map(() => 0);

  function targetFor(index: number) {
    const offset = index - selected;
    const angle = -offset * SPREAD;
    const isSel = index === selected;
    return {
      angle,
      lift: isSel ? (inspecting ? 0.9 : 0.18) : 0,
      tilt: isSel ? (inspecting ? 0.95 : 0.14) : 0,
    };
  }

  function layout(step: number) {
    cardGroups.forEach((group, index) => {
      const target = targetFor(index);
      angles[index] += (target.angle - angles[index]) * step;
      lifts[index] += (target.lift - lifts[index]) * step;
      tilts[index] += (target.tilt - tilts[index]) * step;
      group.position.y = pivot.y + index * (CARD_T + 0.004) + lifts[index];
      group.rotation.set(0, 0, 0);
      group.rotateY(angles[index]);
      group.rotateX(tilts[index]);
    });
  }
  layout(1);

  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Pull back on narrow frames so the whole fan stays in shot.
    const distance = camera.aspect < 1 ? 7.5 / camera.aspect ** 0.6 : 6.2;
    camera.position.set(1.6, distance * 0.72, distance * 0.62 + 1);
    camera.lookAt(0.1, 0, 0.1);
    camera.updateProjectionMatrix();
    renderFrame();
  }

  let elapsed = 0;
  function renderFrame() {
    renderer.render(scene, camera);
  }

  // Loop, paused off screen and in hidden tabs.
  let frame = 0;
  let visible = true;
  let last = performance.now();
  function tick(now: number) {
    frame = 0;
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += delta;
    layout(1 - Math.exp(-delta * 7));
    if (!reducedMotion) {
      key.position.x += Math.sin(elapsed * 0.4) * 0.0015;
    }
    renderFrame();
    start();
  }
  function start() {
    if (reducedMotion || frame || !visible || document.hidden) return;
    frame = requestAnimationFrame(tick);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function refresh() {
    if (reducedMotion) {
      layout(1);
      renderFrame();
    } else {
      last = performance.now();
      start();
    }
  }

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) refresh();
    else stop();
  });
  intersection.observe(host);
  const onVisibility = () => (document.hidden ? stop() : refresh());
  document.addEventListener("visibilitychange", onVisibility);

  const themeObserver = new MutationObserver(() => {
    applyTheme();
    renderFrame();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  });

  function select(index: number) {
    const next = (index + count) % count;
    if (next === selected) inspecting = !inspecting;
    else {
      selected = next;
      inspecting = false;
    }
    onSelect(selected);
    refresh();
  }

  // Pointer: click a card to bring it forward, click again to lift it; drag sideways to fan.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downX = 0;
  let dragged = 0;
  const onDown = (event: PointerEvent) => {
    downX = event.clientX;
    dragged = 0;
  };
  const onMove = (event: PointerEvent) => {
    if (!event.buttons) return;
    const steps = Math.trunc((event.clientX - downX) / 60);
    if (steps !== 0) {
      dragged += Math.abs(steps);
      downX = event.clientX;
      selected = Math.max(0, Math.min(count - 1, selected - steps));
      inspecting = false;
      onSelect(selected);
      refresh();
    }
  };
  const onUp = (event: PointerEvent) => {
    if (dragged) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(cardGroups, true)[0];
    if (hit) select(hit.object.userData.index as number);
    else if (inspecting) {
      inspecting = false;
      refresh();
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") select(Math.max(0, selected - 1));
    else if (event.key === "ArrowRight") select(Math.min(count - 1, selected + 1));
    else if (event.key === "Enter" || event.key === " ") select(selected);
    else if (event.key === "Escape" && inspecting) {
      inspecting = false;
      refresh();
    } else return;
    event.preventDefault();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  host.addEventListener("keydown", onKey);

  resize();
  start();
  onSelect(selected);

  return {
    resize,
    dispose() {
      stop();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      host.removeEventListener("keydown", onKey);
      textures.forEach((texture) => texture.dispose());
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      edgeMaterial.dispose();
      renderer.dispose();
    },
  };
}

export interface SpecimenDeskProps {
  className?: string;
  /** Specimen cards fanned on the desk, bottom of the stack first. */
  cards?: SpecimenDeskCard[];
}

export function SpecimenDesk({ className, cards = DEFAULT_CARDS }: SpecimenDeskProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(Math.floor(cards.length / 2));
  const [error, setError] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;
    let desk: ReturnType<typeof createSpecimenDesk>;
    try {
      desk = createSpecimenDesk(host, canvas, {
        cards,
        reducedMotion: !!prefersReducedMotion,
        onSelect: setSelected,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unsupported context");
      return undefined;
    }
    const resizeObserver = new ResizeObserver(() => desk.resize());
    resizeObserver.observe(host);
    return () => {
      resizeObserver.disconnect();
      desk.dispose();
    };
  }, [cards, prefersReducedMotion]);

  const card = cards[selected];

  return (
    <div
      ref={hostRef}
      tabIndex={0}
      className={cn(
        "absolute inset-0 block h-full w-full overflow-hidden bg-background outline-none",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none"
        aria-label="Fan of type specimen cards on a desk. Use the arrow keys to browse and Enter to lift a card."
      />
      {card ? (
        <div
          className="pointer-events-none absolute bottom-5 left-5 text-foreground"
          aria-live="polite"
        >
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Specimen {String(selected + 1).padStart(2, "0")} /{" "}
            {String(cards.length).padStart(2, "0")}
          </p>
          <p className="m-0 font-serif text-3xl leading-tight">{card.name}</p>
        </div>
      ) : null}
      {error ? (
        <p
          className="absolute inset-0 m-0 grid place-items-center p-6 text-center text-foreground"
          role="status"
        >
          WebGL is unavailable: {error}.
        </p>
      ) : null}
    </div>
  );
}
