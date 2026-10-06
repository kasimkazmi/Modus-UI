"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export const MagicButton = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      className="rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 motion-reduce:transition-none"
    >
      Magic Button
    </motion.button>
  );
};
