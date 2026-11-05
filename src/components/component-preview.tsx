import React from "react";
import { getRegistryComponent } from "@/lib/registry";
import { ComponentPreviewClient } from "./component-preview-client";
import { CodeBlock } from "./code-block";
import { RegistryDemo } from "./registry-demo";

interface ComponentPreviewProps {
  name: string;
}

export const ComponentPreview = async ({ name }: ComponentPreviewProps) => {
  const component = getRegistryComponent(name);
  if (!component) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-sm font-medium text-red-500">
        Component &quot;{name}&quot; not found in the registry map.
      </div>
    );
  }

  const filePath = component.files[0] || `components/ui/${name}.tsx`;

  // An item with separate React and React Native files gets a switch between the two.
  const variants =
    component.nativeFile && component.nativeContent
      ? [
          {
            label: "React",
            preview: <RegistryDemo name={name} variant="web" />,
            code: component.content,
            filePath,
            highlightedCode: <CodeBlock code={component.content} lang="tsx" minimal={true} />,
          },
          {
            label: "React Native",
            preview: <RegistryDemo name={name} />,
            code: component.nativeContent,
            filePath: component.nativeFile,
            highlightedCode: <CodeBlock code={component.nativeContent} lang="tsx" minimal={true} />,
          },
        ]
      : undefined;

  return (
    <ComponentPreviewClient
      variants={variants}
      name={name}
      preview={<RegistryDemo name={name} />}
      code={component.content}
      filePath={filePath}
      highlightedCode={<CodeBlock code={component.content} lang="tsx" minimal={true} />}
    />
  );
};
