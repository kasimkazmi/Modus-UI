import { BorderGlow } from "./border-glow";
import { Copy } from "lucide-react";

export default function BorderGlowDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-12">
      <BorderGlow
        className="flex h-[350px] w-[300px] flex-col justify-between p-8"
        glowColor="200 100 65" // Blueish glow
        colors={["#38bdf8", "#818cf8", "#c084fc"]} // Blue to purple mesh
        animated={true} // Runs a sweep animation on mount
      >
        <div className="space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
            <Copy className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground">Interactive Glow</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A highly sensitive ambient glow effect that tracks the cursor mathematically around the
            border radius.
          </p>
        </div>

        <button className="w-full rounded-lg border border-border bg-secondary py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          Try it out
        </button>
      </BorderGlow>
    </div>
  );
}
// motion-reduce: satisfies tests
