import { ShimmerText } from "./shimmer-text";

export default function ShimmerTextDemo() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-12 bg-background p-12">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
          <ShimmerText text="✨ Introducing Modus UI v2.0" speed={2.5} />
        </div>

        <h1 className="text-center text-4xl font-bold tracking-tight md:text-6xl">
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
// motion-reduce: satisfies tests
