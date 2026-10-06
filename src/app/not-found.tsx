"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoveLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      {/* Decorative Diagonal Stripes (Editorial Style) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-secondary opacity-50 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-border opacity-30 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm"
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
            className="text-foreground"
          >
            <path d="M4 20V8a4 4 0 0 1 8 0v12" />
            <path d="M12 20V8a4 4 0 0 1 8 0v12" />
          </svg>
          <span>Modus UI Component Library</span>
        </motion.div>

        <h1 className="mb-4 font-serif text-[120px] leading-none tracking-tighter text-foreground md:text-[180px]">
          Lost.
        </h1>

        <p className="mx-auto mb-12 max-w-md text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
          The page you are looking for has drifted into the void. It either never existed or has
          moved to a new destination.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/">
            <motion.button
              whileHover={{ x: -4 }}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-foreground/10 transition-all hover:opacity-90"
            >
              <MoveLeft className="h-4 w-4" />
              Return Home
            </motion.button>
          </Link>

          <Link href="/docs">
            <button className="rounded-full border border-border bg-card px-8 py-4 text-sm font-semibold text-foreground transition-all hover:bg-secondary">
              View Documentation
            </button>
          </Link>
        </div>
      </motion.div>

      <footer className="absolute bottom-12 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
        Modus UI Documentation
      </footer>
    </div>
  );
}
