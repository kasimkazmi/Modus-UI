"use client";

import { Stack } from "./stack";

export default function StackDemo() {
  const cards = [
    <div
      key="1"
      className="flex h-full w-full items-center justify-center rounded-2xl bg-blue-500 p-6 text-3xl font-bold text-white shadow-xl"
    >
      Card 1
    </div>,
    <div
      key="2"
      className="flex h-full w-full items-center justify-center rounded-2xl bg-emerald-500 p-6 text-3xl font-bold text-white shadow-xl"
    >
      Card 2
    </div>,
    <div
      key="3"
      className="flex h-full w-full items-center justify-center rounded-2xl bg-rose-500 p-6 text-3xl font-bold text-white shadow-xl"
    >
      Card 3
    </div>,
    <div
      key="4"
      className="flex h-full w-full items-center justify-center rounded-2xl bg-amber-500 p-6 text-3xl font-bold text-white shadow-xl"
    >
      Card 4
    </div>,
  ];

  return (
    <div className="relative flex min-h-[500px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <div className="h-[400px] w-[300px]">
        <Stack cards={cards} randomRotation={true} sensitivity={150} sendToBackOnClick={true} />
      </div>
    </div>
  );
}
