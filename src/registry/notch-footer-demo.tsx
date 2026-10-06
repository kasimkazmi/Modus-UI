"use client";

import React from "react";
import { NotchFooter } from "./notch-footer";

export function NotchFooterDemo() {
  const handleAction = () => {
    alert("Get started for free button clicked!");
  };

  return (
    <div className="flex w-full max-w-4xl items-center justify-center rounded-3xl border border-[#E0DEDB]/40 bg-[#FAF9F7] p-6">
      <NotchFooter
        title="Stop guessing about your digital experience with Modus"
        buttonText="Get started for free"
        onButtonClick={handleAction}
        bgColorClass="bg-[#37322F]" // Modus UI brand dark theme color
        notchFillColor="#FAF9F7" // Match the demo parent bg perfectly for seamless notched hollow effect
        className="w-full"
      />
    </div>
  );
}
