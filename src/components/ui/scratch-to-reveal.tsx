"use client";

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/utils";

interface ScratchToRevealProps {
  /** Size of the scratch area. Required. */
  width: number;
  height: number;
  /** Radius of the "coin" clearing the surface. */
  brushSize?: number;
  /** Minimum percent cleared before revealing everything. */
  threshold?: number;
  children: React.ReactNode;
  /** Optional overlay image source */
  overlayImage?: string;
  /** Fallback background color if no overlay image is provided */
  overlayColor?: string;
  className?: string;
}

export function ScratchToReveal({
  width,
  height,
  brushSize = 40,
  threshold = 0.5,
  children,
  overlayImage,
  overlayColor = "#a855f7",
  className,
}: ScratchToRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);

  // Points tracking for smooth lines
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const moveCount = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a high-density canvas for retina screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    if (overlayImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = overlayImage;
    } else {
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Add noise texture for realism if using flat color
    if (!overlayImage) {
      for (let i = 0; i < width * height * 0.05; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

  }, [width, height, overlayImage, overlayColor]);

  const clearedFraction = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return 0;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let emptyCount = 0;
    
    // Check alpha channel (every 4th value)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) emptyCount++;
    }
    
    return emptyCount / (canvas.width * canvas.height);
  };

  const finish = () => {
    if (revealed) return;
    setRevealed(true);
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = brushSize;

    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPoint.current = { x, y };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (revealed) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = event.currentTarget.getBoundingClientRect();
    scratch(event.clientX - bounds.left, event.clientY - bounds.top);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || revealed) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    scratch(event.clientX - bounds.left, event.clientY - bounds.top);

    if (++moveCount.current % 8 === 0 && clearedFraction() >= threshold) {
      finish();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    lastPoint.current = null;
    if (!revealed && clearedFraction() >= threshold) finish();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    finish();
  };

  return (
    <div
      style={{ width, height }}
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-border shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {children}
      </div>

      <motion.canvas
        ref={canvasRef}
        role="button"
        tabIndex={revealed ? -1 : 0}
        aria-label={revealed ? "Revealed" : "Scratch to reveal"}
        aria-pressed={revealed}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ width, height, touchAction: "none" }}
        animate={{ opacity: revealed ? 0 : 1, scale: revealed ? 1.06 : 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.5, ease: "easeOut" }
        }
        className={cn(
          "absolute inset-0 rounded-[inherit]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          revealed ? "pointer-events-none" : "cursor-crosshair",
        )}
      />
    </div>
  );
}
