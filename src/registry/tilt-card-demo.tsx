"use client";

import React from "react";
import { TiltCard } from "./tilt-card";

export function TiltCardDemo() {
  const mockProjects = [
    {
      title: "AlphaAuctions",
      description: "A premium, real-time online auction and bidding platform. Features live bidding rooms, instant notifications, and secure payments.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=800&q=80",
      tag: "Web",
      techStack: "Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Socket.io",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      title: "Français Pro",
      description: "A comprehensive French learning app that helps you learn French with a focus on grammar, pronunciation, and vocabulary building.",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      tag: "Mobile",
      techStack: "Next.js, TypeScript, Tailwind CSS, Firebase, Twilio",
      liveUrl: "https://example.com",
      caseStudyUrl: "https://example.com/case-study",
    },
    {
      title: "WestSecure",
      description: "A modern, SEO-optimized landing page for WestSecure Services Inc., a Canadian private security and threat management firm.",
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
      tag: "Design",
      techStack: "Next.js, TypeScript, React 19, Tailwind CSS v4, Firebase, Twilio, GSAP",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
  ];

  return (
    <div className="min-h-[500px] py-12 flex flex-col items-center justify-center gap-8 bg-[#FAF9F7]/30">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl px-4">
        {mockProjects.map((project, idx) => (
          <TiltCard
            key={idx}
            title={project.title}
            description={project.description}
            image={project.image}
            tag={project.tag}
            techStack={project.techStack}
            liveUrl={project.liveUrl}
            githubUrl={project.githubUrl}
            caseStudyUrl={project.caseStudyUrl}
            className="bg-white"
          />
        ))}
      </div>
      <p className="text-xs text-[#605A57]/60 italic font-sans mt-4">
        * Hover to experience physics-based 3D tilt interaction. Mobile users see stable static view.
      </p>
    </div>
  );
}
