# @modus-ui/cli

Add [Modus UI](https://modusui.kasimkazmi.com) animated React components to your project. The CLI copies each component's source into your codebase, so you own and can edit it.

## Usage

```bash
npx @modus-ui/cli add blur-text magnet
npx @modus-ui/cli list
```

## Commands

### `add <name...>`

Copies one or more components into your project and installs their npm dependencies.

- Writes `<componentsDir>/<name>.tsx`. The default directory is `src/components/ui` when the project has a `src/` folder, otherwise `components/ui`.
- Creates the `cn()` helper (`src/lib/utils.ts` or `lib/utils.ts`) if neither `lib/utils.ts` nor `src/lib/utils.ts` exists.
- Installs the dependencies your `package.json` doesn't already list (for example `framer-motion`, `clsx`, `tailwind-merge`), using pnpm, yarn, bun or npm depending on the lockfile it finds.
- Leaves existing files alone unless you pass `--overwrite`.

| Flag           | Description                                     |
| -------------- | ----------------------------------------------- |
| `--path <dir>` | Directory to write components to                |
| `--cwd <dir>`  | Project root (default: current directory)       |
| `--overwrite`  | Replace component files that already exist      |
| `--no-install` | Print the install command instead of running it |

### `list`

Lists every component, grouped by category, with a short description.

### Global flags

`-h, --help` shows help. `-v, --version` shows the version.

## Environment

| Variable       | Description                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MODUS_UI_URL` | Registry origin. Defaults to `https://modusui.kasimkazmi.com`. Handy for testing against a local dev server, for example `MODUS_UI_URL=http://localhost:3000`. |

## Requirements

- Node.js 20 or newer.
- A React project set up with Tailwind CSS and shadcn-style CSS variables (`--background`, `--foreground`, `--primary` and so on). Components are client components.
- The `@/` import alias must resolve to your source root, because components import `cn` from `@/lib/utils`.
- `framer-motion`, `clsx` and `tailwind-merge` are installed for you.

## License

MIT
