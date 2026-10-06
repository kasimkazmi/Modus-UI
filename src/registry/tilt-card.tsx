"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
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
  const prefersReducedMotion = useReducedMotion();
  // Reduced motion: the card stays flat and does not follow the pointer.
  const shouldTilt = tiltEnabled && !prefersReducedMotion;

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
    if (!shouldTilt || !cardRef.current) return;
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
    return techStack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
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
        rotateX: shouldTilt ? rotateX : 0,
        rotateY: shouldTilt ? rotateY : 0,
      }}
      className={cn(
        "flex w-full max-w-[360px] select-none flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm transition-all duration-300 hover:shadow-md",
        className,
      )}
    >
      {children ? (
        children
      ) : (
        <div className="flex h-full flex-col gap-4" style={{ transform: "translateZ(20px)" }}>
          {/* Project Image Section */}
          {image && (
            <div className="relative h-[200px] w-full overflow-hidden rounded-xl border border-border/60 bg-card">
              <img
                src={image}
                alt={title || "Project image"}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
                loading="lazy"
              />
              {tag && (
                <span className="absolute right-3 top-3 rounded-full border border-border bg-background/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground backdrop-blur-sm">
                  {tag}
                </span>
              )}
            </div>
          )}

          {/* Heading */}
          <div className="space-y-1">
            {title && (
              <h3 className="font-serif text-2xl font-normal leading-tight text-foreground">
                {title}
              </h3>
            )}

            {/* Tech Stack Badges */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {visibleTags.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded border border-border/60 bg-card px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm"
                  >
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
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
                    className="inline-flex items-center rounded border border-border/60 bg-secondary px-2 py-0.5 text-[9px] font-bold tracking-wider text-foreground transition-colors hover:bg-background"
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
                    className="inline-flex items-center rounded border border-border/60 bg-secondary px-2 py-0.5 text-[9px] font-bold tracking-wider text-foreground transition-colors hover:bg-background"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="flex flex-grow flex-col justify-between">
              <p
                className={cn(
                  "text-xs leading-relaxed text-muted-foreground transition-all duration-300",
                  isExpanded ? "line-clamp-none" : "line-clamp-2",
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
                className="mt-1 self-start text-[10px] font-bold uppercase tracking-wider text-foreground hover:underline"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            </div>
          )}

          {/* CTAs */}
          <div className="mt-auto flex gap-2 pt-2" style={{ transform: "translateZ(10px)" }}>
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center"
              >
                <button className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-background hover:text-foreground active:scale-[0.98]">
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
                <button className="w-full rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-all duration-200 hover:border-primary/90 hover:bg-primary/90 active:scale-[0.98]">
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
                className="w-full rounded-lg border border-transparent bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground transition-all duration-200 hover:bg-destructive/90 active:scale-[0.98]"
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
