"use client";

import { TextPressure } from "./text-pressure";

export default function TextPressureDemo() {
  return (
    <div className="flex w-full items-center justify-center p-4 bg-background min-h-[300px]">
      <div className="w-full max-w-4xl h-[200px]">
        <TextPressure
          text="Modus"
          flex={true}
          alpha={false}
          stroke={false}
          width={true}
          weight={true}
          italic={true}
          textColor="#37322F"
          minFontSize={48}
        />
      </div>
    </div>
  );
}
