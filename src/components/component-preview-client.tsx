"use client";

import React, { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { FileCode, RotateCcw, ExternalLink } from "lucide-react";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";
import { ThemePicker } from "@/components/theme-picker";

interface ComponentPreviewClientProps {
  name: string;
  preview: React.ReactNode;
  code: string;
  filePath: string;
  highlightedCode: React.ReactNode;
}

export const ComponentPreviewClient = ({
  name,
  preview,
  code,
  filePath,
  highlightedCode,
}: ComponentPreviewClientProps) => {
  const [activeTab, setActiveTab] = useState("preview");
  const [key, setKey] = useState(0);

  const handleRestart = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="group relative my-12 flex flex-col space-y-4">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="relative w-full">
        <div className="flex items-center justify-between pb-3">
          <Tabs.List className="flex items-center gap-6 border-b border-border bg-transparent p-0">
            {["preview", "code"].map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className="relative h-9 bg-transparent px-1 pb-3 pt-2 font-medium capitalize text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground"
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  />
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <ThemePicker variant="icon" />
        </div>

        <div className="mt-2">
          {activeTab === "preview" && (
            <Tabs.Content
              value="preview"
              forceMount
              // Previews always render in the original Modus design, whatever the site theme.
              data-palette="modus"
              className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-sm focus-visible:outline-none"
            >
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                <a
                  href={`/preview/${name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-border bg-card/80 px-2 text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-300 ease-out hover:w-auto hover:justify-start hover:gap-1.5 hover:bg-card hover:px-3 hover:text-foreground active:scale-95"
                  title="Open Standalone Live Demo"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.15em] opacity-0 transition-all duration-300 ease-out group-hover/btn:max-w-[100px] group-hover/btn:opacity-100">
                    Live Preview
                  </span>
                </a>
                <button
                  onClick={() => setKey((prev) => prev + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-card hover:text-foreground active:scale-95"
                  title="Reset Preview"
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div
                key={key}
                className="relative z-10 flex w-full items-center justify-center transition-all duration-500 hover:scale-[1.02]"
              >
                {preview}
              </div>
            </Tabs.Content>
          )}

          {activeTab === "code" && (
            <Tabs.Content value="code" forceMount className="focus-visible:outline-none">
              <div className="relative flex flex-col rounded-xl border border-foreground/20 bg-[#1A1A16] shadow-2xl">
                <div className="flex items-center justify-between rounded-t-xl border-b border-foreground/10 bg-[#242421] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/30">
                      <FileCode className="h-3.5 w-3.5 text-border/40" />
                    </div>
                    <span className="font-mono text-xs tracking-tight text-border/60">
                      {filePath}
                    </span>
                  </div>
                  <CopyButton
                    value={code}
                    className="h-7 w-7 border-none bg-transparent text-border/40 transition-all hover:text-border"
                  />
                </div>

                <div className="custom-scrollbar relative max-h-[500px] overflow-auto p-6 font-mono text-[13px] leading-relaxed">
                  <div className="flex">
                    <div className="mr-6 flex min-w-[1.5rem] select-none flex-col border-r border-foreground/10 pr-4 text-right text-border/10">
                      {code.split("\n").map((_, i) => (
                        <span key={i} className="block leading-relaxed">
                          {i + 1}
                        </span>
                      ))}
                    </div>
                    <div className="flex-1">{highlightedCode}</div>
                  </div>
                </div>
              </div>
            </Tabs.Content>
          )}
        </div>
      </Tabs.Root>
    </div>
  );
};
