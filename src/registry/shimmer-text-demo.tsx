import { ShimmerText } from "./shimmer-text";

export default function ShimmerTextDemo() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-12 p-12 bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
          <ShimmerText text="✨ Introducing Modus UI v2.0" speed={2.5} />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-center tracking-tight">
          Build Interfaces <br />
          <ShimmerText 
            text="Faster Than Ever" 
            className="text-transparent" 
            baseColor="hsl(var(--muted))" 
            shimmerColor="hsl(var(--primary))" 
          />
        </h1>
      </div>
    </div>
  );
}
