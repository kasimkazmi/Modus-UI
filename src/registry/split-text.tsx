"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitType?: "chars" | "words" | "lines";
  threshold?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  as?: React.ElementType;
}

export function SplitText({
  text,
  className,
  delay = 0.05,
  duration = 0.5,
  splitType = "chars",
  threshold = 0.1,
  textAlign = "center",
  as: Tag = "p",
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: [0.25, 0.1, 0.25, 1] as any },
    },
  };

  const renderContent = () => {
    if (splitType === "words") {
      const words = text.split(" ");
      return words.map((word, i) => (
        <motion.span key={i} variants={itemVariants} className="inline-block whitespace-pre">
          {word}
          {i !== words.length - 1 ? " " : ""}
        </motion.span>
      ));
    }

    if (splitType === "chars") {
      const words = text.split(" ");
      return words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-pre">
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              variants={itemVariants}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          {wordIndex !== words.length - 1 ? " " : ""}
        </span>
      ));
    }

    // Lines are a bit tricky without JS width measurement,
    // but splitting by newline is a good fallback.
    const lines = text.split("\n");
    return lines.map((line, i) => (
      <motion.div key={i} variants={itemVariants} className="block">
        {line}
      </motion.div>
    ));
  };

  const MotionTag = motion.create(Tag);

  return (
    <MotionTag
      ref={ref}
      variants={containerVariants}
      // Reduced motion: render the settled text from the first frame.
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion || inView ? "visible" : "hidden"}
      className={cn("overflow-hidden", className)}
      style={{ textAlign }}
    >
      {renderContent()}
    </MotionTag>
  );
}
