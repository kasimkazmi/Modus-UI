import { OG_SIZE, ogCard } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = SITE.name;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ title: SITE.name, description: SITE.description });
}
