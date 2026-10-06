<div align="center">

# Modus UI

**Animated React components with an editorial feel.**

Free, open-source components built with TypeScript, Tailwind CSS and Framer Motion. Install one with the CLI, or copy and paste the source.

[**Documentation**](#documentation) · [**Components**](#components) · [**Contributing**](#contributing)

[![CI](https://github.com/kasimkazmi/Modus-UI/actions/workflows/ci.yml/badge.svg)](https://github.com/kasimkazmi/Modus-UI/actions/workflows/ci.yml)
[![GitHub Repo stars](https://img.shields.io/github/stars/kasimkazmi/Modus-UI)](https://github.com/kasimkazmi/Modus-UI/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Why Modus UI?

Modus UI is **not** a package you import from. You own the code: add a component to your project, then change whatever you like. There's no version pinning, no wrapper API, and no waiting on a maintainer to expose a prop.

- **41 components**: navigation, actions, data display, backgrounds, typography and more
- **Copy-paste ready**: every component is a single `.tsx` file
- **Themed by your tokens**: components use Tailwind CSS variables (`bg-background`, `text-primary`), so they pick up your palette
- **Tested on every PR**: each component is rendered on desktop and mobile, with and without reduced motion

## Install a component

```bash
npx modus-ui add blur-text
```

The CLI writes the component into your project and lists the npm packages it needs. Every component page shows its own command.

To copy and paste instead, open the **Code** tab on any component page and save the file as `components/ui/<name>.tsx`. Components import `cn()` from `@/lib/utils`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Components

| Category         | Components                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Navigation**   | Liquid Tabs, Flowing Menu, Morphing Navbar, Floating Dock, Notch Footer, Process Stepper                                      |
| **Actions**      | Magnet, Magic Button, Animated Button, Pulse Button                                                                           |
| **Data Display** | Bounce Cards, Masonry Grid, Animated List, Kinetic Carousel, Expandable Showcase, Focus Card, Rotating Card, Tilt Card        |
| **Backgrounds**  | Cursor Grid, Waves, Letter Glitch, Aurora Background, Circuit Background, Grid Motion                                         |
| **Typography**   | Scroll Velocity, Text Pressure, True Focus, Gradient Text, Blur Text, Split Text, Decrypted Text, Shimmer Text, Floating Text |
| **Components**   | Scratch to Reveal, Stack, Star Border, Tilted Card, Pixel Card, Click Spark, Spotlight Card, Border Glow                      |

## Documentation

Run the site locally and open [`/docs`](http://localhost:3000/docs). Each component page has:

- A live preview with a restart button, plus a full-screen standalone preview at `/preview/<name>`
- The full source, with syntax highlighting and copy to clipboard
- CLI and manual installation steps
- Usage examples and a props table

## Local development

Requires **Node 20+** and **pnpm**.

```bash
git clone https://github.com/kasimkazmi/Modus-UI.git
cd Modus-UI
pnpm install
pnpm dev
```

The site runs at [http://localhost:3000](http://localhost:3000).

### Scripts

| Script                | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `pnpm dev`            | Start the dev server                                             |
| `pnpm build`          | Build the production site, then regenerate `public/registry/`    |
| `pnpm start`          | Serve the production build                                       |
| `pnpm lint`           | ESLint                                                           |
| `pnpm typecheck`      | TypeScript, no emit                                              |
| `pnpm format`         | Prettier, with Tailwind class sorting (`format:check` to verify) |
| `pnpm test`           | Vitest: registry integrity and coding-standard checks            |
| `pnpm test:e2e`       | Playwright: builds, serves, then runs desktop Chrome and Pixel 7 |
| `pnpm check`          | Lint, typecheck and unit tests in one go                         |
| `pnpm build:registry` | Write each component's JSON to `public/registry/` for the CLI    |

A pre-commit hook runs ESLint and Prettier on staged files.

### Quality checks

CI (`.github/workflows/ci.yml`) runs three jobs on every pull request:

1. **Lint, typecheck & test**: `tests/registry.test.ts` fails if a component is missing a demo or a doc, isn't wired into every page that lists it, or imports a package its registry entry doesn't declare. `tests/conventions.test.ts` enforces the rules in [`AGENTS.md`](AGENTS.md).
2. **Build & registry**: the registry build fails on any broken component, and the committed `public/registry/` has to match what the build produces.
3. **End-to-end**: `tests/e2e/components.spec.ts` opens every docs page and standalone preview. It fails on any console error, hydration mismatch or failed request, and when a preview's content never becomes visible, with motion on or reduced.

## Project structure

```text
src/
├── registry/
│   ├── index.ts              # Registry: name, dependencies and file for each component
│   ├── <name>.tsx            # The component users install
│   └── <name>-demo.tsx       # The demo shown in docs and previews
├── content/docs/<name>.mdx   # Documentation page for each component
├── app/
│   ├── docs/                 # Docs layout, sidebar, index and [slug] pages
│   └── preview/[name]/       # Full-screen standalone previews
├── components/               # Site UI: preview tabs, code block, copy button
└── lib/                      # Registry loader, MDX loader, cn()
scripts/build-registry.ts     # Generates public/registry/*.json
tests/                        # Vitest unit tests and Playwright e2e
```

## Contributing

Contributions are welcome. Check the [open issues](https://github.com/kasimkazmi/Modus-UI/issues) first, then:

1. Fork the repo and create a branch named `feat/<component-name>` or `fix/<what>`.
2. Follow [`COMPONENTS_GUIDE.md`](COMPONENTS_GUIDE.md) for file layout, design standards and the MDX template, and [`AGENTS.md`](AGENTS.md) for coding rules (TypeScript, Tailwind variables, `framer-motion`, `cn()`).
3. Register the component in `src/registry/index.ts`, `src/components/component-preview.tsx`, `src/app/preview/[name]/page.tsx`, `src/app/docs/components/page.tsx` and `src/app/docs/layout.tsx`. `pnpm test` tells you if you missed one.
4. Run `pnpm check` and `pnpm test:e2e` before opening a pull request. Include a screenshot or recording of the component.

## Credit

Some components take inspiration from publicly available work, including [React Bits](https://reactbits.dev) and [Magic UI](https://magicui.design), and are rewritten in TypeScript with Tailwind and Framer Motion. If you recognize your work, [open an issue](https://github.com/kasimkazmi/Modus-UI/issues) to request credit.

## Maintainer

**[Kasim Kazmi](https://github.com/kasimkazmi)**: creator and maintainer

## License

[MIT](LICENSE)
