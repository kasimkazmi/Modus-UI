"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useReducedMotion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  link: string;
  text: string;
  image: string;
  speed?: number;
  isFirst?: boolean;
}

interface FlowingMenuProps {
  items: MenuItemProps[];
  speed?: number;
  className?: string;
}

function findClosestEdge(mouseX: number, mouseY: number, width: number, height: number) {
  const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
  const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
  return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
}

function MenuItem({ link, text, image, speed = 15, isFirst }: MenuItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [repetitions, setRepetitions] = useState(4);
  const marqueeControls = useAnimation();
  const innerControls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  // Reduced motion: the hover reveal is instant and the marquee stays still.
  const revealTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.25, 1, 0.5, 1] as const };

  useEffect(() => {
    const calculateRepetitions = () => {
      const viewportWidth = window.innerWidth;
      const contentWidth = 400; // Estimated width of a single part
      const needed = Math.ceil(viewportWidth / contentWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [text, image]);

  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );

    // Initial setup before animating in
    marqueeControls.set({ y: edge === "top" ? "-101%" : "101%" });
    innerControls.set({ y: edge === "top" ? "101%" : "-101%" });

    // Animate to center
    marqueeControls.start({ y: "0%", transition: revealTransition });
    innerControls.start({ y: "0%", transition: revealTransition });
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );

    // Animate out
    marqueeControls.start({ y: edge === "top" ? "-101%" : "101%", transition: revealTransition });
    innerControls.start({ y: edge === "top" ? "101%" : "-101%", transition: revealTransition });
  };

  return (
    <div
      className={cn(
        "relative flex-1 overflow-hidden text-center",
        !isFirst && "border-t border-border",
      )}
      ref={itemRef}
    >
      <a
        className="relative flex h-full cursor-pointer items-center justify-center text-3xl font-semibold uppercase text-foreground no-underline md:text-5xl"
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
      </a>
      <motion.div
        className="pointer-events-none absolute left-0 top-0 h-full w-full translate-y-[101%] overflow-hidden bg-foreground text-background"
        animate={marqueeControls}
      >
        <motion.div className="flex h-full w-fit" animate={innerControls}>
          <motion.div
            className="flex h-full w-fit"
            animate={prefersReducedMotion ? { x: "0%" } : { x: ["0%", "-50%"] }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: speed, ease: "linear", repeat: Infinity }
            }
          >
            {/* Render 2 sets of repetitions to create seamless infinite loop */}
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex">
                {[...Array(repetitions)].map((_, idx) => (
                  <div className="flex flex-shrink-0 items-center" key={`${setIdx}-${idx}`}>
                    <span className="whitespace-nowrap px-4 text-3xl font-normal uppercase leading-none md:text-5xl">
                      {text}
                    </span>
                    <div
                      className="mx-4 my-4 h-[5vh] w-[150px] rounded-full bg-cover bg-center md:h-[7vh] md:w-[200px]"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function FlowingMenu({ items = [], speed = 15, className }: FlowingMenuProps) {
  return (
    <div className={cn("h-full w-full overflow-hidden bg-background", className)}>
      <nav className="m-0 flex h-full flex-col p-0">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} speed={speed} isFirst={idx === 0} />
        ))}
      </nav>
    </div>
  );
}
