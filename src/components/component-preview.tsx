import React from "react";
import { getRegistryComponent } from "@/lib/registry";
import { getDemo } from "@/registry/demos";
import { ComponentPreviewClient } from "./component-preview-client";
import { CodeBlock } from "./code-block";

interface ComponentPreviewProps {
  name: string;
}

export const ComponentPreview = async ({ name }: ComponentPreviewProps) => {
  const component = getRegistryComponent(name);
  const Preview = getDemo(name);

  if (!component || !Preview) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-sm font-medium text-red-500">
        Component &quot;{name}&quot; not found in the registry map.
      </div>
    );
  }

  const filePath = component.files[0] || `components/ui/${name}.tsx`;

  return (
    <ComponentPreviewClient
      name={name}
      preview={<Preview />}
      code={component.content}
      filePath={filePath}
      highlightedCode={<CodeBlock code={component.content} lang="tsx" minimal={true} />}
    />
  );
};
