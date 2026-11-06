"use client";

import { useReduceMotion } from "../use-reduce-motion";

export default function UseReduceMotionWebDemo() {
  const reduce = useReduceMotion();
  return (
    <div className="w-full max-w-sm space-y-4 p-6">
      <p className="text-sm text-muted-foreground">useReduceMotion() returned</p>
      <p aria-live="polite" className="text-3xl font-extrabold">
        {String(reduce)}
      </p>
      <div className="relative h-10 rounded-full bg-muted">
        <span
          className="absolute left-1 top-1 h-8 w-8 rounded-full bg-primary"
          style={
            reduce ? undefined : { animation: "modus-slide 1.8s ease-in-out infinite alternate" }
          }
        />
      </div>
      <style>{`@keyframes modus-slide { to { transform: translateX(14rem); } }`}</style>
      <p className="text-xs text-muted-foreground">
        The dot slides back and forth, and stays put when your system asks to reduce motion.
      </p>
    </div>
  );
}
