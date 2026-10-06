"use client";

import React from "react";
import Image from "next/image";
import { Mail, Compass } from "lucide-react";

export function DeveloperCard() {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Title */}
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
        Developer
      </p>

      {/* Name and Buy Me A Coffee link */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <h4 className="font-serif text-2xl font-normal tracking-tight text-foreground">
          Kasim Dev
        </h4>
        <a
          href="https://buymeacoffee.com/kasimdev07m"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buy me a coffee"
          title="Buy me a coffee"
          className="group/coffee inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-amber-500 shadow-sm transition-all hover:border-[#FFDD00] hover:bg-[#FFDD00] active:scale-95"
        >
          <Image
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExenhvbDVrajNocXBpb2Z2b2k4aWZ6dXRxeTZyYmh6eWc3MGM5bTJ3ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/TDQOtnWgsBx99cNoyH/giphy.gif"
            alt="Coffee cup"
            width={24}
            height={24}
            unoptimized
            className="h-6 w-6 rounded-full object-cover grayscale transition-all duration-300 group-hover/coffee:scale-110 group-hover/coffee:grayscale-0"
          />
        </a>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        <a
          href="mailto:kasimdev07@gmail.com"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-foreground/40 hover:bg-background hover:text-foreground active:scale-[0.98]"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>
            Connect <span className="font-normal text-muted-foreground/60">via email</span>
          </span>
        </a>
        <a
          href="https://kasimkazmi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-foreground/40 hover:bg-background hover:text-foreground active:scale-[0.98]"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>
            Explore <span className="font-normal text-muted-foreground/60">portfolio</span>
          </span>
        </a>
      </div>
    </div>
  );
}
