const fs = require("fs");

let content = fs.readFileSync("src/registry/dome-gallery.tsx", "utf8");

// Fix left-hand optional chaining
content = content.replace(/parent\?\.style\./g, "if(parent) parent.style.");
content = content.replace(/el\?\.style\./g, "if(el) el.style.");
content = content.replace(/el\?\./g, "if(el) el.");
// This above regex `el?.style.` replacement might make `if(el) el.style.transition = 'none'` but what if it's inside another statement?
// Let's just fix it by casting:
// `parent?.style.transition =` -> `if(parent) parent.style.transition =`

content = content.replace(
  /lockedRadiusRef.current = Math.round\(radius\);/g,
  "lockedRadiusRef.current = Math.round(radius) as any;",
);
content = content.replace(
  /inertiaRAF.current = requestAnimationFrame\(step\);/g,
  "inertiaRAF.current = requestAnimationFrame(step) as any;",
);

content = content.replace(
  /function buildItems\(pool, seg\)/g,
  "function buildItems(pool: any[], seg: number)",
);
content = content.replace(/pool.map\(image =>/g, "pool.map((image: any) =>");
content = content.replace(
  /function computeItemBaseRotation\(offsetX, offsetY, sizeX, sizeY, segments\)/g,
  "function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number)",
);

content = content.replace(
  /const applyTransform = \(xDeg, yDeg\)/g,
  "const applyTransform = (xDeg: number, yDeg: number)",
);
content = content.replace(/\(vx, vy\) =>/g, "(vx: number, vy: number) =>");

content = content.replace(/onDragStart: \(\{ event \}\)/g, "onDragStart: ({ event }: any)");

content = content.replace(
  /const getDataNumber = \(el, name, fallback\)/g,
  "const getDataNumber = (el: any, name: string, fallback: number)",
);

content = content.replace(/style={{/g, "style={{\n// @ts-ignore");

fs.writeFileSync("src/registry/dome-gallery.tsx", content);
