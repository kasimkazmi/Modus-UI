"use client";
// Ported from ThreeUI Community's Bookshelf (MIT, © 2026 Meng To).
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { cn } from "@/lib/utils";

// Walnut grain drawn on a canvas, used when no `woodTexture` URL is given.
function createProceduralWood() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  let seed = 1337;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  ctx.fillStyle = "#b58a66";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let band = 0; band < 90; band += 1) {
    const y0 = random() * canvas.height;
    const amplitude = 2 + random() * 9;
    const frequency = 0.002 + random() * 0.006;
    const phase = random() * Math.PI * 2;
    const dark = random() > 0.45;
    ctx.strokeStyle = dark
      ? `rgba(70,40,24,${0.08 + random() * 0.22})`
      : `rgba(235,200,160,${0.05 + random() * 0.12})`;
    ctx.lineWidth = 0.6 + random() * 3.2;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 8) {
      const y =
        y0 +
        Math.sin(x * frequency + phase) * amplitude +
        Math.sin(x * frequency * 3.1 + phase * 1.7) * amplitude * 0.3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let fleck = 0; fleck < 2600; fleck += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    ctx.fillStyle = random() > 0.5 ? "rgba(60,32,18,0.08)" : "rgba(255,230,200,0.06)";
    ctx.fillRect(x, y, 6 + random() * 26, 1);
  }
  return canvas;
}

