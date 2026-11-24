# Pro-inspired components: plan and batch 1

## Rules for this work (clean room)

- Source of inspiration: only the **public** React Bits Pro catalog (names, one-line descriptions, preview images and videos).
- Never use Pro markdown, "Copy prompt", registry source or anything behind the license key. Never port react-bits source (Commons Clause bans ported versions).
- Every component gets an original Modus name and fresh code, following `AGENTS.md`: TypeScript, `cn()`, `framer-motion` or plain canvas/WebGL, theme tokens as `hsl(var(--x))` (resolve via `getComputedStyle` on canvas), reduced-motion support.
- Scaffold with `pnpm new:component`; register only in `src/registry/index.ts` and `src/registry/demos.ts`.

## Public catalog (230 components)

| Group          | Count | Examples                                                          |
| -------------- | ----- | ----------------------------------------------------------------- |
| Text           | 34    | Shatter Type, Orbital Type, Ribbon Type, Vapor Type               |
| Backgrounds    | 98    | Spectral Drape, Vortex, Glass Tiles, Satin Ridges, Wireframe Ball |
| 3D & Shaders   | 49    | Helix Gallery, Depth Ribbon, Portal, Globe, Particle Morph        |
| Cursor Effects | 21    | Pigment Trail, Chroma Halo, Glyph Stream, Ribbon Trail            |
| UI & Cards     | 48    | Tumble Wall, Orbit Reel, Card Spread, Loupe Image                 |

Only 2 names overlap with Modus today (Animated List, Comparison Slider), so almost everything is new.

## Batch 1: 6 shader backgrounds (Backgrounds category)

Behavior specs written from the public one-liner and preview only.

| Modus name     | Idea                                                                                                                 | Technique                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `dot-veil`     | Grid of dots displaced into a folding 3D drape; dots shrink/brighten with depth; slow drift, pointer bends the cloth | WebGL points, vertex displacement from layered sine + noise, perspective camera |
| `radial-melt`  | Concentric color bands that melt outward like liquid                                                                 | Fragment shader, polar coords, domain-warped noise                              |
| `axial-beam`   | A bright beam through the center with soft falloff and flicker                                                       | Fragment shader, gaussian falloff along one axis, noise modulation              |
| `satin-folds`  | Smooth silky ridges with specular sheen                                                                              | Fragment shader, ridged noise as height, normal from gradient, fake light       |
| `glass-facets` | Tiled glass panes refracting a moving gradient                                                                       | Fragment shader, per-tile hash offset, refraction of a gradient field           |
| `wire-sphere`  | Rotating wireframe ball with pointer tilt                                                                            | three, line segments on icosphere, resolved theme color                         |

## Shared pieces (build first)

1. `shader-canvas` helper: mounts a WebGL canvas, resizes, pauses off-screen (IntersectionObserver), honors reduced motion, resolves `hsl(var(--token))` colors to uniforms.
2. Preview controls for each demo (speed, density, color).

## Later batches

2. Text (6): shard-type, orbit-type, ribbon-lettering, elastic-glyphs, vapor-type, glyph-tide
3. Cursor Effects, new category (5): pigment-trail, chroma-halo, glyph-stream, confetti-cursor, ribbon-trail
4. Galleries (6): helix-gallery, depth-ribbon, tumble-wall, elastic-reel, passage-gallery, orbit-reel
5. 3D orbs and image reveals (5)

## Open items

- Audit what `port-micros.js` already added and replace anything too close to react-bits source.
- Decide whether batch 6 needs `@react-three/fiber` or plain `three` is enough.
