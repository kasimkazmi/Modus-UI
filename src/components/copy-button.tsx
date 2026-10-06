"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<
  React.HTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> {
  value: string;
}

export const CopyButton = ({ value, className, ...props }: CopyButtonProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <motion.button
      onClick={copyToClipboard}
      title={hasCopied ? "Copied!" : "Copy code"}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "relative z-10 inline-flex items-center justify-center rounded-md text-sm font-medium transition-all hover:opacity-70 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {hasCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">Copy</span>
    </motion.button>
  );
};
