"use client";

import { ProgressRing } from "./progress-ring";
import { useEffect, useState } from "react";

export default function ProgressRingDemo() {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 25));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <ProgressRing value={progress} size={140} strokeWidth={12} duration={1} />
    </div>
  );
}
