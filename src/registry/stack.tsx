"use client";

import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CardRotateProps {
  children: React.ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  disableDrag?: boolean;
  reduceMotion: boolean;
}

function CardRotate({
  children,
  onSendToBack,
  sensitivity,
  disableDrag = false,
  reduceMotion,
}: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_: any, info: any) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="absolute inset-0 cursor-pointer" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      // Reduced motion: drag still works, without the 3D tilt or spring snap-back.
      style={reduceMotion ? { x, y } : { x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      dragTransition={reduceMotion ? { bounceStiffness: 10000, bounceDamping: 100 } : undefined}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

interface StackProps {
  cards: React.ReactNode[];
  randomRotation?: boolean;
  sensitivity?: number;
  animationConfig?: { stiffness: number; damping: number };
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
  className?: string;
}

export function Stack({
  cards,
  randomRotation = false,
  sensitivity = 200,
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  className,
}: StackProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  const [stack, setStack] = useState(() => {
    return cards.map((content, index) => ({ id: index + 1, content }));
  });

  useEffect(() => {
    if (cards.length) {
      setStack(cards.map((content, index) => ({ id: index + 1, content })));
    }
  }, [cards]);

  const sendToBack = (id: number) => {
    setStack((prev) => {
      const newStack = [...prev];
      const index = newStack.findIndex((card) => card.id === id);
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };

  useEffect(() => {
    // Reduced motion: no autoplay; the user still reorders by drag or click.
    if (autoplay && !prefersReducedMotion && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);

      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, stack, isPaused, prefersReducedMotion]);

  return (
    <div
      className={cn("relative h-full w-full [perspective:600px]", className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
            reduceMotion={!!prefersReducedMotion}
          >
            <motion.div
              className="h-full w-full overflow-hidden rounded-xl shadow-lg"
              onClick={() => shouldEnableClick && sendToBack(card.id)}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: "90% 90%",
              }}
              initial={false}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: animationConfig.stiffness,
                      damping: animationConfig.damping,
                    }
              }
            >
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}
