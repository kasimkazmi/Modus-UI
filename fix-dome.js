const fs = require("fs");
let code = fs.readFileSync("src/registry/dome-gallery.tsx", "utf8");

code = code.replace(
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

code = code.replace(
  /overlayBlurColor = 'rgba\(15, 15, 15, 0\.9\)'\n\}\) => \{/g,
  `overlayBlurColor = 'rgba(15, 15, 15, 0.9)'\n}: DomeGalleryProps) {`,
);

code = code.replace(/export default DomeGallery;/g, "");

code = code.replace(/useRef\(null\)/g, "useRef<any>(null)");
code = code.replace(/useRef\(false\)/g, "useRef<boolean>(false)");
code = code.replace(/useRef\(0\)/g, "useRef<number>(0)");
code = code.replace(/useRef\(\{\n/g, "useRef<any>({\n");

code = code.replace(
  /const getDataNumber = \(el, name, fallback\) => \{/g,
  "const getDataNumber = (el: any, name: string, fallback: number) => {",
);
code = code.replace(
  /function buildItems\(pool, seg\) \{/g,
  "function buildItems(pool: any[], seg: number) {",
);
code = code.replace(/pool.map\(image => \{/g, "pool.map((image: any) => {");
code = code.replace(
  /function computeItemBaseRotation\(offsetX, offsetY, sizeX, sizeY, segments\) \{/g,
  "function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {",
);

code = code.replace(
  /const applyTransform = \(xDeg, yDeg\) => \{/g,
  "const applyTransform = (xDeg: number, yDeg: number) => {",
);
code = code.replace(
  /lockedRadiusRef.current = Math.round\(radius\);/g,
  "lockedRadiusRef.current = Math.round(radius) as any;",
);
code = code.replace(/\(vx, vy\) => \{/g, "(vx: number, vy: number) => {");
code = code.replace(
  /inertiaRAF.current = requestAnimationFrame\(step\);/g,
  "inertiaRAF.current = requestAnimationFrame(step) as any;",
);

code = code.replace(/onDragStart: \(\{ event \} => \{/g, "onDragStart: ({ event }: any) => {");
code = code.replace(
  /onDrag: \(\{ event, last, velocity: velArr = \[0, 0\], direction: dirArr = \[0, 0\], movement \} => \{/g,
  "onDrag: ({ event, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }: any) => {",
);
code = code.replace(
  /onWheel: \(\{ delta: \[, dy\], event \} => \{/g,
  "onWheel: ({ delta: [, dy], event }: any) => {",
);
code = code.replace(
  /onPinch: \(\{ offset: \[d\], first, last, event \} => \{/g,
  "onPinch: ({ offset: [d], first, last, event }: any) => {",
);

code = code.replace(
  /const openItemFromElement = el => \{/g,
  "const openItemFromElement = (el: any) => {",
);
code = code.replace(/const parent = el.parentElement;/g, "const parent = el?.parentElement;");

code = code.replace(/parent.style/g, "parent?.style");
code = code.replace(/el.style/g, "el?.style");
code = code.replace(/parent\?\.style\./g, "if(parent) parent.style.");
code = code.replace(/el\?\.style\./g, "if(el) el.style.");
code = code.replace(/img\?\.style\./g, "if(img) img.style.");

code = code.replace(/const onKey = e => \{/g, "const onKey = (e: any) => {");

code = code.replace(/parent.appendChild\(refDiv\);/g, "parent?.appendChild(refDiv);");
code = code.replace(/parent.removeChild\(refDiv\);/g, "parent?.removeChild(refDiv);");
code = code.replace(/parent.dataset/g, "parent?.dataset");
code = code.replace(/viewerRef.current.appendChild/g, "viewerRef.current?.appendChild");

code = code.replace(/const onFirstEnd = ev => \{/g, "const onFirstEnd = (ev: any) => {");

code = code.replace(/}} \/>/g, "}} />");
code = code.replace(/}}>/g, "}}>");

code = code.replace(/style={{([\s\S]*?)}}/g, (match, p1) => {
  return `style={{${p1}} as React.CSSProperties}`;
});

fs.writeFileSync("src/registry/dome-gallery.tsx", code);
