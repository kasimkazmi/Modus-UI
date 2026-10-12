"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { registry, type RegistryItem } from "@/registry";
import { componentPrompt } from "@/lib/component-prompt";

/** Copies the AI integration prompt for one registry component. */
export function CopyPromptButton({ name, className }: { name: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const item = (registry as readonly RegistryItem[]).find((entry) => entry.name === name);
  if (!item) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(componentPrompt(item));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy prompt", err);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={copy}
      whileTap={{ scale: 0.95 }}
      title="Copy a prompt for your AI coding agent"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy prompt"}
    </motion.button>
  );
}
