"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
  delay?: number;
}

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className,
  parentClassName,
  encryptedClassName,
  animateOn = "hover",
  delay = 0,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(true); // Start fully decrypted unless view mode
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set(text.split("").map((_, i) => i)));
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (animateOn === "view") {
      setIsDecrypted(false);
      setRevealedIndices(new Set());
    }
  }, [animateOn]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startAnimation = () => {
      let currentIteration = 0;
      let currentRevealed = new Set<number>();
      setIsDecrypted(false);

      interval = setInterval(() => {
        if (sequential) {
          const nextIndex =
            revealDirection === "start"
              ? currentRevealed.size
              : revealDirection === "end"
              ? text.length - 1 - currentRevealed.size
              : Math.floor(text.length / 2) + (currentRevealed.size % 2 === 0 ? currentRevealed.size / 2 : -(currentRevealed.size + 1) / 2);

          if (currentRevealed.size < text.length) {
            currentRevealed.add(nextIndex);
          } else {
            clearInterval(interval);
            setIsDecrypted(true);
          }
        } else {
          currentIteration++;
          if (currentIteration >= maxIterations) {
            clearInterval(interval);
            setIsDecrypted(true);
            currentRevealed = new Set(text.split("").map((_, i) => i));
          }
        }
        
        setRevealedIndices(new Set(currentRevealed));

        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (currentRevealed.has(index)) return text[index];
              if (useOriginalCharsOnly) {
                const randomChar = text[Math.floor(Math.random() * text.length)];
                return randomChar === " " ? " " : randomChar;
              }
              const randomChar = characters[Math.floor(Math.random() * characters.length)];
              return text[index] === " " ? " " : randomChar;
            })
            .join("")
        );
      }, speed);
    };

    if (animateOn === "hover" && isHovering) {
      startAnimation();
    } else if (animateOn === "view" && !hasAnimated) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(startAnimation, delay);
            setHasAnimated(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }

    return () => clearInterval(interval);
  }, [
    isHovering,
    animateOn,
    hasAnimated,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    useOriginalCharsOnly,
    characters,
    delay
  ]);

  return (
    <motion.span
      ref={containerRef}
      className={cn("inline-block whitespace-pre-wrap", parentClassName)}
      onMouseEnter={() => animateOn === "hover" && setIsHovering(true)}
      onMouseLeave={() => animateOn === "hover" && setIsHovering(false)}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText.split("").map((char, index) => {
          const isRevealed = revealedIndices.has(index) || isDecrypted;
          return (
            <span
              key={index}
              className={isRevealed ? className : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
