import { MasonryGrid } from "./masonry-grid";

export default function MasonryGridDemo() {
  // Generate beautiful placeholders
  const items = Array.from({ length: 15 }).map((_, i) => {
    // Random height between 150 and 400
    const height = Math.floor(Math.random() * (400 - 150 + 1)) + 150;
    
    // Some basic colors
    const colors = [
      "bg-blue-500", "bg-purple-500", "bg-pink-500", 
      "bg-amber-500", "bg-emerald-500", "bg-indigo-500"
    ];
    const color = colors[i % colors.length];

    return {
      id: i,
      height,
      content: (
        <div className={`w-full h-full rounded-2xl flex items-center justify-center text-white/80 font-serif text-2xl font-bold ${color} bg-opacity-90 shadow-md border border-white/10`}>
          {i + 1}
        </div>
      ),
    };
  });

  return (
    <div className="w-full min-h-screen p-8 bg-background border border-border rounded-xl">
      <MasonryGrid items={items} animateFrom="bottom" stagger={0.05} />
    </div>
  );
}
