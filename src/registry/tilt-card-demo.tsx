"use client";

import React from "react";
import { TiltCard } from "./tilt-card";

export function TiltCardDemo() {
  const mockProjects = [
    {
      title: "Sleek Dashboard",
      description: "A clean and modern analytics dashboard interface designed for SaaS platforms, featuring real-time telemetry and customized layout widgets.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=800&q=80",
      tag: "SaaS",
      techStack: "Next.js, Tailwind CSS, TypeScript, Framer Motion",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      title: "Linguistic Platform",
      description: "An interactive learning application helping users master vocabulary and phonetics through immersive micro-lessons and automated quizzes.",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      tag: "Education",
      techStack: "React, CSS Modules, Firebase, Web Audio API",
      liveUrl: "https://example.com",
      caseStudyUrl: "https://example.com/case-study",
    },
    {
      title: "E-Commerce Concept",
      description: "A minimal, image-rich product grid and seamless checkout flow designed for high-end boutique brands and contemporary lookbooks.",
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
      tag: "Commerce",
      techStack: "Next.js, Tailwind CSS v4, Shopify, GSAP",
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
