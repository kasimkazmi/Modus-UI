"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
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
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);

    // Initial setup before animating in
    marqueeControls.set({ y: edge === "top" ? "-101%" : "101%" });
    innerControls.set({ y: edge === "top" ? "101%" : "-101%" });

    // Animate to center
    marqueeControls.start({ y: "0%", transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } });
    innerControls.start({ y: "0%", transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } });
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);

    // Animate out
    marqueeControls.start({ y: edge === "top" ? "-101%" : "101%", transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } });
    innerControls.start({ y: edge === "top" ? "101%" : "-101%", transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } });
  };

  return (
    <div
      className={cn(
        "flex-1 relative overflow-hidden text-center",
        !isFirst && "border-t border-border"
      )}
      ref={itemRef}
    >
      <a
        className="flex items-center justify-center h-full relative cursor-pointer uppercase no-underline font-semibold text-3xl md:text-5xl text-foreground"
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
      </a>
      <motion.div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-foreground text-background translate-y-[101%]"
        animate={marqueeControls}
      >
        <motion.div className="h-full w-fit flex" animate={innerControls}>
          <motion.div
            className="flex h-full w-fit"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: speed,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {/* Render 2 sets of repetitions to create seamless infinite loop */}
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex">
                {[...Array(repetitions)].map((_, idx) => (
                  <div
                    className="flex items-center flex-shrink-0"
                    key={`${setIdx}-${idx}`}
                  >
                    <span className="whitespace-nowrap uppercase font-normal text-3xl md:text-5xl leading-none px-4">
                      {text}
                    </span>
                    <div
                      className="w-[150px] md:w-[200px] h-[5vh] md:h-[7vh] my-4 mx-4 rounded-full bg-cover bg-center"
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
    <div className={cn("w-full h-full overflow-hidden bg-background", className)}>
      <nav className="flex flex-col h-full m-0 p-0">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            isFirst={idx === 0}
          />
        ))}
      </nav>
    </div>
  );
}
