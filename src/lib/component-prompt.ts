import type { RegistryItem } from "@/registry";
import { SITE } from "@/lib/site";

/** A paste-ready prompt that tells an AI coding agent how to add one component from its exact source. */
export function componentPrompt({ name, title, category, dependencies }: RegistryItem): string {
  const packages = dependencies.filter((d) => !d.startsWith("next/"));
  return [
    `# Add ${title} from Modus UI using its exact source`,
    "",
    "You are working in an existing React + Tailwind CSS project. Install this component from the source linked below. Do not recreate it from a screenshot, the preview or its name.",
    "",
    `Component: ${title} (${category})`,
    `Target file: \`components/ui/${name}.tsx\``,
    `Docs, usage and full source (markdown): ${SITE.url}/components/${name}.md`,
    `Live preview: ${SITE.url}/preview/${name}`,
    "",
    "## Install",
    "",
    "```bash",
    `${SITE.cli} ${name}`,
    "```",
    "",
    `If the CLI is unavailable, fetch the markdown doc above, save its source to \`components/ui/${name}.tsx\` and install: ${packages.join(", ")}.`,
    "",
    "## Requirements",
    "",
    "- Read the complete source before editing. If it cannot be fetched, stop and report that instead of recreating it.",
    "- Keep the authored structure, styling, motion, interactions and responsive behaviour unchanged.",
    "- The component imports `cn()` from `@/lib/utils` (clsx + tailwind-merge). Create it if the project lacks it.",
    "- Theme colors are bare HSL channels used as `hsl(var(--primary))`. Make sure the project defines `--background`, `--foreground`, `--primary`, `--muted`, `--border` and the other tokens the source uses.",
    "- Use the usage example from the doc, then render it on a page and check it and its interactions in the browser.",
  ].join("\n");
}
