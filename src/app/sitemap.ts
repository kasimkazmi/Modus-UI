import type { MetadataRoute } from "next";
import { registry } from "@/registry";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/components",
    ...registry.map((item) => `/components/${item.name}`),
    "/blog",
  ];
  return paths.map((path) => ({ url: new URL(path, SITE.url).toString() }));
}
