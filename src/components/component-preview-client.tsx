"use client";

import React, { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { FileCode, RotateCcw, ExternalLink } from "lucide-react";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

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
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="relative w-full"
      >
        <div className="flex items-center justify-between pb-3">
          <Tabs.List className="flex items-center gap-6 border-b border-border bg-transparent p-0">
            {["preview", "code"].map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className="relative h-9 bg-transparent px-1 pb-3 pt-2 font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground capitalize"
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
        </div>

        <div className="mt-2">
          {activeTab === "preview" && (
            <Tabs.Content
              value="preview"
              forceMount
              className="relative flex items-center justify-center rounded-xl border border-border bg-white min-h-[400px] w-full overflow-hidden shadow-sm focus-visible:outline-none"
            >
              <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
                <a
                  href={`/preview/${name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn flex h-8 w-8 hover:w-auto items-center justify-center hover:justify-start rounded-md border border-[#E0DEDB] bg-white/80 px-2 text-[#605A57] backdrop-blur-sm transition-all duration-300 ease-out hover:bg-white hover:text-[#37322F] hover:px-3 hover:gap-1.5 shadow-sm active:scale-95 overflow-hidden"
                  title="Open Standalone Live Demo"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.15em] opacity-0 transition-all duration-300 ease-out group-hover/btn:max-w-[100px] group-hover/btn:opacity-100">
                    Live Preview
                  </span>
                </a>
                <button
                  onClick={() => setKey((prev) => prev + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E0DEDB] bg-white/80 text-[#605A57] backdrop-blur-sm transition-all hover:bg-white hover:text-[#37322F] shadow-sm active:scale-95"
                  title="Reset Preview"
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div
                key={key}
                className="relative z-10 w-full flex items-center justify-center transition-all duration-500 hover:scale-[1.02]"
              >
                {preview}
              </div>
            </Tabs.Content>
          )}

          {activeTab === "code" && (
            <Tabs.Content
              value="code"
              forceMount
              className="focus-visible:outline-none"
            >
              <div className="relative flex flex-col rounded-xl border border-[#37322F]/20 bg-[#1A1A16] shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-[#242421] border-b border-[#37322F]/10 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#37322F]/30">
                      <FileCode className="h-3.5 w-3.5 text-[#E0DEDB]/40" />
                    </div>
                    <span className="text-xs font-mono text-[#E0DEDB]/60 tracking-tight">
                      {filePath}
                    </span>
                  </div>
                  <CopyButton
                    value={code}
                    className="h-7 w-7 bg-transparent border-none text-[#E0DEDB]/40 hover:text-[#E0DEDB] transition-all"
                  />
                </div>

                <div className="relative max-h-[500px] overflow-auto p-6 text-[13px] font-mono leading-relaxed custom-scrollbar">
                  <div className="flex">
                    <div className="mr-6 flex flex-col text-right text-[#E0DEDB]/10 select-none min-w-[1.5rem] border-r border-[#37322F]/10 pr-4">
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
