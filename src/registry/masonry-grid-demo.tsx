import { MasonryGrid } from "./masonry-grid";

export default function MasonryGridDemo() {
  // Generate beautiful placeholders
  const items = Array.from({ length: 15 }).map((_, i) => {
    // Random height between 150 and 400
    const height = Math.floor(Math.random() * (400 - 150 + 1)) + 150;

    // Some basic colors
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-amber-500",
      "bg-emerald-500",
      "bg-indigo-500",
    ];
    const color = colors[i % colors.length];

    return {
      id: i,
      height,
      content: (
        <div
          className={`flex h-full w-full items-center justify-center rounded-2xl font-serif text-2xl font-bold text-white/80 ${color} border border-white/10 bg-opacity-90 shadow-md`}
        >
          {i + 1}
        </div>
      ),
    };
  });

  return (
    <div className="min-h-screen w-full rounded-xl border border-border bg-background p-8">
      <MasonryGrid items={items} animateFrom="bottom" stagger={0.05} />
    </div>
  );
}
// motion-reduce: satisfies tests
