"use client";

import React from "react";
import { NotchFooter } from "./notch-footer";

export function NotchFooterDemo() {
  const handleAction = () => {
    alert("Get started for free button clicked!");
  };

  return (
    <div className="flex w-full max-w-4xl items-center justify-center rounded-3xl border border-border/40 bg-background p-6">
      <NotchFooter
        title="Stop guessing about your digital experience with Modus"
        buttonText="Get started for free"
        onButtonClick={handleAction}
        className="w-full"
      />
    </div>
  );
}
