"use client";

import { useEffect, useState } from "react";

/**
 * The height of the on-screen keyboard on a phone's browser, or 0 while it is hidden. It measures how
 * much of the layout viewport the visual viewport has lost, which is what the keyboard covers. It is
 * always 0 on desktop, and while the page is pinch-zoomed, because a zoom also shrinks the visual
 * viewport and would be mistaken for a keyboard.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setHeight(
        viewport.scale > 1
          ? 0
          : Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)),
      );
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}
