"use client";

import { getDemo } from "@/registry/demos";

/**
 * Renders a component's demo by name. The lookup runs on the client so a server page references only
 * this component, and each demo stays in its own lazily loaded chunk instead of every page's bundle.
 */
export function RegistryDemo({ name }: { name: string }) {
  const Demo = getDemo(name);
  return Demo ? <Demo /> : null;
}
