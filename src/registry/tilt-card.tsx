"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TiltCardProps {
  title?: string;
  description?: string;
  image?: string;
  tag?: string;
  techStack?: string | string[];
  liveUrl?: string;
  githubUrl?: string;
  caseStudyUrl?: string;
  onCaseStudyClick?: () => void;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  index?: number;
  children?: React.ReactNode;
}

export function TiltCard({
  title,
  description,
  image,
  tag,
  techStack,
  liveUrl,
  githubUrl,
  caseStudyUrl,
  onCaseStudyClick,
  className,
  maxTilt = 12,
  perspective = 1000,
  index,
  children,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltEnabled, setTiltEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTechExpanded, setIsTechExpanded] = useState(false);

  // Disable tilt on mobile/tablets for better UX
  useEffect(() => {
    const checkScreenSize = () => {
      setTiltEnabled(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXSpring = useSpring(y, { stiffness: 180, damping: 22 });
  const rotateYSpring = useSpring(x, { stiffness: 180, damping: 22 });

  const rotateX = useTransform(rotateXSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(rotateYSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const relativeX = (event.clientX - rect.left) / width - 0.5;
    const relativeY = (event.clientY - rect.top) / height - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Process tech stack tags
  const tags: string[] = React.useMemo(() => {
    if (!techStack) return [];
    if (Array.isArray(techStack)) return techStack;
    return techStack.split(",").map((t) => t.trim()).filter(Boolean);
  }, [techStack]);

  const maxVisibleTags = 4;
  const hasMoreTags = tags.length > maxVisibleTags;
  const visibleTags = isTechExpanded ? tags : tags.slice(0, maxVisibleTags);
  const remainingTags = tags.length - maxVisibleTags;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transformPerspective: perspective,
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
      }}
      className={cn(
        "w-full max-w-[360px] rounded-none border-2 border-[#3F3F46] bg-[#09090B] p-6 shadow-none transition-colors duration-300 hover:bg-[#DFE104] hover:border-[#DFE104] select-none flex flex-col justify-between overflow-hidden relative group",
        className
      )}
    >
      {/* Decorative Giant Number for Kinetic Design */}
      {index !== undefined && (
        <div 
          className="absolute -right-4 -bottom-6 text-[11rem] font-bold tracking-tighter select-none pointer-events-none leading-none text-[#27272A] opacity-20 group-hover:text-[#000000]/10 transition-colors duration-300 z-0 font-sans"
          aria-hidden="true"
        >
          {String(index).padStart(2, "0")}
        </div>
      )}

      {children ? (
        <div className="relative z-10">{children}</div>
      ) : (
        <div className="flex flex-col h-full gap-5 relative z-10" style={{ transform: "translateZ(30px)" }}>
          {/* Cover Image Section */}
          {image && (
            <div className="relative w-full h-[180px] overflow-hidden rounded-none border border-[#3F3F46] bg-black">
              <img
                src={image}
                alt={title || "Cover"}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
              {tag && (
                <span className="absolute right-3 top-3 rounded-none border-2 border-[#3F3F46] bg-[#09090B] px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#FAFAFA] group-hover:bg-[#FAFAFA] group-hover:text-black group-hover:border-black transition-colors duration-300">
                  {tag}
                </span>
              )}
            </div>
          )}

          {/* Heading and Tags */}
          <div className="space-y-2">
            {title && (
              <h3 className="font-sans text-3xl font-bold uppercase tracking-tighter leading-none text-[#FAFAFA] group-hover:text-[#000000] transition-colors duration-300">
                {title}
              </h3>
            )}

            {/* Tech Badges */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {visibleTags.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-none border border-[#3F3F46] bg-black/40 px-2 py-0.5 text-[8px] font-bold tracking-widest text-[#A1A1AA] uppercase group-hover:border-black group-hover:bg-black/10 group-hover:text-black transition-colors duration-300"
                  >
                    {tech}
                  </span>
                ))}
                {hasMoreTags && !isTechExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTechExpanded(true);
                    }}
                    className="inline-flex items-center rounded-none border border-[#3F3F46] bg-[#27272A] hover:bg-[#3F3F46] px-2 py-0.5 text-[8px] font-bold tracking-widest text-[#FAFAFA] transition-colors group-hover:border-black group-hover:bg-black/20 group-hover:text-black"
                  >
                    +{remainingTags}
                  </button>
                )}
                {isTechExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTechExpanded(false);
                    }}
                    className="inline-flex items-center rounded-none border border-[#3F3F46] bg-[#27272A] hover:bg-[#3F3F46] px-2 py-0.5 text-[8px] font-bold tracking-widest text-[#FAFAFA] transition-colors group-hover:border-black group-hover:bg-black/20 group-hover:text-black"
                  >
                    LESS
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="flex-grow flex flex-col justify-between">
              <p
                className={cn(
                  "text-xs leading-relaxed text-[#A1A1AA] group-hover:text-black/80 transition-colors duration-300",
                  isExpanded ? "line-clamp-none" : "line-clamp-3"
                )}
              >
                {description}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="mt-2 self-start text-[9px] font-bold uppercase tracking-widest text-[#DFE104] group-hover:text-[#000000] hover:underline transition-colors duration-300"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-2 mt-auto" style={{ transform: "translateZ(15px)" }}>
            <div className="flex gap-2">
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center"
                >
                  <button className="w-full h-11 rounded-none border-2 border-[#3F3F46] bg-transparent text-xs font-bold uppercase tracking-tighter text-[#FAFAFA] transition-all duration-200 hover:bg-[#FAFAFA] hover:text-[#000000] hover:border-[#FAFAFA] group-hover:border-black group-hover:text-black group-hover:hover:bg-black group-hover:hover:text-white group-hover:hover:border-black active:scale-95">
                    PREVIEW
                  </button>
                </a>
              )}

              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center"
                >
                  <button className="w-full h-11 rounded-none bg-[#FAFAFA] text-xs font-bold uppercase tracking-tighter text-black transition-all duration-200 hover:scale-105 active:scale-95 group-hover:bg-black group-hover:text-[#DFE104]">
                    GITHUB
                  </button>
                </a>
              )}
            </div>

            {(caseStudyUrl || onCaseStudyClick) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCaseStudyClick) onCaseStudyClick();
                  else if (caseStudyUrl) window.open(caseStudyUrl, "_blank");
                }}
                className="w-full h-11 rounded-none border-2 border-[#DFE104] bg-[#DFE104] text-xs font-bold uppercase tracking-tighter text-black transition-all duration-200 hover:scale-105 active:scale-95 group-hover:bg-black group-hover:text-white group-hover:border-black"
              >
                CASE STUDY
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
