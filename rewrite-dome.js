const fs = require("fs");
let content = fs.readFileSync("src/registry/dome-gallery.tsx", "utf8");

// Insert Interfaces
content = content.replace(
  /const DomeGallery = \(\{\n/g,
  `
interface DomeGalleryItem {
  src: string;
  alt?: string;
  x?: number;
  y?: number;
  sizeX?: number;
  sizeY?: number;
}

interface DomeGalleryProps {
  items?: DomeGalleryItem[];
  radius?: number;
  segments?: number;
  rotationSpeed?: number;
  zoomSpeed?: number;
  inertia?: number;
  friction?: number;
  grayscale?: boolean;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  overlayBlurColor?: string;
}

export function DomeGallery({
`,
);

content = content.replace(
  /overlayBlurColor = 'rgba\(15, 15, 15, 0\.9\)'\n\}\) => \{/g,
  `overlayBlurColor = 'rgba(15, 15, 15, 0.9)'\n}: DomeGalleryProps) {`,
);
content = content.replace(/export default DomeGallery;/g, "");

// Fix useRef hooks
content = content.replace(
  /const rootRef = useRef\(null\);/g,
  "const rootRef = useRef<HTMLDivElement>(null);",
);
content = content.replace(
  /const mainRef = useRef\(null\);/g,
  "const mainRef = useRef<HTMLElement>(null);",
);
content = content.replace(
  /const sphereRef = useRef\(null\);/g,
  "const sphereRef = useRef<HTMLDivElement>(null);",
);
content = content.replace(
  /const viewerRef = useRef\(null\);/g,
  "const viewerRef = useRef<HTMLDivElement>(null);",
);
content = content.replace(
  /const frameRef = useRef\(null\);/g,
  "const frameRef = useRef<HTMLDivElement>(null);",
);
content = content.replace(
  /const scrimRef = useRef\(null\);/g,
  "const scrimRef = useRef<HTMLDivElement>(null);",
);
content = content.replace(
  /const draggingRef = useRef\(false\);/g,
  "const draggingRef = useRef(false);",
);
content = content.replace(/const movedRef = useRef\(false\);/g, "const movedRef = useRef(false);");
content = content.replace(
  /const lastDragEndAt = useRef\(0\);/g,
  "const lastDragEndAt = useRef(0);",
);
content = content.replace(
  /const openingRef = useRef\(false\);/g,
  "const openingRef = useRef(false);",
);

// Types for refs that store complex state
content = content.replace(
  /const stateRef = useRef\(\{\n[\s\S]*?\}\);/g,
  `const stateRef = useRef({
    rx: 0,
    ry: 0,
    vx: 0,
    vy: 0,
    scale: 1,
    scaleV: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0, rx: 0, ry: 0 },
    lastP: { x: 0, y: 0 },
    dragMode: null as 'pan' | 'zoom' | null,
    pointers: [] as { id: number; x: number; y: number }[],
    initialDist: 0,
    initialScale: 1
  });`,
);

content = content.replace(
  /const rafRef = useRef\(null\);/g,
  "const rafRef = useRef<number | null>(null);",
);

// Change `useGesture` parameter types
content = content.replace(
  /onDrag: \(\{ movement: \[mx, my\], velocity: \[vx, vy\], first, last, event, cancel \} => \{/g,
  `onDrag: ({ movement: [mx, my], velocity: [vx, vy], first, last, event, cancel }: any) => {`,
);
content = content.replace(
  /onPinch: \(\{ offset: \[d\], first, last, event \} => \{/g,
  `onPinch: ({ offset: [d], first, last, event }: any) => {`,
);
content = content.replace(
  /onWheel: \(\{ delta: \[, dy\], event \} => \{/g,
  `onWheel: ({ delta: [, dy], event }: any) => {`,
);

// any casting for DOM
content = content.replace(
  /openItemFromElement\(e\.currentTarget\)/g,
  "openItemFromElement(e.currentTarget as HTMLElement)",
);
content = content.replace(
  /const openItemFromElement = el => \{/g,
  "const openItemFromElement = (el: HTMLElement) => {",
);

// The bind spreading
content = content.replace(/\{...bind\(\)\}/g, "{...(bind() as any)}");

fs.writeFileSync("src/registry/dome-gallery.tsx", content);