function createBookshelfRenderer(host?: any, canvas?: any, callbacks: any = {}) {
  let destroyed = false;

  const BOOKS: any = [
    {
      id: "codex",
      title: "Codex",
      roman: "I",
      discipline: "Agentic craft",
      note: "Precise intent, translated into tested systems.",
      deck: "A field manual for delegating repository work to Codex: state the intent, let the agent trace the system, and treat tests and browser proof as part of the craft.",
      binding: "Ultramarine cloth · copper foil",
      format: "148 × 216 mm · imagined edition",
      theme: "Codex · intent into implementation",
      motif: "Nested brackets",
      motifKey: "brackets",
      paletteLabel: "Ultramarine · bone · copper",
      color: "#182a43",
      foil: "#c87046",
      palette: {
        paper: "#171a24",
        paperDeep: "#10131b",
        paperPale: "#f1eadf",
        ink: "#f4eee6",
        inkSoft: "#b9b4ae",
        wall: "#171a24",
        shelf: "#3a2118",
        shelfDark: "#1c0e0a",
        light: "#f4d7b9",
        fill: "#9fb3c9",
      },
      width: 1.02,
      height: 1.58,
      depth: 0.26,
      chapters: ["Intent", "Repository atlas", "Proof"],
      seed: 11,
    },
    {
      id: "claude-code",
      title: "Claude Code",
      roman: "II",
      discipline: "Contextual reasoning",
      note: "Long context, held with deliberation and care.",
      deck: "An annotated volume on Claude Code’s context-first practice: read the project, reason across files, preserve the surrounding work, and make every intervention explainable.",
      binding: "Burnt-orange cloth · antique-gold foil",
      format: "156 × 228 mm · imagined edition",
      theme: "Claude Code · context before intervention",
      motif: "Interlaced paths",
      motifKey: "paths",
      paletteLabel: "Burnt orange · cream · burgundy",
      color: "#c24d24",
      foil: "#efc16d",
      palette: {
        paper: "#762f1b",
        paperDeep: "#572113",
        paperPale: "#ffe4c5",
        ink: "#fff0df",
        inkSoft: "#e3bfa8",
        wall: "#762f1b",
        shelf: "#402015",
        shelfDark: "#1d0d08",
        light: "#ffd19a",
        fill: "#dc8c6b",
      },
      width: 1.1,
      height: 1.46,
      depth: 0.29,
      chapters: ["Context", "Deliberation", "Intervention"],
      seed: 22,
    },
    {
      id: "cursor",
      title: "Cursor",
      roman: "III",
      discipline: "Directed editing",
      note: "A fast line between the thought and the file.",
      deck: "A compact handbook for editing with Cursor: navigate living codebases quickly, keep the active context close, and change the right surface without disturbing the rest.",
      binding: "Citron cloth · black gloss foil",
      format: "140 × 210 mm · imagined edition",
      theme: "Cursor · navigation with momentum",
      motif: "Directional caret",
      motifKey: "caret",
      paletteLabel: "Citron · ink · off-white",
      color: "#afc400",
      foil: "#171a16",
      palette: {
        paper: "#c3cf21",
        paperDeep: "#9eaa16",
        paperPale: "#f0f2c9",
        ink: "#171914",
        inkSoft: "#485015",
        wall: "#c3cf21",
        shelf: "#3b2418",
        shelfDark: "#1c0f09",
        light: "#fff6ce",
        fill: "#dce37e",
      },
      width: 0.92,
      height: 1.52,
      depth: 0.22,
      chapters: ["Navigation", "Selection", "Momentum"],
      seed: 33,
    },
    {
      id: "antigravity",
      title: "Antigravity",
      roman: "IV",
      discipline: "Spatial systems",
      note: "Ideas released from the flatness of the page.",
      deck: "A speculative atlas for Antigravity’s spatial way of working: let agents move across tools, make complex structures visible, and understand the system through motion.",
      binding: "Cobalt cloth · cool-silver foil",
      format: "162 × 240 mm · imagined edition",
      theme: "Antigravity · structure in motion",
      motif: "Suspended orbits",
      motifKey: "orbits",
      paletteLabel: "Cobalt · sky · silver",
      color: "#1537a1",
      foil: "#dbe8f1",
      palette: {
        paper: "#142a80",
        paperDeep: "#0b1953",
        paperPale: "#dbe8f1",
        ink: "#f3f5f2",
        inkSoft: "#b5c7e9",
        wall: "#142a80",
        shelf: "#3b2117",
        shelfDark: "#1a0d08",
        light: "#e5edf2",
        fill: "#5f85dc",
      },
      width: 1.08,
      height: 1.68,
      depth: 0.25,
      chapters: ["System map", "Tool orbit", "Spatial proof"],
      seed: 44,
    },
    {
      id: "figma",
      title: "Figma",
      roman: "V",
      discipline: "Collaborative form",
      note: "Components, conversations, and systems in common.",
      deck: "A modular reader on designing in Figma: move from loose frames to shared components, invite critique into the canvas, and leave behind a system others can extend.",
      binding: "Vermilion cloth · rose-gold foil",
      format: "150 × 220 mm · imagined edition",
      theme: "Figma · a shared visual language",
      motif: "Connected modules",
      motifKey: "modules",
      paletteLabel: "Vermilion · plum · blush",
      color: "#c83222",
      foil: "#efb0aa",
      palette: {
        paper: "#a62c21",
        paperDeep: "#7f1e17",
        paperPale: "#ffe0d5",
        ink: "#fff0e8",
        inkSoft: "#e9bbb2",
        wall: "#a62c21",
        shelf: "#432016",
        shelfDark: "#1f0d08",
        light: "#ffd1bc",
        fill: "#d66d66",
      },
      width: 1,
      height: 1.48,
      depth: 0.3,
      chapters: ["Frames", "Components", "Common language"],
      seed: 55,
    },
    {
      id: "framer",
      title: "Framer",
      roman: "VI",
      discipline: "Interactive composition",
      note: "Structure becomes rhythm when the page begins to move.",
      deck: "A studio notebook for Framer: compose responsive pages directly in the medium, then tune type, layout, and interaction until motion feels native to the structure.",
      binding: "Coral cloth · copper foil",
      format: "146 × 224 mm · imagined edition",
      theme: "Framer · composition through motion",
      motif: "Folded frames",
      motifKey: "frames",
      paletteLabel: "Coral · pink · oxblood",
      color: "#da3b2f",
      foil: "#ff8eab",
      palette: {
        paper: "#ae2830",
        paperDeep: "#7f1822",
        paperPale: "#ffe0df",
        ink: "#fff0e9",
        inkSoft: "#efb9b4",
        wall: "#ae2830",
        shelf: "#402016",
        shelfDark: "#1d0d08",
        light: "#ffc3bb",
        fill: "#e46d78",
      },
      width: 0.96,
      height: 1.57,
      depth: 0.24,
      chapters: ["Structure", "Rhythm", "Responsive motion"],
      seed: 66,
    },
    {
      id: "xcode",
      title: "Xcode",
      roman: "VII",
      discipline: "Native making",
      note: "A measured path from blueprint to living device.",
      deck: "A technical folio for making with Xcode: shape the Swift interface, compile against the platform, inspect the runtime, and refine until the result feels native.",
      binding: "Icy-cyan cloth · aluminum foil",
      format: "158 × 232 mm · imagined edition",
      theme: "Xcode · blueprint into native form",
      motif: "Drafting compass",
      motifKey: "compass",
      paletteLabel: "Icy cyan · navy · aluminum",
      color: "#78a7bd",
      foil: "#e4e7e5",
      palette: {
        paper: "#7ea5b7",
        paperDeep: "#5e8699",
        paperPale: "#e6f0f2",
        ink: "#102a36",
        inkSoft: "#274b5a",
        wall: "#7ea5b7",
        shelf: "#382017",
        shelfDark: "#1b0e09",
        light: "#eef5f2",
        fill: "#add1df",
      },
      width: 1.12,
      height: 1.63,
      depth: 0.28,
      chapters: ["Blueprint", "Build", "Runtime"],
      seed: 77,
    },
  ];

  // Seven 2:3 cover artworks arranged left to right in one embedded atlas.
  const COVER_CROPS: any = [
    [0, 0, 512, 768],
    [512, 0, 512, 768],
    [1024, 0, 512, 768],
    [1536, 0, 512, 768],
    [2048, 0, 512, 768],
    [2560, 0, 512, 768],
    [3072, 0, 512, 768],
  ];
  // Optional cover atlas (seven 512x768 crops left to right); without it the
  // renderer draws each cover procedurally from the BOOKS data.
  const coverAtlasImage = new Image();
  coverAtlasImage.decoding = "async";
  coverAtlasImage.crossOrigin = "anonymous";
  if (callbacks.coverAtlas) coverAtlasImage.src = callbacks.coverAtlas;
  let coverAtlasReady = false;
  let woodTextureImage: any;
  if (callbacks.woodTexture) {
    woodTextureImage = new Image();
    woodTextureImage.decoding = "async";
    woodTextureImage.crossOrigin = "anonymous";
    woodTextureImage.src = callbacks.woodTexture;
  } else {
    woodTextureImage = createProceduralWood();
  }
  let woodTextureReady = false;

  const experience = host;
  const loading = experience.querySelector('[data-bookshelf="loading"]');
  const fallbackStatus = experience.querySelector('[data-bookshelf="fallback-status"]');
  const browseUi = experience.querySelector('[data-bookshelf="browse-ui"]');
  const detailPanel = experience.querySelector('[data-bookshelf="detail-panel"]');
  const selectionTitle = experience.querySelector('[data-bookshelf="selection-title"]');
  const selectionNote = experience.querySelector('[data-bookshelf="selection-note"]');
  const counter = experience.querySelector('[data-bookshelf="counter"]');
  const paletteLabel = experience.querySelector('[data-bookshelf="palette-label"]');
  const markers = experience.querySelector('[data-bookshelf="markers"]');
  const previousButton = experience.querySelector('[data-bookshelf="previous"]');
  const nextButton = experience.querySelector('[data-bookshelf="next"]');
  const inspectButton = experience.querySelector('[data-bookshelf="inspect"]');
  const closeButton = experience.querySelector('[data-bookshelf="close-detail"]');
  const resetButton = experience.querySelector('[data-bookshelf="reset-view"]');
  const toggleBookButton = experience.querySelector('[data-bookshelf="toggle-book"]');
  const previousPageButton = experience.querySelector('[data-bookshelf="previous-page"]');
  const nextPageButton = experience.querySelector('[data-bookshelf="next-page"]');
  const pageLabel = experience.querySelector('[data-bookshelf="page-label"]');
  const pageCounter = experience.querySelector('[data-bookshelf="page-counter"]');
  const detailMicrocopy = experience.querySelector(".detail-controls .microcopy");
  const detailEyebrow = experience.querySelector('[data-bookshelf="detail-eyebrow"]');
  const detailTitle = experience.querySelector('[data-bookshelf="detail-title"]');
  const detailDeck = experience.querySelector('[data-bookshelf="detail-deck"]');
  const detailBinding = experience.querySelector('[data-bookshelf="detail-binding"]');
  const detailFormat = experience.querySelector('[data-bookshelf="detail-format"]');
  const detailTheme = experience.querySelector('[data-bookshelf="detail-theme"]');
  const detailMotif = experience.querySelector('[data-bookshelf="detail-motif"]');
  const liveRegion = experience.querySelector('[data-bookshelf="live-region"]');
  const pointerLabel = experience.querySelector('[data-bookshelf="pointer-label"]');
  const pointerLabelIndex = experience.querySelector('[data-bookshelf="pointer-label-index"]');
  const pointerLabelTitle = experience.querySelector('[data-bookshelf="pointer-label-title"]');
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  loading.hidden = false;

  const clamp = THREE.MathUtils.clamp;
  const damp = THREE.MathUtils.damp;
  const lerp = THREE.MathUtils.lerp;
  const smoothstep = (value?: any) => value * value * (3 - 2 * value);
  const smootherstep = (value?: any) => value * value * value * (value * (value * 6 - 15) + 10);
  const mod = (value?: any, length?: any) => ((value % length) + length) % length;
  const pad = (value?: any) => String(value).padStart(2, "0");

  let reducedMotion = callbacks.reducedMotion || reducedMotionQuery.matches;
  let offscreen = false;
  let intersectionObserver: any = null;
  let renderer: any;
  let scene: any;
  let camera: any;
  let controls: any;
  let environmentTarget: any;
  let shelfStage: any;
  let bookRigs: any = [];
  let hitTargets: any = [];
  let rafId = 0;
  let lastTime = performance.now();
  let mode = "hero";
  let transitionTime = 0;
  let position = 0;
  let targetPosition = 0;
  let selectedIndex = 0;
  let hoveredIndex = -1;
  let wheelIdle = 0;
  let focusReturnTarget = inspectButton;
  let activeBook: any = null;
  let readingOpen = false;
  let detailBookHovered = false;
  let currentSpread = 0;
  let pointerDirty = false;
  let suspended = false;
  let viewWidth = Math.max(1, experience.clientWidth);
  let viewHeight = Math.max(1, experience.clientHeight);
  let detailViewOffsetX = 0;
  let currentViewOffsetX = 0;
  let detailSafeWidth = viewWidth * 0.6;
  let themeInitialized = false;
  let themeMoving = false;

  const roomMaterials: any = {
    floor: null,
    wall: null,
    shelf: null,
    shelfDark: null,
    shadow: null,
  };
  const roomLights: any = {
    hemisphere: null,
    key: null,
    softKey: null,
    fill: null,
    rim: null,
    backFill: null,
    spineRake: null,
    pageRake: null,
  };
  const themeTargets: any = {
    floor: new THREE.Color(0xd8c8aa),
    wall: new THREE.Color(0xe9dfcb),
    shelf: new THREE.Color(0x4a2b1d),
    shelfDark: new THREE.Color(0x2a170f),
    shadow: new THREE.Color(0x2f1d13),
    fog: new THREE.Color(0xe9dfcb),
    hemisphere: new THREE.Color(0xfff8e8),
    hemisphereGround: new THREE.Color(0x5b4030),
    key: new THREE.Color(0xffe8c2),
    fill: new THREE.Color(0xd8e3e7),
    rim: new THREE.Color(0xd5a45e),
  };

  const pointer: any = {
    ndc: new THREE.Vector2(3, 3),
    clientX: 0,
    clientY: 0,
  };
  const pageDrag: any = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    progress: 0,
    peakProgress: 0,
    committed: false,
    progressVelocity: 0,
    verticalBias: 0,
    lastProgress: 0,
    lastTime: 0,
    direction: 0,
    kind: null,
  };
  const detailPress: any = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
    allowClick: false,
  };

  const raycaster = new THREE.Raycaster();
  const shelfCameraPosition = new THREE.Vector3();
  const shelfCameraTarget = new THREE.Vector3();
  const inspectPosition = new THREE.Vector3();
  const inspectCameraPosition = new THREE.Vector3();
  const inspectCameraTarget = new THREE.Vector3();
  const transitionCameraTarget = new THREE.Vector3();
  const openingBookPosition = new THREE.Vector3();
  const openingBookQuaternion = new THREE.Quaternion();
  const openingBookScale = new THREE.Vector3();
  const openingMotionPosition = new THREE.Vector3();
  const openingMotionQuaternion = new THREE.Quaternion();
  const restingMotionPosition = new THREE.Vector3();
  const restingMotionQuaternion = new THREE.Quaternion();
  const openingCameraPosition = new THREE.Vector3();
  const openingCameraTarget = new THREE.Vector3();
  const openingShelfPosition = new THREE.Vector3();
  const inspectShelfPosition = new THREE.Vector3(0, -4.2, -3);
  const inspectBookQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.055, -0.14, 0),
  );
  const inspectBookScale = new THREE.Vector3();
  const closingBookPosition = new THREE.Vector3();
  const closingBookStartPosition = new THREE.Vector3();
  const closingBookStartQuaternion = new THREE.Quaternion();
  const closingBookStartScale = new THREE.Vector3();
  const closingBookQuaternion = new THREE.Quaternion();
  const closingBookScale = new THREE.Vector3(1.09, 1.09, 1.09);
  const closingMotionPosition = new THREE.Vector3();
  const closingMotionQuaternion = new THREE.Quaternion();
  const closingCameraPosition = new THREE.Vector3();
  const closingCameraTarget = new THREE.Vector3();
  const closingShelfPosition = new THREE.Vector3();
  const shelfRestPosition = new THREE.Vector3();
  const scratchBox = new THREE.Box3();
  const scratchVector = new THREE.Vector3();
  const shelfBoardTop = 0.47;
  const spacing = 1.5;
  const PAGINATED_LEAF_COUNT = 4;
  const SPREAD_COUNT = PAGINATED_LEAF_COUNT + 1;
  const FLEXIBLE_PAGE_SEGMENTS = 18;
  const FLEXIBLE_PAGE_VERTICAL_SEGMENTS = 8;
  const PAGE_TURN_COMMIT_PROGRESS = 0.18;
  const COVER_OPEN_COMMIT_PROGRESS = 0.16;
  const COVER_CLOSE_COMMIT_PROGRESS = 0.2;
  const DETAIL_TRANSITION_DURATION = 0.92;
  const SHELF_TRANSITION_DURATION = 0.92;
  let openingViewOffsetX = 0;
  let closingViewOffsetX = 0;

  const shared: any = {
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    page: new THREE.MeshPhysicalMaterial({
      color: 0xe7dfcf,
      roughness: 0.95,
      metalness: 0,
      sheen: 0.025,
      sheenRoughness: 1,
    }),
    pageSheet: new THREE.MeshPhysicalMaterial({
      color: 0xeee6d7,
      roughness: 0.955,
      metalness: 0,
      sheen: 0.02,
      sheenRoughness: 1,
      side: THREE.DoubleSide,
    }),
    headband: new THREE.MeshPhysicalMaterial({
      color: 0xc6a66d,
      roughness: 0.58,
      metalness: 0.16,
      sheen: 0.14,
      sheenRoughness: 0.76,
    }),
    walnut: new THREE.MeshStandardMaterial({
      color: 0x4a2b1d,
      roughness: 0.58,
      metalness: 0,
    }),
    walnutDark: new THREE.MeshStandardMaterial({
      color: 0x2a170f,
      roughness: 0.7,
      metalness: 0,
    }),
  };

  function createFadeMaterial(baseMaterial?: any) {
    const material = baseMaterial.clone();
    material.transparent = true;
    material.opacity = 1;
    return material;
  }

  function hashSeed(value?: any) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed?: any) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawMotif(ctx?: any, book?: any, width?: any, height?: any) {
    const foil = book.foil;
    ctx.save();
    ctx.strokeStyle = foil;
    ctx.fillStyle = foil;
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.globalAlpha = 0.88;
    const centerX = width * 0.5;
    const centerY = height * 0.38;
    const size = Math.min(width, height) * 0.22;

    if (book.motifKey === "brackets") {
      for (let layer = 0; layer < 3; layer += 1) {
        const inset = layer * size * 0.22;
        const left = centerX - size + inset;
        const right = centerX + size - inset;
        const top = centerY - size * 0.72 + inset;
        const bottom = centerY + size * 0.72 - inset;
        ctx.beginPath();
        ctx.moveTo(left + size * 0.25, top);
        ctx.lineTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(left + size * 0.25, bottom);
        ctx.moveTo(right - size * 0.25, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right - size * 0.25, bottom);
        ctx.stroke();
      }
      ctx.fillRect(centerX - 3, centerY - 3, 6, 6);
    } else if (book.motifKey === "paths") {
      ctx.beginPath();
      ctx.moveTo(centerX - size, centerY + size * 0.35);
      ctx.bezierCurveTo(
        centerX - size * 0.2,
        centerY - size,
        centerX + size * 0.1,
        centerY + size,
        centerX + size,
        centerY - size * 0.25,
      );
      ctx.stroke();
      ctx.globalAlpha = 0.52;
      ctx.beginPath();
      ctx.moveTo(centerX - size, centerY - size * 0.45);
      ctx.bezierCurveTo(
        centerX - size * 0.25,
        centerY + size,
        centerX + size * 0.3,
        centerY - size,
        centerX + size,
        centerY + size * 0.45,
      );
      ctx.stroke();
      for (let point = -1; point <= 1; point += 1) {
        ctx.beginPath();
        ctx.arc(centerX + point * size, centerY - point * size * 0.25, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (book.motifKey === "caret") {
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.9, centerY + size * 0.6);
      ctx.lineTo(centerX, centerY - size * 0.65);
      ctx.lineTo(centerX + size * 0.9, centerY + size * 0.6);
      ctx.stroke();
      ctx.globalAlpha = 0.38;
      for (let line = -2; line <= 2; line += 1) {
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY + line * size * 0.28);
        ctx.lineTo(centerX + size, centerY + line * size * 0.28);
        ctx.stroke();
      }
    } else if (book.motifKey === "orbits") {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, size, size * 0.42, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.58;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, size * 0.72, size, 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(centerX + size * 0.64, centerY - size * 0.34, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(centerX - 6, centerY - 6, 12, 12);
    } else if (book.motifKey === "modules") {
      const moduleSize = size * 0.54;
      const positions: any = [
        [-0.55, -0.5, "circle"],
        [0.25, -0.5, "rect"],
        [-0.55, 0.3, "rect"],
        [0.25, 0.3, "circle"],
      ];
      positions.forEach(([x, y, shape]: any, index?: any) => {
        ctx.globalAlpha = 0.45 + index * 0.12;
        if (shape === "circle") {
          ctx.beginPath();
          ctx.arc(centerX + x * size, centerY + y * size, moduleSize * 0.48, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(
            centerX + x * size - moduleSize * 0.5,
            centerY + y * size - moduleSize * 0.5,
            moduleSize,
            moduleSize,
          );
        }
      });
    } else if (book.motifKey === "frames") {
      for (let layer = 0; layer < 4; layer += 1) {
        ctx.globalAlpha = 0.9 - layer * 0.17;
        const offset = layer * size * 0.18;
        ctx.strokeRect(
          centerX - size + offset,
          centerY - size * 0.7 + offset,
          size * 2 - offset * 2,
          size * 1.4 - offset * 2,
        );
      }
      ctx.beginPath();
      ctx.moveTo(centerX - size, centerY - size * 0.7);
      ctx.lineTo(centerX + size, centerY + size * 0.7);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.78, 0.15, Math.PI * 1.82);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX - size * 0.72, centerY + size * 0.88);
      ctx.lineTo(centerX, centerY - size * 0.92);
      ctx.lineTo(centerX + size * 0.72, centerY + size * 0.88);
      ctx.stroke();
      ctx.globalAlpha = 0.48;
      ctx.beginPath();
      ctx.moveTo(centerX - size, centerY);
      ctx.lineTo(centerX + size, centerY);
      ctx.stroke();
    }
    ctx.restore();
  }

  let sharedPaperFaceTexture: any = null;
  let sharedPageEdgeTextures: any = null;
  let sharedContactShadowTexture: any = null;

  function configureCanvasTexture(texture?: any, { color = true, anisotropy = 16 } = {}) {
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(anisotropy, renderer.capabilities.getMaxAnisotropy());
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  function makeCoverTexture(book?: any) {
    const canvasTexture = document.createElement("canvas");
    canvasTexture.width = 768;
    canvasTexture.height = 1152;
    const ctx = canvasTexture.getContext("2d") as CanvasRenderingContext2D;

    if (coverAtlasReady) {
      const [sourceX, sourceY, sourceWidth, sourceHeight] = COVER_CROPS[BOOKS.indexOf(book)];
      ctx.drawImage(
        coverAtlasImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvasTexture.width,
        canvasTexture.height,
      );

      const edgeShade = ctx.createLinearGradient(0, 0, canvasTexture.width, 0);
      edgeShade.addColorStop(0, "rgba(0,0,0,0.16)");
      edgeShade.addColorStop(0.055, "rgba(255,255,255,0.015)");
      edgeShade.addColorStop(0.93, "rgba(255,255,255,0)");
      edgeShade.addColorStop(1, "rgba(0,0,0,0.1)");
      ctx.fillStyle = edgeShade;
      ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

      return configureCanvasTexture(new THREE.CanvasTexture(canvasTexture));
    }

    const random = seededRandom(hashSeed(book.id) + book.seed);

    ctx.fillStyle = book.color;
    ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

    const edge = ctx.createLinearGradient(0, 0, canvasTexture.width, 0);
    edge.addColorStop(0, "rgba(0,0,0,0.24)");
    edge.addColorStop(0.075, "rgba(255,255,255,0.035)");
    edge.addColorStop(0.5, "rgba(255,255,255,0.01)");
    edge.addColorStop(0.94, "rgba(0,0,0,0.06)");
    edge.addColorStop(1, "rgba(0,0,0,0.19)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

    for (let line = 0; line < 1250; line += 1) {
      const x = random() * canvasTexture.width;
      const y = random() * canvasTexture.height;
      const length = 4 + random() * 22;
      ctx.strokeStyle = random() > 0.5 ? "rgba(255,255,255,0.024)" : "rgba(0,0,0,0.025)";
      ctx.lineWidth = 0.6 + random() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y + (random() - 0.5) * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = book.foil;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, canvasTexture.width - 84, canvasTexture.height - 84);
    ctx.strokeRect(55, 55, canvasTexture.width - 110, canvasTexture.height - 110);
    ctx.globalAlpha = 1;

    // Title, volume and discipline come from the foil layer drawn over the cover.
    drawMotif(ctx, book, canvasTexture.width, canvasTexture.height);

    return configureCanvasTexture(new THREE.CanvasTexture(canvasTexture));
  }

  function makeFoilTexture(book?: any) {
    const foilCanvas = document.createElement("canvas");
    foilCanvas.width = 768;
    foilCanvas.height = 1152;
    const ctx = foilCanvas.getContext("2d") as CanvasRenderingContext2D;
    const index = BOOKS.indexOf(book) + 1;

    ctx.clearRect(0, 0, foilCanvas.width, foilCanvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.font = '500 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "2.8px";
    ctx.fillText(`WORKING VOLUMES  /  ${pad(index)}`, 58, 70);
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(58, 86);
    ctx.lineTo(164, 86);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const titleSize = book.title.length > 10 ? 64 : 78;
    ctx.font = `400 ${titleSize}px "Iowan Old Style", Baskerville, Georgia, serif`;
    ctx.fillText(book.title, 58, 1020);
    ctx.font = '500 14px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "2.4px";
    ctx.fillText(book.discipline.toUpperCase(), 60, 1066);

    return configureCanvasTexture(new THREE.CanvasTexture(foilCanvas));
  }

  function makeClothBumpTexture(book?: any) {
    const bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const ctx = bumpCanvas.getContext("2d") as CanvasRenderingContext2D;
    const random = seededRandom(hashSeed(`${book.id}-cloth`) + book.seed);

    ctx.fillStyle = "#7f7f7f";
    ctx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    for (let line = 0; line < 256; line += 2) {
      const value = Math.round(98 + random() * 70);
      ctx.strokeStyle = `rgb(${value},${value},${value})`;
      ctx.globalAlpha = 0.34 + random() * 0.18;
      ctx.lineWidth = 0.65 + random() * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, line + (random() - 0.5));
      ctx.lineTo(256, line + (random() - 0.5));
      ctx.stroke();
    }

    for (let line = 1; line < 256; line += 3) {
      const value = Math.round(105 + random() * 58);
      ctx.strokeStyle = `rgb(${value},${value},${value})`;
      ctx.globalAlpha = 0.25 + random() * 0.14;
      ctx.lineWidth = 0.55 + random() * 0.35;
      ctx.beginPath();
      ctx.moveTo(line + (random() - 0.5), 0);
      ctx.lineTo(line + (random() - 0.5), 256);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(bumpCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 8);
    return configureCanvasTexture(texture, {
      color: false,
      anisotropy: 12,
    });
  }

  function makeClothSurfaceMaps(book?: any) {
    const size = 256;
    const heightField = new Float32Array(size * size);
    const normalCanvas = document.createElement("canvas");
    const roughnessCanvas = document.createElement("canvas");
    normalCanvas.width = roughnessCanvas.width = size;
    normalCanvas.height = roughnessCanvas.height = size;
    const normalContext = normalCanvas.getContext("2d") as CanvasRenderingContext2D;
    const roughnessContext = roughnessCanvas.getContext("2d") as CanvasRenderingContext2D;
    const normalImage = normalContext.createImageData(size, size);
    const roughnessImage = roughnessContext.createImageData(size, size);
    const phase = (book.seed % 19) * 0.23;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const warp = Math.sin((x + phase) * Math.PI * 0.52);
        const weft = Math.sin((y - phase) * Math.PI * 0.41);
        const cross = Math.sin((x + y + phase) * Math.PI * 0.19);
        heightField[y * size + x] = 0.5 + warp * 0.18 + weft * 0.15 + cross * 0.045;
      }
    }

    const sampleHeight = (x?: any, y?: any) => {
      const wrappedX = (x + size) % size;
      const wrappedY = (y + size) % size;
      return heightField[wrappedY * size + wrappedX];
    };

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = y * size + x;
        const pixel = index * 4;
        const dx = (sampleHeight(x + 1, y) - sampleHeight(x - 1, y)) * 1.5;
        const dy = (sampleHeight(x, y + 1) - sampleHeight(x, y - 1)) * 1.5;
        const length = Math.hypot(dx, dy, 1);
        normalImage.data[pixel] = Math.round(((-dx / length) * 0.5 + 0.5) * 255);
        normalImage.data[pixel + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255);
        normalImage.data[pixel + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
        normalImage.data[pixel + 3] = 255;

        const roughness = Math.round(188 + heightField[index] * 56);
        roughnessImage.data[pixel] = roughness;
        roughnessImage.data[pixel + 1] = roughness;
        roughnessImage.data[pixel + 2] = roughness;
        roughnessImage.data[pixel + 3] = 255;
      }
    }

    normalContext.putImageData(normalImage, 0, 0);
    roughnessContext.putImageData(roughnessImage, 0, 0);

    const configureWeaveMap = (canvas?: any, suffix?: any) => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.name = `${book.id}-${suffix}`;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 8);
      return configureCanvasTexture(texture, {
        color: false,
        anisotropy: 12,
      });
    };

    return {
      normal: configureWeaveMap(normalCanvas, "cloth-normal"),
      roughness: configureWeaveMap(roughnessCanvas, "cloth-roughness"),
    };
  }

  function makeEmbossMap(sourceTexture?: any, name?: any) {
    const texture = new THREE.CanvasTexture(sourceTexture.image);
    texture.name = name;
    texture.wrapS = sourceTexture.wrapS;
    texture.wrapT = sourceTexture.wrapT;
    texture.repeat.copy(sourceTexture.repeat);
    texture.offset.copy(sourceTexture.offset);
    texture.center.copy(sourceTexture.center);
    texture.rotation = sourceTexture.rotation;
    return configureCanvasTexture(texture, {
      color: false,
      anisotropy: 16,
    });
  }

  function drawPaperSurface(ctx?: any, width?: any, height?: any, random?: any) {
    ctx.fillStyle = "#e8e1d3";
    ctx.fillRect(0, 0, width, height);

    const paperWash = ctx.createLinearGradient(0, 0, width, height);
    paperWash.addColorStop(0, "rgba(255,255,255,0.22)");
    paperWash.addColorStop(0.42, "rgba(255,255,255,0.035)");
    paperWash.addColorStop(1, "rgba(103,87,64,0.08)");
    ctx.fillStyle = paperWash;
    ctx.fillRect(0, 0, width, height);

    for (let fiber = 0; fiber < 2400; fiber += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = 5 + random() * 34;
      const lightFiber = random() > 0.44;
      ctx.strokeStyle = lightFiber
        ? `rgba(255,255,255,${0.025 + random() * 0.045})`
        : `rgba(92,76,55,${0.018 + random() * 0.035})`;
      ctx.lineWidth = 0.45 + random() * 0.65;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(Math.min(width, x + length), y + (random() - 0.5) * 2.2);
      ctx.stroke();
    }

    for (let fleck = 0; fleck < 1200; fleck += 1) {
      const tone = Math.round(112 + random() * 94);
      ctx.fillStyle = `rgba(${tone},${tone - 5},${tone - 13},${0.016 + random() * 0.025})`;
      const size = 0.5 + random() * 1.1;
      ctx.fillRect(random() * width, random() * height, size, size);
    }
  }

  function makePaperFaceTexture(book?: any, printed: any = false) {
    if (!printed && sharedPaperFaceTexture) return sharedPaperFaceTexture;

    const paperCanvas = document.createElement("canvas");
    paperCanvas.width = 768;
    paperCanvas.height = 1152;
    const ctx = paperCanvas.getContext("2d") as CanvasRenderingContext2D;
    const random = seededRandom(
      printed
        ? hashSeed(`${book.id}-printed-page`) + book.seed
        : hashSeed("working-volumes-paper-stock"),
    );

    drawPaperSurface(ctx, paperCanvas.width, paperCanvas.height, random);

    if (printed) {
      const ink = new THREE.Color(book.palette.ink);
      const red = Math.round(ink.r * 255);
      const green = Math.round(ink.g * 255);
      const blue = Math.round(ink.b * 255);
      ctx.fillStyle = `rgba(${red},${green},${blue},0.2)`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = '500 15px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.letterSpacing = "2px";
      ctx.fillText(book.title.toUpperCase(), 84, 98);
      ctx.fillRect(84, 121, 190, 2);

      for (let column = 0; column < 2; column += 1) {
        const left = 84 + column * 316;
        for (let line = 0; line < 34; line += 1) {
          const y = 184 + line * 23;
          const lastInParagraph = line % 7 === 6;
          const lineWidth = lastInParagraph ? 108 + random() * 86 : 190 + random() * 72;
          ctx.globalAlpha = 0.22 + random() * 0.11;
          ctx.fillRect(left, y, lineWidth, 1.45);
        }
      }

      ctx.globalAlpha = 0.32;
      ctx.font = '400 17px "Iowan Old Style", Baskerville, Georgia, serif';
      ctx.fillText(book.roman, paperCanvas.width - 104, paperCanvas.height - 72);
      ctx.globalAlpha = 1;
    }

    const texture = configureCanvasTexture(new THREE.CanvasTexture(paperCanvas));
    if (!printed) sharedPaperFaceTexture = texture;
    return texture;
  }

  function drawWrappedCanvasText(
    ctx?: any,
    text?: any,
    x?: any,
    y?: any,
    maxCharacters?: any,
    lineHeight?: any,
    maxLines: any = 6,
  ) {
    const words = text.split(/\s+/);
    let line = "";
    let lineIndex = 0;

    words.forEach((word?: any) => {
      if (lineIndex >= maxLines) return;
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxCharacters && line) {
        ctx.fillText(line, x, y + lineIndex * lineHeight);
        line = word;
        lineIndex += 1;
      } else {
        line = candidate;
      }
    });

    if (line && lineIndex < maxLines) {
      ctx.fillText(line, x, y + lineIndex * lineHeight);
    }
  }

  function makeEndpaperTexture(book?: any) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const random = seededRandom(hashSeed(`${book.id}-endpaper`) + book.seed);
    drawPaperSurface(ctx, canvas.width, canvas.height, random);

    ctx.save();
    ctx.fillStyle = book.color;
    ctx.globalAlpha = 0.14;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = book.foil;
    ctx.lineWidth = 1;
    for (let x = 28; x < canvas.width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 24; y < canvas.height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.42;
    drawMotif(ctx, { ...book, foil: book.palette.inkSoft }, canvas.width, canvas.height);
    ctx.restore();

    const texture = configureCanvasTexture(new THREE.CanvasTexture(canvas), {
      anisotropy: 16,
    });
    texture.name = `${book.id}-patterned-endpaper`;
    return texture;
  }

  function makeInteriorPageTextures(book?: any) {
    const pageCount = 8;
    const inkColor = new THREE.Color(book.color).lerp(new THREE.Color(0x211b16), 0.62);
    const ink = `#${inkColor.getHexString()}`;

    return Array.from({ length: pageCount }, (_?: any, pageIndex?: any) => {
      const canvas = document.createElement("canvas");
      const logicalWidth = 512;
      const logicalHeight = 768;
      canvas.width = 384;
      canvas.height = 576;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      ctx.scale(0.75, 0.75);
      const random = seededRandom(hashSeed(`${book.id}-leaf-${pageIndex}`) + book.seed);
      drawPaperSurface(ctx, logicalWidth, logicalHeight, random);
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      ctx.globalAlpha = 0.58;
      ctx.font = '500 10px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.letterSpacing = "1.8px";
      ctx.fillText(`WORKING VOLUMES  /  ${book.roman}`, 48, 48);
      ctx.textAlign = "right";
      ctx.fillText(pad(pageIndex + 1), logicalWidth - 48, 48);
      ctx.textAlign = "left";
      ctx.fillRect(48, 64, logicalWidth - 96, 1);
      ctx.globalAlpha = 1;

      if (pageIndex === 0) {
        ctx.font = '500 12px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "2.3px";
        ctx.fillText(book.discipline.toUpperCase(), 54, 174);
        ctx.font = `400 ${book.title.length > 10 ? 48 : 58}px "Iowan Old Style", Baskerville, Georgia, serif`;
        ctx.letterSpacing = "0px";
        drawWrappedCanvasText(ctx, book.title, 52, 246, 18, 58, 2);
        ctx.globalAlpha = 0.55;
        ctx.font = '400 22px "Iowan Old Style", Baskerville, Georgia, serif';
        drawWrappedCanvasText(ctx, book.note, 54, 462, 36, 30, 4);
      } else if (pageIndex === 1 || pageIndex === 3) {
        const chapterIndex = pageIndex === 1 ? 0 : 1;
        ctx.font = '500 11px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "2px";
        ctx.fillText(`CHAPTER ${pad(chapterIndex + 1)}`, 54, 166);
        ctx.font = '400 49px "Iowan Old Style", Baskerville, Georgia, serif';
        ctx.letterSpacing = "0px";
        drawWrappedCanvasText(ctx, book.chapters[chapterIndex], 52, 244, 18, 54, 3);
        ctx.globalAlpha = 0.52;
        ctx.font = '400 20px "Iowan Old Style", Baskerville, Georgia, serif';
        drawWrappedCanvasText(ctx, chapterIndex === 0 ? book.note : book.deck, 54, 438, 42, 28, 6);
      } else if (pageIndex === 2) {
        ctx.font = '500 11px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "2px";
        ctx.fillText("PLATE 01  /  SYSTEM MOTIF", 54, 146);
        ctx.save();
        ctx.globalAlpha = 0.58;
        drawMotif(ctx, { ...book, foil: ink }, logicalWidth, logicalHeight * 0.92);
        ctx.restore();
        ctx.globalAlpha = 0.48;
        ctx.font = '400 17px "Iowan Old Style", Baskerville, Georgia, serif';
        drawWrappedCanvasText(ctx, book.theme, 54, 650, 44, 24, 3);
      } else if (pageIndex === 4) {
        ctx.font = '500 11px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "2px";
        ctx.fillText(`NOTES  /  ${book.chapters[1].toUpperCase()}`, 54, 138);
        ctx.globalAlpha = 0.44;
        for (let column = 0; column < 2; column += 1) {
          const left = 54 + column * 214;
          for (let line = 0; line < 24; line += 1) {
            const width = line % 7 === 6 ? 72 + random() * 54 : 138 + random() * 44;
            ctx.fillRect(left, 190 + line * 18, width, 1.25);
          }
        }
        ctx.globalAlpha = 0.78;
        ctx.strokeRect(54, 654, 404, 54);
        ctx.font = '500 10px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "1.4px";
        ctx.fillText(book.motif.toUpperCase(), 70, 686);
      } else if (pageIndex === 5) {
        ctx.font = '500 11px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "2px";
        ctx.fillText("CHAPTER 03", 54, 166);
        ctx.font = '400 49px "Iowan Old Style", Baskerville, Georgia, serif';
        ctx.letterSpacing = "0px";
        drawWrappedCanvasText(ctx, book.chapters[2], 52, 244, 18, 54, 3);
        ctx.globalAlpha = 0.52;
        ctx.font = '400 20px "Iowan Old Style", Baskerville, Georgia, serif';
        drawWrappedCanvasText(ctx, book.deck, 54, 438, 42, 28, 6);
      } else if (pageIndex === 6) {
        ctx.font = '500 11px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "2px";
        ctx.fillText("PLATE 02  /  TECHNICAL SYSTEM", 54, 146);
        ctx.save();
        ctx.translate(logicalWidth * 0.5, 380);
        ctx.globalAlpha = 0.55;
        for (let ring = 0; ring < 5; ring += 1) {
          const radius = 38 + ring * 34;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (let spoke = 0; spoke < 8; spoke += 1) {
          const angle = spoke * Math.PI * 0.25;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 36, Math.sin(angle) * 36);
          ctx.lineTo(Math.cos(angle) * 176, Math.sin(angle) * 176);
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 0.48;
        ctx.font = '400 17px "Iowan Old Style", Baskerville, Georgia, serif';
        drawWrappedCanvasText(ctx, book.theme, 54, 650, 44, 24, 3);
      } else {
        ctx.font = '500 11px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "2px";
        ctx.fillText("COLOPHON", 54, 164);
        ctx.font = '400 32px "Iowan Old Style", Baskerville, Georgia, serif';
        ctx.letterSpacing = "0px";
        ctx.fillText(book.title, 54, 230);
        ctx.globalAlpha = 0.58;
        ctx.font = '400 18px "Iowan Old Style", Baskerville, Georgia, serif';
        drawWrappedCanvasText(
          ctx,
          `${book.binding}. ${book.format}. Conceived as an original editorial study for Working Volumes.`,
          54,
          306,
          44,
          28,
          7,
        );
        ctx.globalAlpha = 0.74;
        ctx.font = '500 10px Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "1.8px";
        ctx.fillText(`SPECIMEN ${book.roman} / ${book.seed}  ·  IMAGINED EDITION`, 54, 676);
      }

      ctx.globalAlpha = 0.62;
      ctx.fillRect(48, logicalHeight - 48, logicalWidth - 96, 1);
      ctx.globalAlpha = 1;
      const texture = configureCanvasTexture(new THREE.CanvasTexture(canvas), {
        anisotropy: 16,
      });
      texture.name = `${book.id}-interior-page-${pageIndex + 1}`;
      return texture;
    });
  }

  function makeContactShadowTexture() {
    if (sharedContactShadowTexture) return sharedContactShadowTexture;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const gradient = ctx.createRadialGradient(256, 64, 10, 256, 64, 254);
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.38, "rgba(255,255,255,0.62)");
    gradient.addColorStop(0.72, "rgba(255,255,255,0.18)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sharedContactShadowTexture = configureCanvasTexture(new THREE.CanvasTexture(canvas), {
      color: false,
      anisotropy: 8,
    });
    sharedContactShadowTexture.name = "soft-contact-shadow";
    return sharedContactShadowTexture;
  }

  function makePageEdgeTextures(book?: any) {
    if (sharedPageEdgeTextures) return sharedPageEdgeTextures;

    const makeEdgeTexture = (width?: any, height?: any, suffix?: any) => {
      const edgeCanvas = document.createElement("canvas");
      edgeCanvas.width = width;
      edgeCanvas.height = height;
      const ctx = edgeCanvas.getContext("2d") as CanvasRenderingContext2D;
      const random = seededRandom(hashSeed(`${book.id}-${suffix}`) + book.seed);

      ctx.fillStyle = "#dcd5c7";
      ctx.fillRect(0, 0, width, height);

      const pageStep = suffix === "fore-edge" ? 2 : 1.35;
      for (let y = 0; y < height; y += pageStep) {
        const shade = Math.round(106 + random() * 74);
        const signature = random() > 0.965;
        ctx.strokeStyle = `rgba(${shade},${shade - 3},${shade - 9},${signature ? 0.34 : 0.13 + random() * 0.13})`;
        ctx.lineWidth = signature ? 1.05 : 0.42 + random() * 0.42;
        ctx.beginPath();
        ctx.moveTo(0, y + (random() - 0.5) * 0.5);
        ctx.bezierCurveTo(
          width * 0.3,
          y + (random() - 0.5) * 0.9,
          width * 0.72,
          y + (random() - 0.5) * 0.9,
          width,
          y + (random() - 0.5) * 0.5,
        );
        ctx.stroke();
      }

      const edgeShade = ctx.createLinearGradient(0, 0, width, 0);
      edgeShade.addColorStop(0, "rgba(58,48,35,0.18)");
      edgeShade.addColorStop(0.035, "rgba(255,255,255,0.04)");
      edgeShade.addColorStop(0.86, "rgba(255,255,255,0)");
      edgeShade.addColorStop(1, "rgba(58,48,35,0.12)");
      ctx.fillStyle = edgeShade;
      ctx.fillRect(0, 0, width, height);

      return configureCanvasTexture(new THREE.CanvasTexture(edgeCanvas));
    };

    sharedPageEdgeTextures = {
      fore: makeEdgeTexture(512, 2048, "fore-edge"),
      headTail: makeEdgeTexture(2048, 384, "head-tail-edge"),
    };
    return sharedPageEdgeTextures;
  }

  function createRoundedPlaneGeometry(width?: any, height?: any, radius?: any) {
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const corner = Math.min(radius, halfWidth, halfHeight);
    const shape = new THREE.Shape();

    shape.moveTo(-halfWidth + corner, -halfHeight);
    shape.lineTo(halfWidth - corner, -halfHeight);
    shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
    shape.lineTo(halfWidth, halfHeight - corner);
    shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
    shape.lineTo(-halfWidth + corner, halfHeight);
    shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
    shape.lineTo(-halfWidth, -halfHeight + corner);
    shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);

    const geometry = new THREE.ShapeGeometry(shape, 8);
    const position = geometry.getAttribute("position");
    const uv = new Float32Array(position.count * 2);
    for (let index = 0; index < position.count; index += 1) {
      uv[index * 2] = (position.getX(index) + halfWidth) / width;
      uv[index * 2 + 1] = (position.getY(index) + halfHeight) / height;
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geometry.computeVertexNormals();
    return geometry;
  }

  function createPageBlockGeometry(width?: any, height?: any, depth?: any, radius?: any) {
    const geometry = new RoundedBoxGeometry(width, height, depth, 4, radius);
    const position = geometry.getAttribute("position");
    const halfWidth = width * 0.5;

    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const normalizedX = clamp((x + halfWidth) / width, 0, 1);
      const gutterProgress = clamp(normalizedX / 0.16, 0, 1);
      const gutterEase = gutterProgress * gutterProgress * (3 - 2 * gutterProgress);
      const gutterCompression = (1 - gutterEase) * 0.012;
      const foreEdgeCharacter =
        Math.pow(normalizedX, 8) * Math.sin(position.getY(index) * 31) * 0.00055;
      const adjustedZ =
        Math.sign(z || 1) * Math.max(0, Math.abs(z) - gutterCompression + foreEdgeCharacter);
      position.setZ(index, adjustedZ);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.userData.gutterCompression = 0.012;
    geometry.userData.pageSignatures = 6;
    return geometry;
  }

  function makeSpineTexture(book?: any) {
    const spineCanvas = document.createElement("canvas");
    spineCanvas.width = 384;
    spineCanvas.height = 1536;
    const ctx = spineCanvas.getContext("2d") as CanvasRenderingContext2D;
    const random = seededRandom(hashSeed(`${book.id}-spine-cloth`) + book.seed);
    ctx.fillStyle = book.color;
    ctx.fillRect(0, 0, spineCanvas.width, spineCanvas.height);

    const shade = ctx.createLinearGradient(0, 0, spineCanvas.width, 0);
    shade.addColorStop(0, "rgba(0,0,0,0.2)");
    shade.addColorStop(0.14, "rgba(255,255,255,0.055)");
    shade.addColorStop(0.62, "rgba(255,255,255,0.012)");
    shade.addColorStop(1, "rgba(0,0,0,0.16)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, spineCanvas.width, spineCanvas.height);

    for (let thread = 0; thread < 1900; thread += 1) {
      const x = random() * spineCanvas.width;
      const y = random() * spineCanvas.height;
      const vertical = random() > 0.42;
      ctx.strokeStyle =
        random() > 0.5
          ? `rgba(255,255,255,${0.018 + random() * 0.038})`
          : `rgba(0,0,0,${0.018 + random() * 0.032})`;
      ctx.lineWidth = 0.45 + random() * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        vertical ? x + (random() - 0.5) * 1.2 : x + 8 + random() * 28,
        vertical ? y + 8 + random() * 34 : y + (random() - 0.5) * 1.2,
      );
      ctx.stroke();
    }

    const bottomShade = ctx.createLinearGradient(
      0,
      spineCanvas.height * 0.82,
      0,
      spineCanvas.height,
    );
    bottomShade.addColorStop(0, "rgba(0,0,0,0)");
    bottomShade.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, 0, spineCanvas.width, spineCanvas.height);

    return configureCanvasTexture(new THREE.CanvasTexture(spineCanvas), { anisotropy: 16 });
  }

  function makeSpineFoilTexture(book?: any) {
    const foilCanvas = document.createElement("canvas");
    foilCanvas.width = 384;
    foilCanvas.height = 1536;
    const ctx = foilCanvas.getContext("2d") as CanvasRenderingContext2D;

    ctx.clearRect(0, 0, foilCanvas.width, foilCanvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(34, 38, foilCanvas.width - 68, foilCanvas.height - 76);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '500 24px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "5px";
    ctx.fillText(book.roman, foilCanvas.width * 0.5, 118);

    ctx.save();
    ctx.translate(foilCanvas.width * 0.5, foilCanvas.height * 0.5);
    ctx.rotate(Math.PI / 2);
    ctx.font = `400 ${book.title.length > 10 ? 58 : 68}px "Iowan Old Style", Baskerville, Georgia, serif`;
    ctx.letterSpacing = "0px";
    ctx.fillText(book.title, 0, 0);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(foilCanvas.width * 0.5, foilCanvas.height - 120, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(foilCanvas.width * 0.5 - 24, foilCanvas.height - 120);
    ctx.lineTo(foilCanvas.width * 0.5 + 24, foilCanvas.height - 120);
    ctx.stroke();

    return configureCanvasTexture(new THREE.CanvasTexture(foilCanvas));
  }

  function makeBackCoverTexture(book?: any) {
    const backCanvas = document.createElement("canvas");
    backCanvas.width = 768;
    backCanvas.height = 1152;
    const ctx = backCanvas.getContext("2d") as CanvasRenderingContext2D;
    const random = seededRandom(hashSeed(`${book.id}-back-cloth`) + book.seed);

    ctx.fillStyle = book.color;
    ctx.fillRect(0, 0, backCanvas.width, backCanvas.height);

    const edgeShade = ctx.createLinearGradient(0, 0, backCanvas.width, 0);
    edgeShade.addColorStop(0, "rgba(0,0,0,0.15)");
    edgeShade.addColorStop(0.05, "rgba(255,255,255,0.028)");
    edgeShade.addColorStop(0.84, "rgba(255,255,255,0)");
    edgeShade.addColorStop(1, "rgba(0,0,0,0.11)");
    ctx.fillStyle = edgeShade;
    ctx.fillRect(0, 0, backCanvas.width, backCanvas.height);

    for (let thread = 0; thread < 2600; thread += 1) {
      const x = random() * backCanvas.width;
      const y = random() * backCanvas.height;
      const length = 5 + random() * 30;
      ctx.strokeStyle =
        random() > 0.5
          ? `rgba(255,255,255,${0.018 + random() * 0.03})`
          : `rgba(0,0,0,${0.016 + random() * 0.028})`;
      ctx.lineWidth = 0.45 + random() * 0.65;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y + (random() - 0.5) * 1.5);
      ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(
      backCanvas.width * 0.62,
      backCanvas.height * 0.38,
      20,
      backCanvas.width * 0.62,
      backCanvas.height * 0.38,
      backCanvas.width * 0.75,
    );
    vignette.addColorStop(0, "rgba(255,255,255,0.03)");
    vignette.addColorStop(1, "rgba(0,0,0,0.09)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, backCanvas.width, backCanvas.height);

    return configureCanvasTexture(new THREE.CanvasTexture(backCanvas));
  }

  function makeBackFoilTexture(book?: any) {
    const foilCanvas = document.createElement("canvas");
    foilCanvas.width = 768;
    foilCanvas.height = 1152;
    const ctx = foilCanvas.getContext("2d") as CanvasRenderingContext2D;

    ctx.clearRect(0, 0, foilCanvas.width, foilCanvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.font = '500 16px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "3px";
    ctx.fillText(`WORKING VOLUMES  /  ${book.roman}`, 68, 82);
    ctx.globalAlpha = 0.72;
    ctx.fillRect(68, 108, 176, 2);
    ctx.globalAlpha = 1;

    ctx.lineWidth = 1.5;
    for (let ring = 0; ring < 5; ring += 1) {
      ctx.globalAlpha = 0.24 - ring * 0.032;
      ctx.beginPath();
      ctx.arc(548, 374, 74 + ring * 38, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(348, 374);
    ctx.lineTo(704, 374);
    ctx.moveTo(548, 174);
    ctx.lineTo(548, 574);
    ctx.stroke();

    ctx.font = `400 ${book.title.length > 10 ? 52 : 62}px "Iowan Old Style", Baskerville, Georgia, serif`;
    ctx.letterSpacing = "0px";
    ctx.fillText(book.title, 68, 956);
    ctx.font = '500 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "2.6px";
    ctx.fillText(book.discipline.toUpperCase(), 70, 1004);
    ctx.globalAlpha = 0.68;
    ctx.fillRect(68, 1040, 632, 1.5);
    ctx.globalAlpha = 1;
    ctx.textAlign = "right";
    ctx.fillText("AN IMAGINED EDITION", 700, 1080);

    return configureCanvasTexture(new THREE.CanvasTexture(foilCanvas));
  }

  function createMesh(
    geometry?: any,
    material?: any,
    name?: any,
    cast: any = true,
    receive: any = true,
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    return mesh;
  }

  function addTurnIns(
    pivot?: any,
    book?: any,
    side?: any,
    width?: any,
    height?: any,
    insideZ?: any,
    material?: any,
  ) {
    const stripDepth = 0.002;
    const border = 0.018;
    const longWidth = width - border * 0.7;
    const longHeight = height - border * 2.2;
    const definitions: any = [
      ["head", width * 0.5, height * 0.5 - border * 0.56, longWidth, border, stripDepth],
      ["tail", width * 0.5, -height * 0.5 + border * 0.56, longWidth, border, stripDepth],
      ["spine", border * 0.56, 0, border, longHeight, stripDepth],
      ["fore", width - border * 0.56, 0, border, longHeight, stripDepth],
    ];

    definitions.forEach(([edge, x, y, stripWidth, stripHeight, depth]: any) => {
      const strip = createMesh(
        shared.box,
        material,
        `${book.id}-${side}-turn-in-${edge}`,
        false,
        true,
      );
      strip.scale.set(stripWidth, stripHeight, depth);
      strip.position.set(x, y, insideZ);
      pivot.add(strip);
    });
  }

  function createBookRig(book?: any, index?: any) {
    const root = new THREE.Group();
    root.name = `book-${book.id}`;
    root.userData.index = index;

    const motion = new THREE.Group();
    motion.name = `${book.id}-motion`;
    root.add(motion);

    const width = book.width;
    const height = book.height;
    const depth = book.depth;
    const board = 0.032;
    const coverRadius = 0.0045;
    const pageRadius = 0.0025;
    const spineRadius = 0.0015;
    const spineBoardThickness = 0.014;
    const spineWidth = 0.082;
    const pageWidth = width - 0.074;
    const pageHeight = height - 0.068;
    const pageDepth = depth - 0.026;

    const coverTexture = makeCoverTexture(book);
    const foilTexture = makeFoilTexture(book);
    const clothBumpTexture = makeClothBumpTexture(book);
    const clothSurfaceMaps = makeClothSurfaceMaps(book);
    const paperFaceTexture = makePaperFaceTexture(book);
    const interiorPageTextures = makeInteriorPageTextures(book);
    const endpaperTexture = makeEndpaperTexture(book);
    const pageEdgeTextures = makePageEdgeTextures(book);
    const spineTexture = makeSpineTexture(book);
    const spineFoilTexture = makeSpineFoilTexture(book);
    const backCoverTexture = makeBackCoverTexture(book);
    const backFoilTexture = makeBackFoilTexture(book);
    const foilEmbossTexture = makeEmbossMap(foilTexture, `${book.id}-front-foil-emboss`);
    const spineEmbossTexture = makeEmbossMap(spineFoilTexture, `${book.id}-spine-foil-emboss`);
    const backEmbossTexture = makeEmbossMap(backFoilTexture, `${book.id}-back-foil-emboss`);
    const cloth = new THREE.MeshPhysicalMaterial({
      color: book.color,
      normalMap: clothSurfaceMaps.normal,
      normalScale: new THREE.Vector2(0.34, 0.34),
      roughnessMap: clothSurfaceMaps.roughness,
      roughness: 0.98,
      metalness: 0.02,
      bumpMap: clothBumpTexture,
      bumpScale: 0.0045,
      sheen: 0.34,
      sheenRoughness: 0.76,
      sheenColor: new THREE.Color(book.foil),
      transparent: true,
    });
    const coverArt = new THREE.MeshPhysicalMaterial({
      map: coverTexture,
      normalMap: clothSurfaceMaps.normal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughnessMap: clothSurfaceMaps.roughness,
      bumpMap: clothBumpTexture,
      bumpScale: 0.0035,
      roughness: 0.92,
      metalness: 0.035,
      clearcoat: 0.06,
      clearcoatRoughness: 0.72,
      sheen: 0.26,
      sheenRoughness: 0.78,
      transparent: true,
    });
    const foilArt = new THREE.MeshPhysicalMaterial({
      color: book.foil,
      map: foilTexture,
      alphaMap: foilTexture,
      bumpMap: foilEmbossTexture,
      bumpScale: 0.016,
      roughness: book.id === "cursor" ? 0.22 : 0.2,
      metalness: book.id === "cursor" ? 0.34 : 0.94,
      clearcoat: 0.18,
      clearcoatRoughness: 0.12,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const spineArt = new THREE.MeshPhysicalMaterial({
      map: spineTexture,
      normalMap: clothSurfaceMaps.normal,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughnessMap: clothSurfaceMaps.roughness,
      bumpMap: clothBumpTexture,
      bumpScale: 0.004,
      roughness: 0.95,
      metalness: 0.025,
      sheen: 0.27,
      sheenRoughness: 0.78,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const spineFoilArt = new THREE.MeshPhysicalMaterial({
      color: book.foil,
      map: spineFoilTexture,
      alphaMap: spineFoilTexture,
      bumpMap: spineEmbossTexture,
      bumpScale: 0.017,
      roughness: 0.19,
      metalness: 0.92,
      clearcoat: 0.16,
      clearcoatRoughness: 0.13,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide,
    });
    const backArt = new THREE.MeshPhysicalMaterial({
      map: backCoverTexture,
      normalMap: clothSurfaceMaps.normal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughnessMap: clothSurfaceMaps.roughness,
      bumpMap: clothBumpTexture,
      bumpScale: 0.0035,
      roughness: 0.96,
      metalness: 0.025,
      sheen: 0.25,
      sheenRoughness: 0.8,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const backFoilArt = new THREE.MeshPhysicalMaterial({
      color: book.foil,
      map: backFoilTexture,
      alphaMap: backFoilTexture,
      bumpMap: backEmbossTexture,
      bumpScale: 0.016,
      roughness: 0.21,
      metalness: 0.9,
      clearcoat: 0.14,
      clearcoatRoughness: 0.14,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide,
    });
    const endpaperMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(book.palette.paperPale).lerp(new THREE.Color(0xf2ead8), 0.5),
      map: endpaperTexture,
      bumpMap: paperFaceTexture,
      bumpScale: 0.0018,
      roughness: 0.94,
      metalness: 0,
      sheen: 0.025,
      sheenRoughness: 1,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const foreEdgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: pageEdgeTextures.fore,
      bumpMap: pageEdgeTextures.fore,
      bumpScale: 0.0022,
      roughness: 0.93,
      metalness: 0,
      sheen: 0.018,
      sheenRoughness: 1,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const headTailEdgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: pageEdgeTextures.headTail,
      bumpMap: pageEdgeTextures.headTail,
      bumpScale: 0.0015,
      roughness: 0.94,
      metalness: 0,
      sheen: 0.014,
      sheenRoughness: 1,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const grooveMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(book.color).multiplyScalar(0.42),
      roughness: 0.9,
      metalness: 0,
      bumpMap: clothBumpTexture,
      bumpScale: 0.006,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const pageMaterial = createFadeMaterial(shared.page);
    const headbandMaterial = createFadeMaterial(shared.headband);
    const interiorPageMaterials = interiorPageTextures.map((texture?: any) => {
      const material = createFadeMaterial(shared.pageSheet);
      material.map = texture;
      material.bumpMap = paperFaceTexture;
      material.bumpScale = 0.0012;
      material.roughness = 0.96;
      material.side = THREE.FrontSide;
      material.needsUpdate = true;
      return material;
    });
    const blankPageMaterial = createFadeMaterial(shared.pageSheet);
    blankPageMaterial.map = paperFaceTexture;
    blankPageMaterial.bumpMap = paperFaceTexture;
    blankPageMaterial.bumpScale = 0.0012;
    blankPageMaterial.roughness = 0.96;
    blankPageMaterial.side = THREE.FrontSide;
    blankPageMaterial.needsUpdate = true;
    const signatureMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x8d816f).lerp(new THREE.Color(book.palette.paperPale), 0.34),
      roughness: 0.98,
      metalness: 0,
      transparent: true,
    });
    const ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(book.foil).lerp(new THREE.Color(book.color), 0.28),
      roughness: 0.62,
      metalness: 0.08,
      sheen: 0.36,
      sheenRoughness: 0.68,
      side: THREE.DoubleSide,
      transparent: true,
    });

    pageMaterial.map = paperFaceTexture;
    pageMaterial.bumpMap = paperFaceTexture;
    pageMaterial.bumpScale = 0.0014;
    pageMaterial.roughness = 0.95;
    pageMaterial.needsUpdate = true;

    const coverGeometry = new RoundedBoxGeometry(width, height, board, 2, coverRadius);
    const pageGeometry = createPageBlockGeometry(pageWidth, pageHeight, pageDepth, pageRadius);
    const coverSurfaceGeometry = createRoundedPlaneGeometry(width - 0.007, height - 0.007, 0.0035);
    const endpaperGeometry = createRoundedPlaneGeometry(width - 0.045, height - 0.045, 0.003);

    root.userData.construction = {
      board,
      coverRadius,
      pageRadius,
      spineRadius,
      spineBoardThickness,
      spineProfile: "flat",
      spineFoilLayered: true,
      backSurfaceLayered: true,
      clothPbrMaps: true,
      foilEmbossed: true,
      interiorPageDesigns: interiorPageTextures.length,
      flexiblePageSegments: FLEXIBLE_PAGE_SEGMENTS,
      clothLikePageDeformation: true,
      turnInStrips: 8,
      ribbonBookmark: true,
      pageSignatures: pageGeometry.userData.pageSignatures,
      gutterCompression: pageGeometry.userData.gutterCompression,
      coverArtInset: 0.007,
      coverOverhangX: (width - pageWidth) * 0.5,
      coverOverhangY: (height - pageHeight) * 0.5,
    };

    const pageBlock = createMesh(pageGeometry, pageMaterial, `${book.id}-page-block`);
    pageBlock.position.x = 0.018;
    motion.add(pageBlock);

    const backPivot = new THREE.Group();
    backPivot.name = `${book.id}-back-cover-pivot`;
    backPivot.position.set(-width * 0.5, 0, -depth * 0.5 - board * 0.5);
    const backCover = createMesh(coverGeometry, cloth, `${book.id}-back-cover`);
    backCover.position.x = width * 0.5;
    backPivot.add(backCover);

    const backPlane = createMesh(
      coverSurfaceGeometry,
      backArt,
      `${book.id}-back-cover-art`,
      false,
      false,
    );
    backPlane.position.set(width * 0.5, 0, -board * 0.55);
    backPlane.rotation.y = Math.PI;
    backPivot.add(backPlane);

    const backFoilPlane = createMesh(
      coverSurfaceGeometry,
      backFoilArt,
      `${book.id}-back-foil-art`,
      false,
      false,
    );
    backFoilPlane.position.set(width * 0.5, 0, -board * 0.605);
    backFoilPlane.rotation.y = Math.PI;
    backPivot.add(backFoilPlane);

    const backEndpaper = createMesh(
      endpaperGeometry,
      endpaperMaterial,
      `${book.id}-back-endpaper`,
      false,
      true,
    );
    backEndpaper.position.set(width * 0.5, 0, board * 0.515);
    backPivot.add(backEndpaper);
    addTurnIns(backPivot, book, "back", width, height, board * 0.53, cloth);

    const backGroove = createMesh(
      shared.plane,
      grooveMaterial,
      `${book.id}-back-hinge-groove`,
      false,
      false,
    );
    backGroove.scale.set(0.012, height * 0.94, 1);
    backGroove.position.set(0.038, 0, -board * 0.535);
    backGroove.rotation.y = Math.PI;
    backPivot.add(backGroove);
    motion.add(backPivot);

    const frontPivot = new THREE.Group();
    frontPivot.name = `${book.id}-front-cover-pivot`;
    frontPivot.position.set(-width * 0.5, 0, depth * 0.5 + board * 0.5);
    const frontCover = createMesh(coverGeometry, cloth, `${book.id}-front-cover`);
    frontCover.position.x = width * 0.5;
    frontPivot.add(frontCover);

    const coverPlane = createMesh(
      coverSurfaceGeometry,
      coverArt,
      `${book.id}-cover-art`,
      false,
      false,
    );
    coverPlane.position.set(width * 0.5, 0, board * 0.55);
    frontPivot.add(coverPlane);

    const foilPlane = createMesh(
      coverSurfaceGeometry,
      foilArt,
      `${book.id}-foil-art`,
      false,
      false,
    );
    foilPlane.position.set(width * 0.5, 0, board * 0.605);
    frontPivot.add(foilPlane);

    const frontEndpaper = createMesh(
      endpaperGeometry,
      endpaperMaterial,
      `${book.id}-front-endpaper`,
      false,
      true,
    );
    frontEndpaper.position.set(width * 0.5, 0, -board * 0.515);
    frontEndpaper.rotation.y = Math.PI;
    frontPivot.add(frontEndpaper);
    addTurnIns(frontPivot, book, "front", width, height, -board * 0.53, cloth);

    const frontGroove = createMesh(
      shared.plane,
      grooveMaterial,
      `${book.id}-front-hinge-groove`,
      false,
      false,
    );
    frontGroove.scale.set(0.012, height * 0.94, 1);
    frontGroove.position.set(0.038, 0, board * 0.655);
    frontPivot.add(frontGroove);
    motion.add(frontPivot);

    const pagePivots: any = [];
    const pageSurfaces: any = [];
    for (let pageIndex = 0; pageIndex < 6; pageIndex += 1) {
      const leafOrder = 5 - pageIndex;
      const frontPageMaterial =
        leafOrder < 4 ? interiorPageMaterials[leafOrder * 2] : blankPageMaterial;
      const backPageMaterial =
        leafOrder < 4 ? interiorPageMaterials[leafOrder * 2 + 1] : blankPageMaterial;
      const pagePivot = new THREE.Group();
      pagePivot.name = `${book.id}-page-${pageIndex}`;
      pagePivot.position.set(
        -width * 0.5 + spineWidth * 0.65,
        0,
        pageDepth * 0.5 + 0.0015 + pageIndex * 0.0015,
      );
      pagePivot.userData.restZ = pagePivot.position.z;
      pagePivot.userData.turnedZ = depth * 0.5 + board + 0.004 + leafOrder * 0.0015;
      const frontPageGeometry = new THREE.PlaneGeometry(
        1,
        1,
        FLEXIBLE_PAGE_SEGMENTS,
        FLEXIBLE_PAGE_VERTICAL_SEGMENTS,
      );
      const backPageGeometry = new THREE.PlaneGeometry(
        1,
        1,
        FLEXIBLE_PAGE_SEGMENTS,
        FLEXIBLE_PAGE_VERTICAL_SEGMENTS,
      );
      const visiblePageWidth = pageWidth - spineWidth * 0.42;
      const frontPage = createMesh(
        frontPageGeometry,
        frontPageMaterial,
        `${book.id}-page-sheet-${pageIndex}-front`,
        false,
        true,
      );
      frontPage.scale.set(visiblePageWidth, pageHeight - 0.014, 1);
      frontPage.position.set(visiblePageWidth * 0.5, 0, 0.00022);
      pagePivot.add(frontPage);
      pageSurfaces.push(frontPage);

      const backPage = createMesh(
        backPageGeometry,
        backPageMaterial,
        `${book.id}-page-sheet-${pageIndex}-back`,
        false,
        true,
      );
      backPage.scale.set(visiblePageWidth, pageHeight - 0.014, 1);
      backPage.position.set(visiblePageWidth * 0.5, 0, -0.00022);
      backPage.rotation.y = Math.PI;
      pagePivot.add(backPage);
      pageSurfaces.push(backPage);
      pagePivot.userData.flex = {
        curve: 0,
        curveVelocity: 0,
        twist: 0,
        twistVelocity: 0,
        surfaces: [
          {
            geometry: frontPageGeometry,
            position: frontPageGeometry.attributes.position,
            base: Float32Array.from(frontPageGeometry.attributes.position.array),
            direction: 1,
          },
          {
            geometry: backPageGeometry,
            position: backPageGeometry.attributes.position,
            base: Float32Array.from(backPageGeometry.attributes.position.array),
            direction: -1,
          },
        ],
      };
      motion.add(pagePivot);
      pagePivots.push(pagePivot);
    }

    const spineGeometry = new RoundedBoxGeometry(
      spineBoardThickness,
      height - 0.012,
      depth + board * 1.88,
      1,
      spineRadius,
    );
    const spine = createMesh(spineGeometry, spineArt, `${book.id}-flat-spine`);
    spine.position.x = -width * 0.5 - spineBoardThickness * 0.35;
    spine.userData.profile = "flat";
    motion.add(spine);

    const spineFoil = createMesh(shared.plane, spineFoilArt, `${book.id}-spine-foil`, false, false);
    spineFoil.scale.set(depth + board * 1.82, height - 0.018, 1);
    spineFoil.rotation.y = -Math.PI * 0.5;
    spineFoil.position.set(spine.position.x - spineBoardThickness * 0.505, 0, 0);
    motion.add(spineFoil);

    const spineLining = createMesh(
      new RoundedBoxGeometry(
        spineWidth * 0.68,
        height - 0.056,
        Math.max(0.045, pageDepth - 0.008),
        1,
        0.0015,
      ),
      endpaperMaterial,
      `${book.id}-spine-lining`,
    );
    spineLining.position.set(-width * 0.5 + spineWidth * 0.38, 0, 0);
    motion.add(spineLining);

    [-1, 1].forEach((direction?: any) => {
      const headbandGeometry = new THREE.CylinderGeometry(
        0.012,
        0.012,
        pageDepth * 0.88,
        12,
        1,
        false,
      );
      const headband = createMesh(
        headbandGeometry,
        headbandMaterial,
        `${book.id}-headband-${direction}`,
      );
      headband.rotation.x = Math.PI * 0.5;
      headband.position.set(-pageWidth * 0.5 + 0.046, direction * (pageHeight * 0.5 - 0.004), 0);
      motion.add(headband);
    });

    const ribbonGeometry = createRoundedPlaneGeometry(0.034, pageHeight * 0.76, 0.002);
    const ribbon = createMesh(
      ribbonGeometry,
      ribbonMaterial,
      `${book.id}-ribbon-bookmark`,
      false,
      true,
    );
    ribbon.position.set(
      -pageWidth * 0.5 + 0.09 + (book.seed % 3) * 0.018,
      -pageHeight * 0.17,
      pageDepth * 0.5 + 0.003,
    );
    ribbon.rotation.z = (book.seed % 2 ? -1 : 1) * 0.014;
    motion.add(ribbon);

    for (let signatureIndex = 0; signatureIndex < 6; signatureIndex += 1) {
      const signature = createMesh(
        shared.box,
        signatureMaterial,
        `${book.id}-page-signature-${signatureIndex + 1}`,
        false,
        true,
      );
      signature.scale.set(0.0035, 0.00135, pageDepth * 0.91);
      signature.position.set(
        0.018 + pageWidth * 0.5 + 0.001,
        -pageHeight * 0.5 + ((signatureIndex + 1) / 7) * pageHeight,
        0,
      );
      motion.add(signature);
    }

    const foreEdge = createMesh(
      shared.plane,
      foreEdgeMaterial,
      `${book.id}-fore-edge`,
      false,
      true,
    );
    foreEdge.scale.set(pageDepth * 0.94, pageHeight - 0.028, 1);
    foreEdge.rotation.y = Math.PI * 0.5;
    foreEdge.position.set(0.018 + pageWidth * 0.5 + 0.002, 0, 0);
    motion.add(foreEdge);

    [-1, 1].forEach((direction?: any) => {
      const edge = createMesh(
        shared.plane,
        headTailEdgeMaterial,
        `${book.id}-${direction > 0 ? "head" : "tail"}-edge`,
        false,
        true,
      );
      edge.scale.set(pageWidth - 0.035, pageDepth * 0.94, 1);
      edge.rotation.x = direction > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      edge.position.set(0.018, direction * (pageHeight * 0.5 + 0.002), 0);
      motion.add(edge);
    });

    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hit = createMesh(shared.box, hitMaterial, `${book.id}-hit-target`, false, false);
    hit.scale.set(width * 1.34, height * 1.2, Math.max(depth * 4, 1));
    hit.position.set(-spineWidth * 0.18, 0, 0.12);
    hit.userData.index = index;
    motion.add(hit);
    hitTargets.push(hit);

    const contactShadowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(book.palette.shelfDark),
      alphaMap: makeContactShadowTexture(),
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const contactShadow = createMesh(
      shared.plane,
      contactShadowMaterial,
      `${book.id}-contact-shadow`,
      false,
      false,
    );
    contactShadow.scale.set(width * 1.22, depth * 2.05, 1);
    contactShadow.rotation.x = -Math.PI * 0.5;
    contactShadow.position.set(0, -height * 0.5 - 0.022, 0.025);
    root.add(contactShadow);

    return {
      data: book,
      root,
      motion,
      frontPivot,
      frontCover,
      pageBlock,
      pagePivots,
      pageSurfaces,
      pageGestureSurfaces: [...pageSurfaces, pageBlock],
      hit,
      coverTexture,
      foilTexture,
      clothBumpTexture,
      clothSurfaceMaps,
      paperFaceTexture,
      interiorPageTextures,
      endpaperTexture,
      pageEdgeTextures,
      spineTexture,
      spineFoilTexture,
      backCoverTexture,
      backFoilTexture,
      foilEmbossTexture,
      spineEmbossTexture,
      backEmbossTexture,
      contactShadow,
      opacity: 1,
      lastOffset: null,
      fadeMaterials: [
        cloth,
        coverArt,
        foilArt,
        spineArt,
        spineFoilArt,
        backArt,
        backFoilArt,
        endpaperMaterial,
        foreEdgeMaterial,
        headTailEdgeMaterial,
        grooveMaterial,
        pageMaterial,
        ...interiorPageMaterials,
        blankPageMaterial,
        headbandMaterial,
        signatureMaterial,
        ribbonMaterial,
      ],
      materials: [
        cloth,
        coverArt,
        foilArt,
        spineArt,
        spineFoilArt,
        backArt,
        backFoilArt,
        endpaperMaterial,
        foreEdgeMaterial,
        headTailEdgeMaterial,
        grooveMaterial,
        pageMaterial,
        ...interiorPageMaterials,
        blankPageMaterial,
        headbandMaterial,
        signatureMaterial,
        ribbonMaterial,
        contactShadowMaterial,
        hitMaterial,
      ],
      base: {
        width,
        height,
        depth,
      },
    };
  }

  function configureResponsiveTargets() {
    const narrow = viewWidth < 820;
    shelfCameraPosition.set(0, narrow ? 2.02 : 1.92, narrow ? 8.7 : 8.1);
    shelfCameraTarget.set(0, narrow ? 1.57 : 1.55, 0);
    inspectPosition.set(narrow ? 0 : -2.25, narrow ? 2.3 : 1.56, narrow ? 0.15 : 0);
    inspectCameraPosition.set(narrow ? 0 : -0.52, narrow ? 2.46 : 1.78, narrow ? 5.7 : 5.25);
    inspectCameraTarget.copy(inspectPosition);

    if (narrow) {
      detailViewOffsetX = 0;
      detailSafeWidth = viewWidth;
      return;
    }

    const panelBounds = detailPanel.getBoundingClientRect();
    if (panelBounds.width <= 0 && panelBounds.height <= 0) {
      detailViewOffsetX = 0;
      detailSafeWidth = viewWidth;
      return;
    }

    const panelLeft = panelBounds.left > 0 ? panelBounds.left : viewWidth * 0.64;
    const gutter = clamp(viewWidth * 0.035, 32, 56);
    detailSafeWidth = Math.max(viewWidth * 0.42, panelLeft - gutter);
    const wideLayoutProgress = clamp((viewWidth - 820) / 620, 0, 1);
    const bookCenterRatio = THREE.MathUtils.lerp(0.55, 0.615, wideLayoutProgress);
    const desiredBookCenter = detailSafeWidth * bookCenterRatio;
    detailViewOffsetX = Math.max(0, viewWidth * 0.5 - desiredBookCenter);
  }

  function getInspectScale() {
    if (!activeBook || viewWidth < 820) return 0.82;
    const distance = Math.abs(inspectCameraPosition.z - inspectPosition.z);
    const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const pixelsPerWorld = viewHeight / Math.max(worldHeight, 0.001);
    const estimatedBookWidth = activeBook.base.width * pixelsPerWorld * 1.16;
    const scaleForSafeWidth = (detailSafeWidth * 0.72) / Math.max(estimatedBookWidth, 1);
    return clamp(scaleForSafeWidth, 0.9, 1.32);
  }

  function applyDetailViewOffset() {
    if (Math.abs(currentViewOffsetX) < 0.5) {
      camera.clearViewOffset();
      return;
    }
    camera.setViewOffset(viewWidth, viewHeight, currentViewOffsetX, 0, viewWidth, viewHeight);
  }

  function createWoodTexture(repeatX?: any, repeatY?: any, rotation: any = 0) {
    if (!woodTextureReady) return null;
    const texture = new THREE.Texture(woodTextureImage);
    texture.name = "editorial-walnut";
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.center.set(0.5, 0.5);
    texture.rotation = rotation;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }

  function applyWoodTexture() {
    if (!woodTextureReady || !renderer) return;

    const woodMap = createWoodTexture(7, 1.65, Math.PI * 0.5);
    const darkWoodMap = woodMap?.clone() || null;

    if (darkWoodMap) {
      darkWoodMap.name = "editorial-walnut-dark";
      darkWoodMap.needsUpdate = true;
    }

    shared.walnut.map = woodMap;
    shared.walnut.needsUpdate = true;
    shared.walnutDark.map = darkWoodMap;
    shared.walnutDark.needsUpdate = true;
    requestFrame();
  }

  function addRoom() {
    const floor = createMesh(
      shared.plane,
      new THREE.MeshStandardMaterial({
        color: 0xd8c8aa,
        roughness: 0.92,
        metalness: 0,
      }),
      "paper-floor",
      false,
      true,
    );
    floor.scale.set(30, 20, 1);
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = -0.02;
    scene.add(floor);

    const back = createMesh(
      shared.plane,
      new THREE.MeshStandardMaterial({
        color: 0xe9dfcb,
        roughness: 1,
        metalness: 0,
      }),
      "paper-backdrop",
      false,
      true,
    );
    back.scale.set(28, 14, 1);
    back.position.set(0, 5.5, -3.3);
    scene.add(back);

    const shelf = createMesh(shared.box, shared.walnut, "walnut-shelf");
    shelf.scale.set(17, 0.28, 1.08);
    shelf.position.set(0, 0.33, -0.03);
    shelfStage.add(shelf);

    const shelfLip = createMesh(shared.box, shared.walnutDark, "walnut-shelf-lip");
    shelfLip.scale.set(17.05, 0.075, 1.14);
    shelfLip.position.set(0, 0.205, 0.02);
    shelfStage.add(shelfLip);

    const backRail = createMesh(shared.box, shared.walnut, "walnut-back-rail");
    backRail.scale.set(17, 0.17, 0.2);
    backRail.position.set(0, 0.68, -0.52);
    shelfStage.add(backRail);

    [-7.65, 7.65].forEach((x?: any, index?: any) => {
      const upright = createMesh(shared.box, shared.walnutDark, `shelf-upright-${index}`);
      upright.scale.set(0.2, 3.8, 0.72);
      upright.position.set(x, 2.05, -0.28);
      shelfStage.add(upright);
    });

    const shadowStrip = createMesh(
      shared.plane,
      new THREE.MeshBasicMaterial({
        color: 0x2f1d13,
        alphaMap: makeContactShadowTexture(),
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
      "shelf-contact-shadow",
      false,
      false,
    );
    shadowStrip.scale.set(16, 0.85, 1);
    shadowStrip.rotation.x = -Math.PI * 0.5;
    shadowStrip.position.set(0, 0.49, 0.06);
    shelfStage.add(shadowStrip);

    roomMaterials.floor = floor.material;
    roomMaterials.wall = back.material;
    roomMaterials.shelf = shared.walnut;
    roomMaterials.shelfDark = shared.walnutDark;
    roomMaterials.shadow = shadowStrip.material;
  }

  function addLights() {
    roomLights.hemisphere = new THREE.HemisphereLight(0xfff8e8, 0x5b4030, 0.56);
    scene.add(roomLights.hemisphere);

    const key = new THREE.DirectionalLight(0xffe8c2, 1.42);
    key.name = "shadow-key";
    key.position.set(-4.6, 7.4, 5.8);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -1.5;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 18;
    key.shadow.bias = -0.00018;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 3.5;
    scene.add(key);
    roomLights.key = key;

    const softKey = new THREE.RectAreaLight(0xffe8c2, 5.4, 4.8, 5.6);
    softKey.name = "cloth-softbox";
    softKey.position.set(-3.2, 5.5, 4.6);
    softKey.lookAt(0, 1.45, 0);
    scene.add(softKey);
    roomLights.softKey = softKey;

    const fill = new THREE.DirectionalLight(0xd8e3e7, 0.3);
    fill.name = "cool-fill";
    fill.position.set(5.5, 3.6, 4.2);
    scene.add(fill);
    roomLights.fill = fill;

    const rim = new THREE.RectAreaLight(0xd5a45e, 3.45, 1.6, 4.8);
    rim.name = "foil-rake";
    rim.position.set(3.8, 3.6, -2.1);
    rim.lookAt(-0.2, 1.5, 0);
    scene.add(rim);
    roomLights.rim = rim;

    const backFill = new THREE.RectAreaLight(0xd8e3e7, 2.7, 3.8, 4.8);
    backFill.name = "back-cover-softbox";
    backFill.position.set(-1.8, 2.9, -4.5);
    backFill.lookAt(-0.1, 1.45, 0);
    scene.add(backFill);
    roomLights.backFill = backFill;

    const spineRake = new THREE.RectAreaLight(0xffe8c2, 1.9, 0.9, 4.6);
    spineRake.name = "spine-rake";
    spineRake.position.set(-4.6, 3.2, 1.1);
    spineRake.lookAt(-0.55, 1.5, 0);
    scene.add(spineRake);
    roomLights.spineRake = spineRake;

    const pageRake = new THREE.RectAreaLight(0xfff7e7, 2.15, 1.15, 3.8);
    pageRake.name = "page-edge-rake";
    pageRake.position.set(4.2, 4.8, 3.1);
    pageRake.lookAt(0.65, 1.55, 0);
    scene.add(pageRake);
    roomLights.pageRake = pageRake;
  }

  function addDust() {
    const dustCount = 110;
    const positions = new Float32Array(dustCount * 3);
    const random = seededRandom(20260728);
    for (let index = 0; index < dustCount; index += 1) {
      positions[index * 3] = (random() - 0.5) * 14;
      positions[index * 3 + 1] = 0.7 + random() * 4.7;
      positions[index * 3 + 2] = -1.7 + random() * 4;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xc3a97b,
      size: 0.014,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const dust = new THREE.Points(geometry, material);
    dust.name = "paper-dust";
    dust.userData.isDust = true;
    scene.add(dust);
  }

  function buildMarkers() {
    BOOKS.forEach((book?: any, index?: any) => {
      const button = document.createElement("button");
      button.className = "marker";
      button.type = "button";
      button.role = "tab";
      button.setAttribute("aria-label", `Select volume ${index + 1}: ${book.title}`);
      button.setAttribute("aria-current", index === 0 ? "true" : "false");
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      button.addEventListener("click", () => selectMarker(index, button));
      markers.append(button);
    });
  }

  function setThemeColorsImmediately() {
    roomMaterials.floor?.color.copy(themeTargets.floor);
    roomMaterials.wall?.color.copy(themeTargets.wall);
    roomMaterials.shelf?.color.copy(themeTargets.shelf);
    roomMaterials.shelfDark?.color.copy(themeTargets.shelfDark);
    roomMaterials.shadow?.color.copy(themeTargets.shadow);
    scene?.fog?.color.copy(themeTargets.fog);
    roomLights.hemisphere?.color.copy(themeTargets.hemisphere);
    roomLights.hemisphere?.groundColor.copy(themeTargets.hemisphereGround);
    roomLights.key?.color.copy(themeTargets.key);
    roomLights.softKey?.color.copy(themeTargets.key);
    roomLights.fill?.color.copy(themeTargets.fill);
    roomLights.rim?.color.copy(themeTargets.rim);
    roomLights.backFill?.color.copy(themeTargets.fill);
    roomLights.spineRake?.color.copy(themeTargets.key);
    roomLights.pageRake?.color.copy(themeTargets.hemisphere);
    themeMoving = false;
  }

  function applyBookTheme(book?: any) {
    const palette = book.palette;
    const rootStyle = experience.style;
    rootStyle.setProperty("--paper", palette.paper);
    rootStyle.setProperty("--paper-deep", palette.paperDeep);
    rootStyle.setProperty("--paper-pale", palette.paperPale);
    rootStyle.setProperty("--ink", palette.ink);
    rootStyle.setProperty("--ink-soft", palette.inkSoft);
    rootStyle.setProperty("--walnut", palette.shelf);
    rootStyle.setProperty("--walnut-deep", palette.shelfDark);
    rootStyle.setProperty("--rule", `color-mix(in srgb, ${palette.ink} 24%, transparent)`);
    rootStyle.setProperty("--accent", book.foil);
    experience.querySelector('meta[name="theme-color"]')?.setAttribute("content", palette.paper);

    themeTargets.floor.set(palette.paperDeep);
    themeTargets.wall.set(palette.wall);
    themeTargets.shelf.set(palette.shelf);
    themeTargets.shelfDark.set(palette.shelfDark);
    themeTargets.shadow.set(palette.shelfDark);
    themeTargets.fog.set(palette.wall);
    themeTargets.hemisphere.set(palette.paperPale);
    themeTargets.hemisphereGround.set(palette.shelf);
    themeTargets.key.set(palette.light);
    themeTargets.fill.set(palette.fill);
    themeTargets.rim.set(book.foil);

    if (!themeInitialized || reducedMotion) {
      themeInitialized = true;
      setThemeColorsImmediately();
    } else {
      themeMoving = true;
      requestFrame();
    }
  }

  function updateTheme(delta?: any) {
    if (!themeMoving) return false;
    const amount = 1 - Math.exp(-delta * 5.5);
    let largestGap = 0;
    const easeColor = (current?: any, target?: any) => {
      if (!current) return;
      const redGap = current.r - target.r;
      const greenGap = current.g - target.g;
      const blueGap = current.b - target.b;
      largestGap = Math.max(largestGap, redGap * redGap + greenGap * greenGap + blueGap * blueGap);
      current.lerp(target, amount);
    };

    easeColor(roomMaterials.floor?.color, themeTargets.floor);
    easeColor(roomMaterials.wall?.color, themeTargets.wall);
    easeColor(roomMaterials.shelf?.color, themeTargets.shelf);
    easeColor(roomMaterials.shelfDark?.color, themeTargets.shelfDark);
    easeColor(roomMaterials.shadow?.color, themeTargets.shadow);
    easeColor(scene?.fog?.color, themeTargets.fog);
    easeColor(roomLights.hemisphere?.color, themeTargets.hemisphere);
    easeColor(roomLights.hemisphere?.groundColor, themeTargets.hemisphereGround);
    easeColor(roomLights.key?.color, themeTargets.key);
    easeColor(roomLights.softKey?.color, themeTargets.key);
    easeColor(roomLights.fill?.color, themeTargets.fill);
    easeColor(roomLights.rim?.color, themeTargets.rim);
    easeColor(roomLights.backFill?.color, themeTargets.fill);
    easeColor(roomLights.spineRake?.color, themeTargets.key);
    easeColor(roomLights.pageRake?.color, themeTargets.hemisphere);

    if (largestGap < 0.0000025) {
      setThemeColorsImmediately();
    }
    return themeMoving;
  }

  function updateSelection(index?: any, announce: any = false) {
    const nextIndex = mod(index, BOOKS.length);
    if (nextIndex === selectedIndex && !announce) return;
    selectedIndex = nextIndex;
    const book = BOOKS[selectedIndex];
    selectionTitle.textContent = book.title;
    selectionNote.textContent = book.note;
    counter.textContent = `${pad(selectedIndex + 1)} / ${pad(BOOKS.length)}`;
    paletteLabel.textContent = book.paletteLabel;
    inspectButton.setAttribute("aria-label", `Open ${book.title}`);
    applyBookTheme(book);
    callbacks.onSelectionChange?.({ index: selectedIndex, total: BOOKS.length, title: book.title });

    [...markers.children].forEach((marker?: any, markerIndex?: any) => {
      const current = markerIndex === selectedIndex;
      marker.setAttribute("aria-current", current ? "true" : "false");
      marker.setAttribute("aria-selected", current ? "true" : "false");
      marker.tabIndex = current ? 0 : -1;
    });

    if (announce) {
      liveRegion.textContent = `Selected volume ${selectedIndex + 1} of ${BOOKS.length}: ${book.title}. ${book.note}`;
    }
  }

  function populateDetail(book?: any) {
    detailEyebrow.textContent = `Volume ${book.roman} · ${book.discipline}`;
    detailTitle.textContent = book.title;
    detailDeck.textContent = book.deck;
    detailBinding.textContent = book.binding;
    detailFormat.textContent = book.format;
    detailTheme.textContent = book.theme;
    detailMotif.textContent = book.motif;
  }

  function getSpreadLabels(book?: any) {
    return [
      "Title page",
      `${book.chapters[0]} · Plate`,
      `${book.chapters[1]} · Notes`,
      `${book.chapters[2]} · System`,
      "Colophon",
    ];
  }

  function updatePageControls(announce: any = false) {
    const book = activeBook?.data || BOOKS[selectedIndex];
    const labels = getSpreadLabels(book);
    const interactionLocked = mode !== "detail" || !readingOpen;
    const previousDisabled = interactionLocked || currentSpread === 0;
    const nextDisabled = interactionLocked || currentSpread === SPREAD_COUNT - 1;

    previousPageButton.disabled = previousDisabled;
    nextPageButton.disabled = nextDisabled;
    pageLabel.textContent = readingOpen ? labels[currentSpread] : "Closed";
    pageCounter.textContent = readingOpen
      ? `${pad(currentSpread + 1)} / ${pad(SPREAD_COUNT)}`
      : "Click book to open";
    toggleBookButton.textContent = readingOpen ? "Close book" : "Open book";
    toggleBookButton.setAttribute("aria-pressed", String(readingOpen));
    detailMicrocopy.textContent = readingOpen
      ? "Drag pages · Drag cover to close · Background to orbit"
      : "Drag cover or click once to open · Background to orbit";
    previousPageButton.setAttribute(
      "aria-label",
      previousDisabled
        ? "Previous sample page"
        : `Previous sample page: ${labels[currentSpread - 1]}`,
    );
    nextPageButton.setAttribute(
      "aria-label",
      nextDisabled ? "Next sample page" : `Next sample page: ${labels[currentSpread + 1]}`,
    );

    if (announce && activeBook && readingOpen) {
      liveRegion.textContent = `Page ${currentSpread + 1} of ${SPREAD_COUNT}: ${labels[currentSpread]}.`;
    }
  }

  function setReadingOpen(open?: any, announce: any = true) {
    if (mode !== "detail" || readingOpen === open) return;
    cancelPageDrag();
    readingOpen = open;
    if (!readingOpen) currentSpread = 0;
    canvas.classList.remove("has-page-hover", "has-closed-book-hover");
    updatePageControls(false);
    pointerDirty = true;

    if (announce && activeBook) {
      liveRegion.textContent = readingOpen
        ? `${activeBook.data.title} opened to its title page. Drag a page horizontally or use the arrow controls to read.`
        : `${activeBook.data.title} closed. Drag the cover, click the book, or use Open book to begin reading.`;
    }
    requestFrame();
  }

  function turnPage(direction?: any) {
    if (mode !== "detail" || !readingOpen) return;
    const nextSpread = clamp(currentSpread + direction, 0, SPREAD_COUNT - 1);
    if (nextSpread === currentSpread) return;
    currentSpread = nextSpread;
    updatePageControls(true);
    requestFrame();
  }

  function updateFlexiblePage(
    pagePivot?: any,
    targetCurve?: any,
    delta?: any,
    immediate: any = false,
    targetTwist: any = 0,
  ) {
    const flex = pagePivot.userData.flex;
    if (!flex) return;
    const settleImmediately = immediate || reducedMotion;
    const step = Math.min(delta, 0.033);
    let nextCurve = targetCurve;
    let nextTwist = targetTwist;

    if (settleImmediately) {
      flex.curveVelocity = 0;
      flex.twistVelocity = 0;
    } else {
      const curveAcceleration = (targetCurve - flex.curve) * 178 - flex.curveVelocity * 19;
      const twistAcceleration = (targetTwist - flex.twist) * 210 - flex.twistVelocity * 21;
      flex.curveVelocity = clamp(flex.curveVelocity + curveAcceleration * step, -1.8, 1.8);
      flex.twistVelocity = clamp(flex.twistVelocity + twistAcceleration * step, -1.6, 1.6);
      nextCurve = clamp(flex.curve + flex.curveVelocity * step, -0.025, 0.19);
      nextTwist = clamp(flex.twist + flex.twistVelocity * step, -0.12, 0.12);

      if (Math.abs(targetCurve - nextCurve) < 0.00002 && Math.abs(flex.curveVelocity) < 0.0008) {
        nextCurve = targetCurve;
        flex.curveVelocity = 0;
      }
      if (Math.abs(targetTwist - nextTwist) < 0.00002 && Math.abs(flex.twistVelocity) < 0.0008) {
        nextTwist = targetTwist;
        flex.twistVelocity = 0;
      }
    }

    if (
      !settleImmediately &&
      Math.abs(nextCurve - flex.curve) < 0.00001 &&
      Math.abs(targetCurve - nextCurve) < 0.00001 &&
      Math.abs(nextTwist - flex.twist) < 0.00001 &&
      Math.abs(targetTwist - nextTwist) < 0.00001
    )
      return;

    flex.curve = nextCurve;
    flex.twist = nextTwist;
    flex.surfaces.forEach((surface?: any) => {
      const { position, base, direction, geometry } = surface;
      for (let vertex = 0; vertex < position.count; vertex += 1) {
        const offset = vertex * 3;
        const x = base[offset];
        const y = base[offset + 1];
        const u = x + 0.5;
        const mappedU = direction > 0 ? u : 1 - u;
        const arch = Math.sin(Math.PI * mappedU);
        const freeEdgeLift = mappedU * mappedU * 0.16;
        const shape = arch * 0.84 + freeEdgeLift;
        const diagonalTwist = nextTwist * y * Math.pow(mappedU, 1.35);
        const softRipple =
          nextTwist *
          Math.sin(mappedU * Math.PI * 2) *
          (1 - Math.min(1, Math.abs(y) * 1.65)) *
          0.09;
        const z = (nextCurve * shape * (1 + y * 0.14) + diagonalTwist + softRipple) * direction;
        position.setXYZ(vertex, x, y, z);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    });
  }

  function updatePaginatedBook(rig?: any, delta?: any, openAmount: any = 1) {
    const amount = clamp(openAmount, 0, 1);
    const speed = reducedMotion ? 1000 : 10.5;
    const hoverCrack =
      mode === "detail" && !readingOpen && detailBookHovered && !reducedMotion ? -0.16 : 0;
    const coverTarget = amount > 0 ? (-Math.PI + 0.055) * amount : hoverCrack;

    rig.frontPivot.rotation.y = damp(rig.frontPivot.rotation.y, coverTarget, speed, delta);

    rig.pagePivots.forEach((pagePivot?: any, pageIndex?: any) => {
      const leafOrder = rig.pagePivots.length - 1 - pageIndex;
      let pageTarget = 0;
      let positionTarget = pagePivot.userData.restZ;
      let pageTwistTarget = 0;
      let dragCurveBoost = 0;
      let flexTwistTarget = 0;

      if (leafOrder < PAGINATED_LEAF_COUNT) {
        const isTurned = leafOrder < currentSpread;
        const unturnedTarget = -0.038 + leafOrder * 0.008;
        const turnedTarget = -Math.PI + 0.085 + leafOrder * 0.014;
        pageTarget = isTurned ? turnedTarget : unturnedTarget;
        positionTarget = isTurned ? pagePivot.userData.turnedZ : pagePivot.userData.restZ;

        if (pageDrag.active && pageDrag.direction !== 0) {
          const dragLeafOrder = pageDrag.direction > 0 ? currentSpread : currentSpread - 1;
          if (leafOrder === dragLeafOrder) {
            const dragProgress = smoothstep(pageDrag.progress);
            const dragEnvelope = Math.sin(Math.PI * dragProgress);
            const speedResponse = clamp(Math.abs(pageDrag.progressVelocity) / 5.5, 0, 1);
            const signedSpeed = clamp(pageDrag.progressVelocity / 5.5, -1, 1);
            pageTarget =
              pageDrag.direction > 0
                ? lerp(unturnedTarget, turnedTarget, dragProgress)
                : lerp(turnedTarget, unturnedTarget, dragProgress);
            positionTarget =
              pageDrag.direction > 0
                ? lerp(pagePivot.userData.restZ, pagePivot.userData.turnedZ, dragProgress)
                : lerp(pagePivot.userData.turnedZ, pagePivot.userData.restZ, dragProgress);
            pageTwistTarget =
              pageDrag.direction * dragEnvelope * (0.014 + pageDrag.verticalBias * 0.026);
            dragCurveBoost = dragEnvelope * (0.032 + speedResponse * 0.064);
            flexTwistTarget =
              dragEnvelope *
              (pageDrag.verticalBias * 0.08 + signedSpeed * pageDrag.direction * 0.03);
          }
        }

        pagePivot.position.z = damp(
          pagePivot.position.z,
          pagePivot.userData.restZ + (positionTarget - pagePivot.userData.restZ) * amount,
          speed,
          delta,
        );
      } else {
        pageTarget = -0.006 + (leafOrder - PAGINATED_LEAF_COUNT) * 0.003;
        pagePivot.position.z = damp(pagePivot.position.z, pagePivot.userData.restZ, speed, delta);
      }

      pagePivot.rotation.y = damp(pagePivot.rotation.y, pageTarget * amount, speed, delta);
      pagePivot.rotation.z = damp(pagePivot.rotation.z, pageTwistTarget * amount, speed, delta);
      const turnProgress = clamp(Math.abs(pagePivot.rotation.y) / Math.PI, 0, 1);
      const curveTarget =
        amount > 0
          ? amount * (0.004 + Math.sin(Math.PI * turnProgress) * 0.082 + dragCurveBoost)
          : 0;
      updateFlexiblePage(pagePivot, curveTarget, delta, false, flexTwistTarget * amount);
    });
  }

  function selectMarker(index?: any, origin?: any) {
    if (mode !== "hero") return;
    const rounded = Math.round(targetPosition);
    const current = mod(rounded, BOOKS.length);
    let delta = index - current;
    if (delta > BOOKS.length / 2) delta -= BOOKS.length;
    if (delta < -BOOKS.length / 2) delta += BOOKS.length;
    targetPosition = rounded + delta;
    focusReturnTarget = origin;
    updateSelection(index, true);
    requestFrame();
  }

  function navigate(direction?: any, origin?: any) {
    if (mode !== "hero") return;
    targetPosition = Math.round(targetPosition) + direction;
    focusReturnTarget = origin;
    updateSelection(mod(Math.round(targetPosition), BOOKS.length), true);
    requestFrame();
  }

  function alignShelfToSelection() {
    const rounded = Math.round(targetPosition);
    const current = mod(rounded, BOOKS.length);
    let delta = selectedIndex - current;
    if (delta > BOOKS.length / 2) delta -= BOOKS.length;
    if (delta < -BOOKS.length / 2) delta += BOOKS.length;
    targetPosition = rounded + delta;
    position = targetPosition;
  }

  function snapRigToShelfSlot(rig?: any, index?: any) {
    let offset = index - position;
    offset -= Math.round(offset / BOOKS.length) * BOOKS.length;
    const distance = Math.abs(offset);
    const focus = 1 - clamp(distance, 0, 1);
    const fadeProgress = clamp((distance - 2.55) / 0.7, 0, 1);
    const opacity = 1 - smoothstep(fadeProgress);

    rig.root.position.set(
      offset * spacing,
      shelfBoardTop + rig.base.height * 0.5 + focus * 0.15,
      0.13 + focus * 0.24 - Math.min(distance, 2.8) * 0.07,
    );
    rig.root.rotation.set(0, -offset * 0.105, -offset * 0.018);
    rig.root.scale.setScalar(1 + focus * 0.09);
    rig.motion.position.y = 0;
    rig.motion.rotation.set(0, 0, 0);
    rig.frontPivot.rotation.y = 0;
    rig.pagePivots.forEach((pagePivot?: any) => {
      pagePivot.rotation.y = 0;
      pagePivot.rotation.z = 0;
      pagePivot.position.z = pagePivot.userData.restZ;
      updateFlexiblePage(pagePivot, 0, 0, true);
    });
    rig.opacity = opacity;
    rig.fadeMaterials.forEach((material?: any) => {
      material.opacity = opacity;
    });
    rig.contactShadow.visible = true;
    rig.contactShadow.material.opacity = opacity * 0.24;
    rig.hit.visible = opacity > 0.12;
    rig.lastOffset = offset;
  }

  function setPointerFromEvent(event?: any) {
    const rect = canvas.getBoundingClientRect();
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    pointer.ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    pointerDirty = true;
  }

  function updateHover() {
    pointerDirty = false;
    if (mode === "detail" && activeBook) {
      setHovered(-1);
      if (readingOpen) {
        detailBookHovered = false;
        canvas.classList.remove("has-closed-book-hover");
        canvas.classList.toggle(
          "has-page-hover",
          pageDrag.active || Boolean(pageSurfaceAtPointer()) || Boolean(coverSurfaceAtPointer()),
        );
      } else {
        detailBookHovered = Boolean(coverSurfaceAtPointer());
        canvas.classList.remove("has-page-hover");
        canvas.classList.toggle("has-closed-book-hover", detailBookHovered);
      }
      return;
    }
    detailBookHovered = false;
    canvas.classList.remove("has-page-hover", "has-closed-book-hover");
    if (mode !== "hero") {
      setHovered(-1);
      return;
    }
    setHovered(bookIndexAtPointer());
  }

  function bookIndexAtPointer() {
    raycaster.setFromCamera(pointer.ndc, camera);
    const hits = raycaster.intersectObjects(hitTargets, false);
    return hits.length ? hits[0].object.userData.index : -1;
  }

  function activeBookAtPointer() {
    if (mode !== "detail" || !activeBook) return false;
    activeBook.root.updateWorldMatrix(true, true);
    raycaster.setFromCamera(pointer.ndc, camera);
    return raycaster.intersectObject(activeBook.hit, false).length > 0;
  }

  function pageSurfaceAtPointer() {
    if (mode !== "detail" || !activeBook || !readingOpen) return null;
    activeBook.root.updateWorldMatrix(true, true);
    raycaster.setFromCamera(pointer.ndc, camera);
    const hits = raycaster.intersectObjects(activeBook.pageGestureSurfaces, false);
    return hits.length ? hits[0].object : null;
  }

  function coverSurfaceAtPointer() {
    if (mode !== "detail" || !activeBook || currentSpread !== 0) return null;
    activeBook.root.updateWorldMatrix(true, true);
    raycaster.setFromCamera(pointer.ndc, camera);
    const hits = raycaster.intersectObject(activeBook.frontCover, false);
    return hits.length ? hits[0].object : null;
  }

  function resetPageDrag() {
    const capturedPointerId = pageDrag.pointerId;
    pageDrag.active = false;
    pageDrag.pointerId = null;
    pageDrag.progress = 0;
    pageDrag.peakProgress = 0;
    pageDrag.committed = false;
    pageDrag.progressVelocity = 0;
    pageDrag.verticalBias = 0;
    pageDrag.lastProgress = 0;
    pageDrag.lastTime = 0;
    pageDrag.direction = 0;
    pageDrag.kind = null;
    canvas.classList.remove("is-page-dragging");
    controls.enabled = mode === "detail";
    if (capturedPointerId !== null && canvas.hasPointerCapture?.(capturedPointerId)) {
      canvas.releasePointerCapture(capturedPointerId);
    }
  }

  function applyPageReleaseImpulse(turnDirection?: any) {
    if (!activeBook || turnDirection === 0) return;
    const leafOrder = turnDirection > 0 ? currentSpread : currentSpread - 1;
    const pageIndex = activeBook.pagePivots.length - 1 - leafOrder;
    const pagePivot = activeBook.pagePivots[pageIndex];
    const flex = pagePivot?.userData.flex;
    if (!flex) return;

    const speedResponse = clamp(Math.abs(pageDrag.progressVelocity) / 5.5, 0.12, 1);
    flex.curveVelocity = clamp(flex.curveVelocity + speedResponse * 0.46, -1.8, 1.8);
    flex.twistVelocity = clamp(
      flex.twistVelocity +
        pageDrag.verticalBias * 0.38 +
        clamp(pageDrag.progressVelocity / 5.5, -1, 1) * turnDirection * 0.14,
      -1.6,
      1.6,
    );
  }

  function settlePageDrag(commitLatchedGesture: any = false) {
    if (!pageDrag.active) return false;
    const turnDirection = pageDrag.direction;
    const shouldCloseCover =
      commitLatchedGesture && pageDrag.kind === "cover-close" && pageDrag.committed;
    const shouldOpenCover =
      commitLatchedGesture && pageDrag.kind === "cover-open" && pageDrag.committed;
    const shouldTurnPage =
      commitLatchedGesture && pageDrag.kind === "page" && pageDrag.committed && turnDirection !== 0;
    if (shouldTurnPage) {
      applyPageReleaseImpulse(turnDirection);
    }
    resetPageDrag();
    if (shouldCloseCover) {
      setReadingOpen(false);
    } else if (shouldOpenCover) {
      setReadingOpen(true);
    } else if (shouldTurnPage) {
      turnPage(turnDirection);
    } else {
      requestFrame();
    }
    return shouldCloseCover || shouldOpenCover || shouldTurnPage;
  }

  function cancelPageDrag() {
    settlePageDrag(false);
  }

  function resetDetailPress() {
    detailPress.active = false;
    detailPress.pointerId = null;
    detailPress.moved = false;
    detailPress.allowClick = false;
  }

  function onDetailBookPointerDown(event?: any) {
    if (mode !== "detail" || readingOpen || event.button !== 0 || event.isPrimary === false) return;

    setPointerFromEvent(event);
    detailPress.allowClick = false;
    if (!activeBookAtPointer()) return;
    detailPress.active = true;
    detailPress.pointerId = event.pointerId;
    detailPress.startX = event.clientX;
    detailPress.startY = event.clientY;
    detailPress.moved = false;
  }

  function onDetailBookPointerMove(event?: any) {
    if (!detailPress.active || event.pointerId !== detailPress.pointerId) return;
    if (Math.hypot(event.clientX - detailPress.startX, event.clientY - detailPress.startY) > 16) {
      detailPress.moved = true;
    }
  }

  function onDetailBookPointerEnd(event?: any) {
    if (!detailPress.active || event.pointerId !== detailPress.pointerId) return;
    detailPress.allowClick = event.type === "pointerup" && !detailPress.moved;
    detailPress.active = false;
    detailPress.pointerId = null;
  }

  function onPagePointerDown(event?: any) {
    if (mode !== "detail" || !activeBook || event.button !== 0 || event.isPrimary === false) return;

    setPointerFromEvent(event);
    const coverSurface = coverSurfaceAtPointer();
    const pageSurface = readingOpen ? pageSurfaceAtPointer() : null;
    if (!coverSurface && !pageSurface) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    pageDrag.active = true;
    pageDrag.pointerId = event.pointerId;
    pageDrag.startX = event.clientX;
    pageDrag.startY = event.clientY;
    pageDrag.progress = 0;
    pageDrag.peakProgress = 0;
    pageDrag.committed = false;
    pageDrag.progressVelocity = 0;
    pageDrag.verticalBias = 0;
    pageDrag.lastProgress = 0;
    pageDrag.lastTime = event.timeStamp || performance.now();
    pageDrag.direction = 0;
    pageDrag.kind = coverSurface ? (readingOpen ? "cover-close" : "cover-open") : "page";
    controls.enabled = false;
    canvas.classList.add("has-page-hover", "is-page-dragging");
    canvas.setPointerCapture?.(event.pointerId);
    requestFrame();
  }

  function updatePageDragMotion(event?: any, deltaY?: any) {
    const eventTime = event.timeStamp || performance.now();
    const elapsed = clamp((eventTime - pageDrag.lastTime) / 1000, 0.008, 0.08);
    const instantVelocity = clamp((pageDrag.progress - pageDrag.lastProgress) / elapsed, -8, 8);
    pageDrag.progressVelocity = lerp(pageDrag.progressVelocity, instantVelocity, 0.42);
    pageDrag.verticalBias = lerp(pageDrag.verticalBias, clamp(deltaY / 180, -1, 1), 0.36);
    pageDrag.lastProgress = pageDrag.progress;
    pageDrag.lastTime = eventTime;
  }

  function updatePageDragFromEvent(event?: any) {
    setPointerFromEvent(event);

    const deltaX = event.clientX - pageDrag.startX;
    const deltaY = event.clientY - pageDrag.startY;
    const horizontalDistance = Math.abs(deltaX);

    if (pageDrag.kind === "cover-open" || pageDrag.kind === "cover-close") {
      const openingCover = pageDrag.kind === "cover-open";
      const signedDistance = openingCover ? -deltaX : deltaX;
      const commitProgress = openingCover
        ? COVER_OPEN_COMMIT_PROGRESS
        : COVER_CLOSE_COMMIT_PROGRESS;
      pageDrag.direction = 0;
      pageDrag.progress =
        horizontalDistance >= 3 && horizontalDistance >= Math.abs(deltaY) * 0.72
          ? clamp(Math.max(0, signedDistance) / 140, 0, 1)
          : 0;
      pageDrag.peakProgress = Math.max(pageDrag.peakProgress, pageDrag.progress);
      if (pageDrag.peakProgress >= commitProgress) {
        pageDrag.committed = true;
      }
      updatePageDragMotion(event, deltaY);
      return;
    }

    if (horizontalDistance < 3 || horizontalDistance < Math.abs(deltaY) * 0.72) {
      pageDrag.progress = 0;
    } else {
      if (pageDrag.direction === 0 && horizontalDistance >= 6) {
        const direction = deltaX < 0 ? 1 : -1;
        const directionAvailable =
          direction > 0 ? currentSpread < SPREAD_COUNT - 1 : currentSpread > 0;
        pageDrag.direction = directionAvailable ? direction : 0;
      }

      const signedDistance = pageDrag.direction > 0 ? -deltaX : deltaX;
      pageDrag.progress =
        pageDrag.direction !== 0 ? clamp(Math.max(0, signedDistance) / 150, 0, 1) : 0;
      pageDrag.peakProgress = Math.max(pageDrag.peakProgress, pageDrag.progress);
      if (pageDrag.peakProgress >= PAGE_TURN_COMMIT_PROGRESS) {
        pageDrag.committed = true;
      }
    }
    updatePageDragMotion(event, deltaY);
  }

  function onPagePointerMove(event?: any) {
    if (!pageDrag.active || event.pointerId !== pageDrag.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    updatePageDragFromEvent(event);

    requestFrame();
  }

  function onPagePointerEnd(event?: any) {
    if (!pageDrag.active || event.pointerId !== pageDrag.pointerId) return;
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "pointerup") updatePageDragFromEvent(event);
    const dragKind = pageDrag.kind;
    const releaseDistance = Math.hypot(
      event.clientX - pageDrag.startX,
      event.clientY - pageDrag.startY,
    );
    const shouldClickOpen =
      event.type === "pointerup" &&
      dragKind === "cover-open" &&
      !pageDrag.committed &&
      releaseDistance <= 12;
    if (pageDrag.committed) {
      settlePageDrag(true);
    } else if (shouldClickOpen) {
      resetPageDrag();
      detailPress.allowClick = false;
      setReadingOpen(true);
    } else {
      if (dragKind === "cover-open") {
        detailPress.allowClick = false;
      }
      cancelPageDrag();
    }
  }

  function onWindowPagePointerEnd(event?: any) {
    if (!pageDrag.active || event.pointerId !== pageDrag.pointerId) return;
    if (event.type === "pointerup") updatePageDragFromEvent(event);
    settlePageDrag(true);
  }

  function setHovered(index?: any) {
    if (hoveredIndex === index) return;
    hoveredIndex = index;
    canvas.classList.toggle("has-book-hover", index >= 0);
    if (index >= 0) {
      const book = BOOKS[index];
      pointerLabelIndex.textContent = `Volume ${pad(index + 1)}`;
      pointerLabelTitle.textContent = book.title;
      pointerLabel.setAttribute("aria-hidden", "false");
    } else {
      pointerLabel.setAttribute("aria-hidden", "true");
    }
    requestFrame();
  }

  function positionPointerLabel() {
    pointerLabel.style.left = `${pointer.clientX}px`;
    pointerLabel.style.top = `${pointer.clientY}px`;
  }

  function onPointerMove(event?: any) {
    setPointerFromEvent(event);
    positionPointerLabel();
    requestFrame();
  }

  function onPointerLeave() {
    pointer.ndc.set(3, 3);
    pointerDirty = false;
    detailBookHovered = false;
    setHovered(-1);
    if (!pageDrag.active) {
      canvas.classList.remove("has-page-hover", "has-closed-book-hover");
    }
  }

  function onCanvasClick(event?: any) {
    if (mode === "detail" && !readingOpen && event.button === 0) {
      if (!detailPress.allowClick) return;
      detailPress.allowClick = false;
      setPointerFromEvent(event);
      if (!activeBookAtPointer()) return;
      event.preventDefault();
      setReadingOpen(true);
      return;
    }
    if (mode !== "hero" || event.button !== 0) return;
    setPointerFromEvent(event);
    const clickedBookIndex = bookIndexAtPointer();
    if (clickedBookIndex < 0) return;
    event.preventDefault();
    selectMarker(clickedBookIndex, canvas);
    openDetail(canvas);
  }

  function onWheel(event?: any) {
    if (mode !== "hero") return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    targetPosition += clamp(delta * 0.0022, -0.72, 0.72);
    wheelIdle = 0.14;
    requestFrame();
  }

  function openDetail(origin: any = inspectButton) {
    if (mode !== "hero") return;
    mode = "opening";
    transitionTime = 0;
    readingOpen = false;
    detailBookHovered = false;
    currentSpread = 0;
    resetDetailPress();
    focusReturnTarget =
      origin === canvas
        ? markers.children[selectedIndex] || inspectButton
        : origin instanceof HTMLElement
          ? origin
          : inspectButton;
    activeBook = bookRigs[selectedIndex];
    activeBook.contactShadow.visible = false;
    populateDetail(activeBook.data);
    updatePageControls(false);
    detailPanel.inert = false;
    detailPanel.setAttribute("aria-hidden", "false");
    browseUi.inert = true;
    experience.classList.add("mode-detail", "is-opening");
    pointerLabel.setAttribute("aria-hidden", "true");
    setHovered(-1);

    activeBook.root.updateWorldMatrix(true, true);
    activeBook.root.matrixWorld.decompose(
      openingBookPosition,
      openingBookQuaternion,
      openingBookScale,
    );
    openingCameraPosition.copy(camera.position);
    openingCameraTarget.copy(transitionCameraTarget);
    openingShelfPosition.copy(shelfStage.position);
    openingMotionPosition.copy(activeBook.motion.position);
    openingMotionQuaternion.copy(activeBook.motion.quaternion);
    openingViewOffsetX = currentViewOffsetX;
    scene.add(activeBook.root);
    activeBook.root.position.copy(openingBookPosition);
    activeBook.root.quaternion.copy(openingBookQuaternion);
    activeBook.root.scale.copy(openingBookScale);
    applyDetailViewOffset();
    controls.enabled = false;
    liveRegion.textContent = `Opening a closed copy of ${activeBook.data.title}. Drag the cover, click the book, or use Open book to begin reading.`;

    if (reducedMotion) {
      finishOpening();
    }
    requestFrame();
  }

  function applyOpeningPose(progress?: any) {
    const eased = smootherstep(clamp(progress, 0, 1));
    const shelfClearEased = smootherstep(clamp(progress / 0.68, 0, 1));
    inspectBookScale.setScalar(getInspectScale());
    shelfStage.position.lerpVectors(openingShelfPosition, inspectShelfPosition, shelfClearEased);
    activeBook.root.position.lerpVectors(openingBookPosition, inspectPosition, eased);
    activeBook.root.quaternion.slerpQuaternions(
      openingBookQuaternion,
      inspectBookQuaternion,
      eased,
    );
    activeBook.root.scale.lerpVectors(openingBookScale, inspectBookScale, eased);
    activeBook.motion.position.lerpVectors(openingMotionPosition, restingMotionPosition, eased);
    activeBook.motion.quaternion.slerpQuaternions(
      openingMotionQuaternion,
      restingMotionQuaternion,
      eased,
    );
    camera.position.lerpVectors(openingCameraPosition, inspectCameraPosition, eased);
    transitionCameraTarget.lerpVectors(openingCameraTarget, inspectCameraTarget, eased);
    currentViewOffsetX = lerp(openingViewOffsetX, detailViewOffsetX, eased);
    applyDetailViewOffset();
    camera.lookAt(transitionCameraTarget);
  }

  function finishOpening() {
    if (!activeBook) return;
    applyOpeningPose(1);
    mode = "detail";
    transitionTime = 1;
    callbacks.onModeChange?.("detail");
    controls.target.copy(inspectCameraTarget);
    controls.enabled = true;
    controls.enableDamping = !reducedMotion;
    controls.update();
    updatePageControls(false);
    experience.classList.remove("is-opening");
    closeButton.focus({ preventScroll: true });
  }

  function closeDetail() {
    if (mode !== "detail") return;
    cancelPageDrag();
    resetDetailPress();
    mode = "closing";
    transitionTime = 0;
    readingOpen = false;
    detailBookHovered = false;
    currentSpread = 0;
    canvas.classList.remove("has-page-hover", "has-closed-book-hover");
    updatePageControls(false);
    controls.enabled = false;
    closingBookStartPosition.copy(activeBook.root.position);
    closingBookStartQuaternion.copy(activeBook.root.quaternion);
    closingBookStartScale.copy(activeBook.root.scale);
    closingMotionPosition.copy(activeBook.motion.position);
    closingMotionQuaternion.copy(activeBook.motion.quaternion);
    closingCameraPosition.copy(camera.position);
    closingCameraTarget.copy(controls.target);
    closingShelfPosition.copy(shelfStage.position);
    closingViewOffsetX = currentViewOffsetX;
    transitionCameraTarget.copy(closingCameraTarget);
    experience.classList.remove("is-opening");
    alignShelfToSelection();
    closingBookPosition.set(0, shelfBoardTop + activeBook.base.height * 0.5 + 0.15, 0.37);
    bookRigs.forEach((rig?: any, index?: any) => {
      if (rig !== activeBook && rig.root.parent === shelfStage) {
        snapRigToShelfSlot(rig, index);
      }
    });
    experience.classList.remove("mode-detail");
    detailPanel.setAttribute("aria-hidden", "true");
    detailPanel.inert = true;
    liveRegion.textContent = `Returning ${activeBook.data.title} to the shelf.`;
    if (reducedMotion) {
      finishClosing();
    }
    requestFrame();
  }

  function applyClosingPose(progress?: any) {
    const eased = smootherstep(clamp(progress, 0, 1));
    const shelfReturnEased = smootherstep(clamp((progress - 0.24) / 0.76, 0, 1));
    shelfStage.position.lerpVectors(closingShelfPosition, shelfRestPosition, shelfReturnEased);
    activeBook.root.position.lerpVectors(closingBookStartPosition, closingBookPosition, eased);
    activeBook.root.quaternion.slerpQuaternions(
      closingBookStartQuaternion,
      closingBookQuaternion,
      eased,
    );
    activeBook.root.scale.lerpVectors(closingBookStartScale, closingBookScale, eased);
    activeBook.motion.position.lerpVectors(closingMotionPosition, restingMotionPosition, eased);
    activeBook.motion.quaternion.slerpQuaternions(
      closingMotionQuaternion,
      restingMotionQuaternion,
      eased,
    );
    camera.position.lerpVectors(closingCameraPosition, shelfCameraPosition, eased);
    transitionCameraTarget.lerpVectors(closingCameraTarget, shelfCameraTarget, eased);
    currentViewOffsetX = lerp(closingViewOffsetX, 0, eased);
    applyDetailViewOffset();
    camera.lookAt(transitionCameraTarget);
  }

  function finishClosing() {
    if (!activeBook) return;
    applyClosingPose(1);
    shelfStage.attach(activeBook.root);
    snapRigToShelfSlot(activeBook, selectedIndex);
    activeBook.contactShadow.visible = true;
    controls.target.copy(shelfCameraTarget);
    browseUi.inert = false;
    mode = "hero";
    transitionTime = 0;
    callbacks.onModeChange?.("shelf");
    activeBook = null;
    liveRegion.textContent = `${BOOKS[selectedIndex].title} returned to the shelf.`;
    requestAnimationFrame(() => focusReturnTarget?.focus?.({ preventScroll: true }));
  }

  function resetInspectionView() {
    if (mode !== "detail") return;
    camera.position.copy(inspectCameraPosition);
    controls.target.copy(inspectCameraTarget);
    controls.update();
    liveRegion.textContent = `Inspection view reset for ${BOOKS[selectedIndex].title}.`;
    requestFrame();
  }

  function updateShelfLayout(delta?: any, elapsed?: any) {
    if (mode === "hero") {
      position = reducedMotion ? targetPosition : damp(position, targetPosition, 9.5, delta);
      if (Math.abs(position - targetPosition) < 0.0005) position = targetPosition;

      if (wheelIdle > 0) {
        wheelIdle -= delta;
        if (wheelIdle <= 0) targetPosition = Math.round(targetPosition);
      }

      const nearest = mod(Math.round(position), BOOKS.length);
      if (nearest !== selectedIndex) updateSelection(nearest, false);
    }

    bookRigs.forEach((rig?: any, index?: any) => {
      if (rig.root.parent !== shelfStage) return;

      let offset = index - position;
      offset -= Math.round(offset / BOOKS.length) * BOOKS.length;
      const distance = Math.abs(offset);
      const wrappedAcrossSeam =
        rig.lastOffset !== null && Math.abs(offset - rig.lastOffset) > BOOKS.length * 0.5;
      const focus = 1 - clamp(distance, 0, 1);
      const targetX = offset * spacing;
      const targetY = shelfBoardTop + rig.base.height * 0.5 + focus * 0.15;
      const targetZ = 0.13 + focus * 0.24 - Math.min(distance, 2.8) * 0.07;
      const targetRotationY = -offset * 0.105;
      const targetRotationZ = -offset * 0.018;
      const targetScale = 1 + focus * 0.09;
      const speed = reducedMotion ? 1000 : 12;

      if (wrappedAcrossSeam) {
        rig.root.position.x = targetX;
        rig.opacity = 0;
      }
      rig.lastOffset = offset;

      rig.root.position.x = damp(rig.root.position.x, targetX, speed, delta);
      rig.root.position.y = damp(rig.root.position.y, targetY, speed, delta);
      rig.root.position.z = damp(rig.root.position.z, targetZ, speed, delta);
      rig.root.rotation.y = damp(rig.root.rotation.y, targetRotationY, speed, delta);
      rig.root.rotation.z = damp(rig.root.rotation.z, targetRotationZ, speed, delta);
      const nextScale = damp(rig.root.scale.x, targetScale, speed, delta);
      rig.root.scale.setScalar(nextScale);

      const fadeProgress = clamp((distance - 2.55) / 0.7, 0, 1);
      const targetOpacity = 1 - smoothstep(fadeProgress);
      rig.opacity = reducedMotion ? targetOpacity : damp(rig.opacity, targetOpacity, 18, delta);
      rig.fadeMaterials.forEach((material?: any) => {
        material.opacity = rig.opacity;
      });
      rig.contactShadow.visible = true;
      rig.contactShadow.material.opacity = rig.opacity * 0.24;
      rig.hit.visible = rig.opacity > 0.12;

      const isHovered = hoveredIndex === index && mode === "hero";
      const hoverPreview = isHovered && !reducedMotion;
      const hoverAngle = hoverPreview ? -0.085 : 0;
      rig.frontPivot.rotation.y = damp(
        rig.frontPivot.rotation.y,
        hoverAngle,
        reducedMotion ? 1000 : 13,
        delta,
      );
      rig.pagePivots.forEach((pagePivot?: any) => {
        pagePivot.rotation.y = damp(pagePivot.rotation.y, 0, reducedMotion ? 1000 : 13, delta);
        pagePivot.rotation.z = damp(pagePivot.rotation.z, 0, reducedMotion ? 1000 : 13, delta);
        updateFlexiblePage(pagePivot, 0, delta);
      });

      const idle = reducedMotion ? 0 : Math.sin(elapsed * 0.72 + index * 0.8) * 0.012 * focus;
      rig.motion.position.y = damp(
        rig.motion.position.y,
        idle + (hoverPreview ? 0.035 : 0),
        9,
        delta,
      );
      rig.motion.rotation.x = damp(
        rig.motion.rotation.x,
        hoverPreview ? pointer.ndc.y * 0.035 : 0,
        10,
        delta,
      );
      rig.motion.rotation.y = damp(
        rig.motion.rotation.y,
        hoverPreview ? -pointer.ndc.x * 0.035 : 0,
        10,
        delta,
      );
    });
  }

  function updateTransition(delta?: any) {
    if (mode === "opening") {
      transitionTime = Math.min(1, transitionTime + delta / DETAIL_TRANSITION_DURATION);
      applyOpeningPose(transitionTime);
      updatePaginatedBook(activeBook, delta, 0);
      if (transitionTime >= 1) finishOpening();
    } else if (mode === "closing") {
      transitionTime = Math.min(1, transitionTime + delta / SHELF_TRANSITION_DURATION);
      applyClosingPose(transitionTime);
      updatePaginatedBook(activeBook, delta, 0);
      if (transitionTime >= 1) finishClosing();
    } else if (mode === "hero") {
      shelfStage.position.y = damp(shelfStage.position.y, 0, 10, delta);
      shelfStage.position.z = damp(shelfStage.position.z, 0, 10, delta);
      camera.position.x = damp(camera.position.x, shelfCameraPosition.x, 8, delta);
      camera.position.y = damp(camera.position.y, shelfCameraPosition.y, 8, delta);
      camera.position.z = damp(camera.position.z, shelfCameraPosition.z, 8, delta);
      transitionCameraTarget.copy(shelfCameraTarget);
      currentViewOffsetX = 0;
      applyDetailViewOffset();
      camera.lookAt(shelfCameraTarget);
    }
  }

  function updateDust(elapsed?: any) {
    if (reducedMotion) return;
    const dust = scene.getObjectByName("paper-dust");
    if (dust) {
      dust.rotation.y = elapsed * 0.012;
      dust.position.y = Math.sin(elapsed * 0.17) * 0.025;
    }
  }

  function requestFrame() {
    if (!rafId && !suspended) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function getDetailOpenAmount() {
    if (pageDrag.active && pageDrag.kind === "cover-open") {
      return smoothstep(pageDrag.progress);
    }
    if (!readingOpen) return 0;
    if (pageDrag.active && pageDrag.kind === "cover-close") {
      return 1 - smoothstep(pageDrag.progress);
    }
    return 1;
  }

  function frame(time?: any) {
    rafId = 0;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    const elapsed = time / 1000;
    lastTime = time;

    if (pointerDirty) updateHover();
    updateShelfLayout(delta, elapsed);
    updateTransition(delta);
    updateDust(elapsed);
    const themeIsMoving = updateTheme(delta);

    if (mode === "detail") {
      if (pageDrag.active) {
        pageDrag.progressVelocity = damp(pageDrag.progressVelocity, 0, 9, delta);
      }
      controls.update();
      updatePaginatedBook(activeBook, delta, getDetailOpenAmount());
    }

    renderer.render(scene, camera);

    const shelfMoving = Math.abs(position - targetPosition) > 0.0005 || wheelIdle > 0;
    const shouldContinue =
      !reducedMotion || mode === "opening" || mode === "closing" || shelfMoving || themeIsMoving;
    if (shouldContinue && !suspended) requestFrame();
  }

  function resize() {
    viewWidth = Math.max(1, experience.clientWidth);
    viewHeight = Math.max(1, experience.clientHeight);
    configureResponsiveTargets();
    renderer.setSize(viewWidth, viewHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, viewWidth < 820 ? 1.5 : 2));
    camera.aspect = viewWidth / viewHeight;
    camera.updateProjectionMatrix();

    if (mode === "hero") {
      camera.position.copy(shelfCameraPosition);
      transitionCameraTarget.copy(shelfCameraTarget);
      currentViewOffsetX = 0;
      applyDetailViewOffset();
      camera.lookAt(shelfCameraTarget);
    } else if (mode === "detail" && activeBook) {
      activeBook.root.position.copy(inspectPosition);
      activeBook.root.scale.setScalar(getInspectScale());
      transitionCameraTarget.copy(inspectCameraTarget);
      currentViewOffsetX = detailViewOffsetX;
      applyDetailViewOffset();
      resetInspectionView();
    }
    requestFrame();
  }

  function onKeyDown(event?: any) {
    if (event.key === "Escape" && mode === "detail") {
      event.preventDefault();
      closeDetail();
      return;
    }

    if (
      mode === "detail" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      turnPage(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }

    if (mode === "detail" && event.key === "Tab") {
      const focusables = [
        closeButton,
        toggleBookButton,
        previousPageButton,
        nextPageButton,
        resetButton,
      ].filter((element?: any) => !element.disabled);
      const current = focusables.indexOf(document.activeElement);
      const next = event.shiftKey
        ? current <= 0
          ? focusables.length - 1
          : current - 1
        : current >= focusables.length - 1
          ? 0
          : current + 1;
      event.preventDefault();
      focusables[next].focus();
      return;
    }

    if (mode !== "hero" || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1, document.activeElement);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1, document.activeElement);
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      document.activeElement === inspectButton
    ) {
      event.preventDefault();
      openDetail(inspectButton);
    }
  }

  function onVisibilityChange() {
    suspended = document.hidden || offscreen;
    if (!suspended) {
      lastTime = performance.now();
      requestFrame();
    } else {
      settlePageDrag(true);
      resetDetailPress();
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }
  }

  function onWindowBlur() {
    settlePageDrag(true);
    resetDetailPress();
  }

  function onReducedMotionChange(event?: any) {
    cancelPageDrag();
    resetDetailPress();
    reducedMotion = callbacks.reducedMotion || event.matches;
    controls.enableDamping = !reducedMotion;
    if (reducedMotion) {
      position = targetPosition;
    }
    requestFrame();
  }

  function showFallback(message?: any) {
    loading.hidden = true;
    experience.classList.remove("webgl-ready");
    fallbackStatus.textContent = message;
    callbacks.onError?.(message);
  }

  function handleContextLost(event?: any) {
    event.preventDefault();
    cancelPageDrag();
    resetDetailPress();
    suspended = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    showFallback(
      "The 3D view paused after losing its graphics context. The complete static catalog remains available; reload to restore inspection.",
    );
  }

  function disposeExperience() {
    destroyed = true;
    suspended = true;
    cancelPageDrag();
    resetDetailPress();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;

    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("click", onCanvasClick);
    canvas.removeEventListener("pointerdown", onDetailBookPointerDown, true);
    canvas.removeEventListener("pointermove", onDetailBookPointerMove, true);
    canvas.removeEventListener("pointerup", onDetailBookPointerEnd, true);
    canvas.removeEventListener("pointercancel", onDetailBookPointerEnd, true);
    canvas.removeEventListener("lostpointercapture", onDetailBookPointerEnd, true);
    canvas.removeEventListener("pointerdown", onPagePointerDown, true);
    canvas.removeEventListener("pointermove", onPagePointerMove, true);
    canvas.removeEventListener("pointerup", onPagePointerEnd, true);
    canvas.removeEventListener("pointercancel", onPagePointerEnd, true);
    canvas.removeEventListener("lostpointercapture", onPagePointerEnd, true);
    window.removeEventListener("pointerup", onWindowPagePointerEnd);
    window.removeEventListener("pointercancel", onWindowPagePointerEnd);
    experience.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    window.removeEventListener("resize", resize);
    experience.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("blur", onWindowBlur);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    intersectionObserver?.disconnect();
    reducedMotionQuery.removeEventListener("change", onReducedMotionChange);

    controls?.dispose();
    scene?.traverse((object?: any) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material?: any) => {
        Object.values(material).forEach((value?: any) => {
          if (value?.isTexture) value.dispose();
        });
        material.dispose();
      });
    });
    environmentTarget?.dispose();
    renderer?.dispose();
  }

  async function initialize() {
    const woodTexturePromise = (
      callbacks.woodTexture ? woodTextureImage.decode() : Promise.resolve()
    ).then(
      () => true,
      () => false,
    );

    try {
      await document.fonts.load("600 82px Inter");
    } catch (error: any) {
      // The system sans-serif fallback keeps the interface usable offline.
    }

    try {
      if (!callbacks.coverAtlas) throw new Error("No cover atlas");
      await coverAtlasImage.decode();
      coverAtlasReady = true;
    } catch (error: any) {
      coverAtlasReady = false;
    }

    if (destroyed) return;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (error: any) {
      showFallback(
        "WebGL is unavailable in this browser. The complete static catalog remains available.",
      );
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xe9dfcb, 0.027);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    environmentTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.72;
    pmremGenerator.dispose();

    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    shelfStage = new THREE.Group();
    shelfStage.name = "continuous-shelf-stage";
    scene.add(shelfStage);

    configureResponsiveTargets();
    camera.position.copy(shelfCameraPosition);
    camera.lookAt(shelfCameraTarget);

    controls = new OrbitControls(camera, canvas);
    controls.enabled = false;
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.075;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 2.8;
    controls.maxDistance = 7.2;
    controls.minPolarAngle = Math.PI * 0.24;
    controls.maxPolarAngle = Math.PI * 0.76;
    controls.target.copy(shelfCameraTarget);
    controls.addEventListener("change", requestFrame);

    RectAreaLightUniformsLib.init();
    addRoom();
    addLights();
    buildMarkers();

    bookRigs = BOOKS.map((book?: any, index?: any) => {
      const rig = createBookRig(book, index);
      shelfStage.add(rig.root);
      return rig;
    });

    updateSelection(0, true);
    resize();

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("pointerdown", onDetailBookPointerDown, { capture: true });
    canvas.addEventListener("pointermove", onDetailBookPointerMove, { capture: true });
    canvas.addEventListener("pointerup", onDetailBookPointerEnd, { capture: true });
    canvas.addEventListener("pointercancel", onDetailBookPointerEnd, { capture: true });
    canvas.addEventListener("lostpointercapture", onDetailBookPointerEnd, { capture: true });
    canvas.addEventListener("pointerdown", onPagePointerDown, { capture: true });
    canvas.addEventListener("pointermove", onPagePointerMove, { capture: true });
    canvas.addEventListener("pointerup", onPagePointerEnd, { capture: true });
    canvas.addEventListener("pointercancel", onPagePointerEnd, { capture: true });
    canvas.addEventListener("lostpointercapture", onPagePointerEnd, { capture: true });
    window.addEventListener("pointerup", onWindowPagePointerEnd);
    window.addEventListener("pointercancel", onWindowPagePointerEnd);
    experience.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("webglcontextlost", handleContextLost);
    window.addEventListener("resize", resize);
    experience.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    intersectionObserver = new IntersectionObserver(([entry]) => {
      const nextOffscreen = !entry.isIntersecting;
      if (nextOffscreen === offscreen) return;
      offscreen = nextOffscreen;
      onVisibilityChange();
    });
    intersectionObserver.observe(experience);
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    previousButton.addEventListener("click", () => navigate(-1, previousButton));
    nextButton.addEventListener("click", () => navigate(1, nextButton));
    inspectButton.addEventListener("click", () => openDetail(inspectButton));
    closeButton.addEventListener("click", closeDetail);
    toggleBookButton.addEventListener("click", () => setReadingOpen(!readingOpen));
    previousPageButton.addEventListener("click", () => turnPage(-1));
    nextPageButton.addEventListener("click", () => turnPage(1));
    resetButton.addEventListener("click", resetInspectionView);

    renderer.render(scene, camera);
    loading.hidden = true;
    experience.classList.add("webgl-ready");
    requestFrame();
    callbacks.onReady?.();

    woodTexturePromise.then((ready?: any) => {
      if (!ready || suspended || !renderer) return;
      woodTextureReady = true;
      applyWoodTexture();
    });
  }

  const ready = initialize().catch((error?: any) => {
    showFallback("The interactive Bookshelf collection could not be prepared.");
    throw error;
  });

  return {
    ready,
    resize: () => {
      if (renderer && !destroyed) resize();
    },
    open: () => {
      if (mode === "hero" && renderer) openDetail(canvas);
    },
    openSelected: () => {
      if (mode === "hero" && renderer) openDetail(canvas);
    },
    close: () => {
      if (mode === "detail" && renderer) closeDetail();
    },
    previousVolume: () => {
      if (mode === "hero" && renderer) navigate(-1, canvas);
    },
    nextVolume: () => {
      if (mode === "hero" && renderer) navigate(1, canvas);
    },
    toggle: () => {
      if (!renderer) return;
      if (mode === "hero") openDetail(canvas);
      else if (mode === "detail") setReadingOpen(!readingOpen);
    },
    previousPage: () => {
      if (!renderer) return;
      if (mode === "hero") openDetail(canvas);
      else if (mode === "detail" && !readingOpen) setReadingOpen(true);
      else if (mode === "detail") turnPage(-1);
    },
    nextPage: () => {
      if (!renderer) return;
      if (mode === "hero") openDetail(canvas);
      else if (mode === "detail" && !readingOpen) setReadingOpen(true);
      else if (mode === "detail") turnPage(1);
    },
    dispose: disposeExperience,
  };
}

const CONTROL_IDS: any = [
  "selection-title",
  "selection-note",
  "counter",
  "palette-label",
  "page-label",
  "page-counter",
  "detail-eyebrow",
  "detail-title",
  "detail-deck",
  "detail-binding",
  "detail-format",
  "detail-theme",
  "detail-motif",
  "live-region",
];
const BUTTON_IDS: any = [
  "previous",
  "next",
  "inspect",
  "close-detail",
  "reset-view",
  "toggle-book",
  "previous-page",
  "next-page",
];

export interface BookshelfSceneProps {
  className?: string;
  /** Optional cover atlas image URL: seven 512×768 covers side by side (3584×768). */
  coverAtlas?: string;
  /** Optional wood texture image URL for the shelf (must allow CORS). */
  woodTexture?: string;
  backgroundColor?: string;
}

export function BookshelfScene({
  className,
  coverAtlas,
  woodTexture,
  backgroundColor = "#171a24",
}: BookshelfSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    let disposed = false;
    let renderer;
    setState("loading");
    try {
      renderer = createBookshelfRenderer(host, canvas, {
        coverAtlas,
        woodTexture,
        reducedMotion: !!prefersReducedMotion,
        onReady: () => {
          if (!disposed) setState("ready");
        },
        onError: (message: string) => {
          if (!disposed) {
            setErrorMessage(message);
            setState("unavailable");
          }
        },
      });
      void renderer.ready.catch((error) => {
        if (!disposed) {
          setErrorMessage(error instanceof Error ? error.message : "Unknown renderer error");
          setState("unavailable");
        }
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown renderer error");
      setState("unavailable");
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => renderer.resize());
    resizeObserver.observe(host);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [coverAtlas, woodTexture, prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      data-state={state}
      tabIndex={0}
      className={cn("absolute inset-0 block h-full w-full overflow-hidden outline-none", className)}
      style={{ backgroundColor, containerType: "inline-size" }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 block h-full w-full touch-none opacity-0",
          state === "ready" && "opacity-100",
        )}
        aria-label="Interactive bookshelf collection"
      />

      <div className="hidden" aria-hidden="true">
        <div data-bookshelf="loading" hidden />
        <p data-bookshelf="fallback-status" />
        <section data-bookshelf="browse-ui" />
        <aside data-bookshelf="detail-panel">
          <div className="detail-controls">
            <p className="microcopy" />
          </div>
        </aside>
        <div data-bookshelf="markers" />
        {CONTROL_IDS.map((id: string) => (
          <span key={id} data-bookshelf={id} />
        ))}
        {BUTTON_IDS.map((id: string) => (
          <button key={id} data-bookshelf={id} type="button" tabIndex={-1} />
        ))}
        <span data-bookshelf="pointer-label">
          <span data-bookshelf="pointer-label-index" />
          <span data-bookshelf="pointer-label-title" />
        </span>
      </div>

      {state === "unavailable" ? (
        <p
          className="absolute inset-0 m-0 grid place-items-center p-6 text-center text-[#f4eee6]"
          role="status"
        >
          WebGL is unavailable: {errorMessage || "unsupported context"}.
        </p>
      ) : null}
    </div>
  );
}
