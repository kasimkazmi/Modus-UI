"use client";

import { TextPressure } from "./text-pressure";

export default function TextPressureDemo() {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center bg-background p-4">
      <div className="h-[200px] w-full max-w-4xl">
        <TextPressure
          text="Modus"
          flex={true}
          alpha={false}
          stroke={false}
          width={true}
          weight={true}
          italic={true}
          minFontSize={48}
        />
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
