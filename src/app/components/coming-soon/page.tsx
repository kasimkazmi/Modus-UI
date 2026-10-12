"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layout, Sparkles } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-background shadow-sm"
      >
        <Layout className="h-10 w-10 text-foreground" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 font-serif text-5xl tracking-tight text-foreground md:text-6xl"
      >
        Coming Soon
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mx-auto mb-10 max-w-md text-lg leading-relaxed text-muted-foreground"
      >
        We&apos;re currently perfecting a new set of premium layout components. Check back soon to
        see the latest additions to our library.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-foreground/40"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground/40"
        >
          <path d="M4 20V8a4 4 0 0 1 8 0v12" />
          <path d="M12 20V8a4 4 0 0 1 8 0v12" />
        </svg>
        <span>Modus UI Component Library</span>
      </motion.div>
    </div>
  );
}
