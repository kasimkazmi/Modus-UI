import type { MetadataRoute } from "next";
import { registry as all, type RegistryItem } from "@/registry";
import { SITE } from "@/lib/site";

const registry: readonly RegistryItem[] = all;

export default function sitemap(): MetadataRoute.Sitemap {
  const added = registry.flatMap((item) => (item.added ? [item.added] : []));
  const newest = added.sort().at(-1);
  const top = [
    { path: "/", lastModified: newest, priority: 1 },
    { path: "/components", lastModified: newest, priority: 0.9 },
    { path: "/blog", lastModified: undefined, priority: 0.5 },
  ];
  const components = registry.map((item) => ({
    path: `/components/${item.name}`,
    lastModified: item.added,
    priority: 0.7,
  }));
  return [...top, ...components].map(({ path, lastModified, priority }) => ({
    url: new URL(path, SITE.url).toString(),
    ...(lastModified ? { lastModified } : {}),
    priority,
  }));
}
