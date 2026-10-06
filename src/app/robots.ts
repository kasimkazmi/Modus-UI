import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/preview/" },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
