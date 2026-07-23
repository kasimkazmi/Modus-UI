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
  maxTilt = 15,
  perspective = 1000,
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

  const rotateXSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateYSpring = useSpring(x, { stiffness: 150, damping: 20 });

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
        perspective: perspective,
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
      }}
      className={cn(
        "w-full max-w-[360px] rounded-2xl border border-[#E0DEDB] bg-[#F7F5F3] p-5 shadow-sm transition-all duration-300 hover:shadow-md select-none flex flex-col justify-between overflow-hidden",
        className
      )}
    >
      {children ? (
        children
      ) : (
        <div className="flex flex-col h-full gap-4" style={{ transform: "translateZ(20px)" }}>
          {/* Project Image Section */}
          {image && (
            <div className="relative w-full h-[200px] overflow-hidden rounded-xl border border-[#E0DEDB]/60 bg-white">
              <img
                src={image}
                alt={title || "Project image"}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
              {tag && (
                <span className="absolute right-3 top-3 rounded-full border border-[#E0DEDB] bg-[#FAF9F7]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#605A57] backdrop-blur-sm">
                  {tag}
                </span>
              )}
            </div>
          )}

          {/* Heading */}
          <div className="space-y-1">
            {title && (
              <h3 className="font-serif text-2xl font-normal leading-tight text-[#37322F]">
                {title}
              </h3>
            )}

            {/* Tech Stack Badges */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {visibleTags.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded border border-[#E0DEDB]/60 bg-white px-2 py-0.5 text-[9px] font-semibold tracking-wider text-[#605A57] shadow-sm uppercase"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#605A57]/40" />
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
                    className="inline-flex items-center rounded border border-[#E0DEDB]/60 bg-[#F0EDEA] hover:bg-[#FAF9F7] px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#37322F] transition-colors"
                  >
                    +{remainingTags} more
                  </button>
                )}
                {isTechExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTechExpanded(false);
                    }}
                    className="inline-flex items-center rounded border border-[#E0DEDB]/60 bg-[#F0EDEA] hover:bg-[#FAF9F7] px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#37322F] transition-colors"
                  >
                    Show less
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
                  "text-xs leading-relaxed text-[#605A57] transition-all duration-300",
                  isExpanded ? "line-clamp-none" : "line-clamp-2"
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
                className="mt-1 self-start text-[10px] font-bold uppercase tracking-wider text-[#37322F] hover:underline"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-2 pt-2 mt-auto" style={{ transform: "translateZ(10px)" }}>
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center"
              >
                <button className="w-full rounded-lg border border-[#E0DEDB] bg-white px-3 py-2 text-xs font-bold text-[#605A57] transition-all duration-200 hover:border-[#37322F]/40 hover:text-[#37322F] hover:bg-[#FAF9F7] active:scale-[0.98]">
                  Preview
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
                <button className="w-full rounded-lg border border-[#37322F] bg-[#37322F] px-3 py-2 text-xs font-bold text-[#FAF9F7] transition-all duration-200 hover:bg-[#4A4542] hover:border-[#4A4542] active:scale-[0.98]">
                  GitHub
                </button>
              </a>
            )}

            {(caseStudyUrl || onCaseStudyClick) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCaseStudyClick) onCaseStudyClick();
                  else if (caseStudyUrl) window.open(caseStudyUrl, "_blank");
                }}
                className="w-full rounded-lg border border-transparent bg-[#8B3A30] px-3 py-2 text-xs font-bold text-[#FAF9F7] transition-all duration-200 hover:bg-[#A84A3E] active:scale-[0.98]"
              >
                Case Study
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
