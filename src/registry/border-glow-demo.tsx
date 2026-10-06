import { BorderGlow } from "./border-glow";
import { Copy } from "lucide-react";

export default function BorderGlowDemo() {
  return (
    <div className="flex w-full items-center justify-center p-12 min-h-[400px]">
      <BorderGlow
        className="w-[300px] h-[350px] p-8 flex flex-col justify-between"
        glowColor="200 100 65" // Blueish glow
        colors={["#38bdf8", "#818cf8", "#c084fc"]} // Blue to purple mesh
        animated={true} // Runs a sweep animation on mount
        backgroundColor="#09090b" // Dark zinc background
      >
        <div className="space-y-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <Copy className="w-4 h-4 text-zinc-400" />
          </div>
          <h3 className="text-xl font-medium text-zinc-100">Interactive Glow</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            A highly sensitive ambient glow effect that tracks the cursor mathematically around the border radius.
          </p>
        </div>
        
        <button className="w-full py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors">
          Try it out
        </button>
      </BorderGlow>
    </div>
  );
}
