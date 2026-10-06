# React UI Component & Documentation Pattern

All new components added to the React UI library MUST follow the **Premium Editorial Pattern** to maintain brand consistency and a premium developer experience.

## 1. File Architecture

New components are split into three distinct files to separate core logic from interactive documentation.

| File Path                      | Purpose                                                                            |
| :----------------------------- | :--------------------------------------------------------------------------------- |
| `src/registry/[name].tsx`      | **The raw UI component**. This is what users will copy/paste.                      |
| `src/registry/[name]-demo.tsx` | **The interactive demo**. Provides context (e.g., scroll containers, backgrounds). |
| `src/content/docs/[name].mdx`  | **The documentation page**. Written in MDX using standard premium layout.          |

---

## 2. Aesthetic Standards

React UI follows a high-end, editorial aesthetic.

- **Headlines**: Use `Instrument Serif` (or `font-serif`).
- **Body**: Use `DM Sans` (or `font-sans`) with warm neutrals.
- **Colors**: Monochrome warm palette (`#37322F` for text, `#FAF9F7` for backgrounds).
- **Spacing**: Generous whitespace. Avoid tight margins or cluttered layouts.

---

## 3. Documentation Pattern (MDX)

Every documentation page in `src/content/docs/` must follow this exact structure:

````md
---
title: [Component Name]
description: [One sentence description of the component's role]
---

[2-3 sentence overview of why this component is useful and its key personality.]

<ComponentPreview name="[slug]" />

## Installation

### CLI

\```bash
npx modus-ui add [slug]
\```

### Manual

1. Copy the code from the component tab.
2. Create a file at `components/ui/[slug].tsx`.
3. Paste the code.

## Usage

\```tsx
import { [ComponentName] } from "@/components/ui/[slug]";

export default function Example() {
return <[ComponentName] />;
}
\```

## Props

| Prop       | Type        | Default | Description   |
| :--------- | :---------- | :------ | :------------ |
| `children` | `ReactNode` | -       | [Description] |
````

---

## 4. Preview & Demo Standards

Don't use the raw component directly in the preview if it requires context.

- **Small Elements (Buttons, Icons)**: Use a centered demo wrapper with `min-h-[400px] flex items-center justify-center p-12`.
- **Large Elements (Navbars, Docks)**: Use a contextual wrapper (e.g., a scrollable container with dummy content for Navbars).
- **3D Elements (Cards)**: Ensure the demo has `perspective` classes enabled.

---

## 5. Registration Protocol

To make the component live, you must:

1. **Register** in `src/registry/index.ts`: Add an entry to the `registry` array with dependencies and file paths.
2. **Map** in `src/components/component-preview.tsx`: Import the **Demo** component and add it to the `COMPONENT_MAP`.
3. **Navigate** in `src/app/docs/layout.tsx`: Add the item to the appropriate `DOC_CATEGORIES` list.

---

## 6. Code Block Aesthetic

The code blocks are automatically transformed into a "Dark Editor" look. Do NOT wrap `CodeBlock` manually in documentation; the MDX renderer handles this. Ensure the `CopyButton` is functional and tooltips are using the native browser `title` attribute.
