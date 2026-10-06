"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, BookOpen, Send, Check } from "lucide-react";

export default function BlogComingSoonPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background px-6 py-12 text-foreground md:px-12 lg:px-24">
      {/* Subtle Editorial Background Elements */}
      <div className="absolute -left-4 top-0 h-96 w-96 rounded-full bg-border opacity-20 mix-blend-multiply blur-[128px] filter" />
      <div className="absolute -right-4 bottom-0 h-[32rem] w-[32rem] rounded-full bg-secondary opacity-30 mix-blend-multiply blur-[128px] filter" />

      {/* Top Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Return Home</span>
        </Link>

        <Link
          href="/docs"
          className="flex items-center gap-2 font-serif text-sm italic text-foreground transition-colors hover:text-foreground/80"
        >
          <span>Modus Library</span>
        </Link>
      </header>

      {/* Main Editorial Hero */}
      <div className="relative z-10 mx-auto my-auto flex w-full max-w-[700px] flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm"
        >
          <BookOpen className="h-7 w-7 text-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 inline-flex items-center space-x-2 rounded-full border border-border bg-card/50 px-3.5 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary/60" />
          <span className="uppercase tracking-[0.1em]">Modus Journal</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 font-serif text-5xl font-normal tracking-tight text-foreground md:text-7xl"
        >
          Writing in <span className="font-normal italic">Restraint</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mb-12 max-w-md text-base font-medium leading-relaxed text-muted-foreground md:text-lg"
        >
          A curated publication on advanced design systems, visual semantics, and typographic
          precision. Launching shortly.
        </motion.p>

        {/* Premium Subscription Mock */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card/40 p-6 shadow-sm backdrop-blur-md"
        >
          <h5 className="mb-2 font-serif text-lg font-normal text-foreground">
            Subscribe to first release
          </h5>
          <p className="mb-4 text-xs text-muted-foreground">
            No spam. Only deep technical essays on UI restraint.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-3 text-sm font-semibold text-emerald-600">
              <Check className="h-4 w-4" />
              <span>You are on the list. Thank you.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-foreground placeholder-muted-foreground/40 transition-all focus:border-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95"
              >
                <Send className="h-3 w-3" />
                <span>Join</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* Footer Signature */}
      <footer className="relative z-10 mx-auto mt-12 w-full max-w-[1200px] text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40"
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
          <span>Modus UI Publishing</span>
        </motion.div>
      </footer>
    </main>
  );
}
