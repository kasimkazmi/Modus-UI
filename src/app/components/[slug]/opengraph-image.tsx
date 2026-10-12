import { notFound } from "next/navigation";
import { readComponentDoc } from "@/lib/agent-docs";
import { OG_SIZE, ogCard } from "@/lib/og";
import { SITE } from "@/lib/site";
import { registry } from "@/registry";

export const alt = `${SITE.name} component`;
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return registry.map((item) => ({ slug: item.name }));
}

export default function Image({ params }: { params: { slug: string } }) {
  const item = registry.find((entry) => entry.name === params.slug);
  if (!item) notFound();
  const doc = readComponentDoc(item.name);
  return ogCard({ title: doc.title, description: doc.description, eyebrow: item.category });
}
