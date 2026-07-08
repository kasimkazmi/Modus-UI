"use client";

import React from "react";
import Image from "next/image";
import { Mail, Compass } from "lucide-react";

export function DeveloperCard() {
  return (
    <div className="rounded-xl border border-[#E0DEDB] bg-[#F7F5F3]/50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Title */}
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#605A57]/60">Developer</p>

      {/* Name and Buy Me A Coffee link */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <h4 className="font-serif text-2xl text-[#37322F] tracking-tight font-normal">Kasim Dev</h4>
        <a
          href="https://buymeacoffee.com/kasimdev07m"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buy me a coffee"
          title="Buy me a coffee"
          className="group/coffee inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E0DEDB] bg-white text-amber-500 transition-all hover:border-[#FFDD00] hover:bg-[#FFDD00] shadow-sm active:scale-95"
        >
          <Image
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExenhvbDVrajNocXBpb2Z2b2k4aWZ6dXRxeTZyYmh6eWc3MGM5bTJ3ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/TDQOtnWgsBx99cNoyH/giphy.gif"
            alt="Coffee cup"
            width={24}
            height={24}
            unoptimized
            className="h-6 w-6 rounded-full object-cover grayscale transition-all duration-300 group-hover/coffee:grayscale-0 group-hover/coffee:scale-110"
          />
        </a>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        <a
          href="mailto:kasimdev07@gmail.com"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[#E0DEDB] bg-white px-3 py-2 text-xs font-semibold text-[#605A57] transition-all duration-200 hover:border-[#37322F]/40 hover:text-[#37322F] hover:bg-[#FAF9F7] active:scale-[0.98]"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Connect <span className="font-normal text-[#605A57]/60">via email</span></span>
        </a>
        <a
          href="https://kasimkazmi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[#E0DEDB] bg-white px-3 py-2 text-xs font-semibold text-[#605A57] transition-all duration-200 hover:border-[#37322F]/40 hover:text-[#37322F] hover:bg-[#FAF9F7] active:scale-[0.98]"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore <span className="font-normal text-[#605A57]/60">portfolio</span></span>
        </a>
      </div>
    </div>
  );
}
