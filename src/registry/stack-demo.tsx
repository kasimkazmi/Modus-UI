"use client";

import { Stack } from "./stack";

export default function StackDemo() {
  const cards = [
    <div key="1" className="w-full h-full bg-blue-500 flex items-center justify-center p-6 text-white text-3xl font-bold rounded-2xl shadow-xl">
      Card 1
    </div>,
    <div key="2" className="w-full h-full bg-emerald-500 flex items-center justify-center p-6 text-white text-3xl font-bold rounded-2xl shadow-xl">
      Card 2
    </div>,
    <div key="3" className="w-full h-full bg-rose-500 flex items-center justify-center p-6 text-white text-3xl font-bold rounded-2xl shadow-xl">
      Card 3
    </div>,
    <div key="4" className="w-full h-full bg-amber-500 flex items-center justify-center p-6 text-white text-3xl font-bold rounded-2xl shadow-xl">
      Card 4
    </div>,
  ];

  return (
    <div className="relative flex w-full items-center justify-center min-h-[500px] overflow-hidden rounded-xl border border-border bg-background">
      <div className="w-[300px] h-[400px]">
        <Stack
          cards={cards}
          randomRotation={true}
          sensitivity={150}
          sendToBackOnClick={true}
        />
      </div>
    </div>
  );
}
