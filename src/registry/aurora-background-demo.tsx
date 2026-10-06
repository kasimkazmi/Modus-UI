import { AuroraBackground } from "./aurora-background";
import { Sparkles } from "lucide-react";

export default function AuroraBackgroundDemo() {
  return (
    <div className="w-full h-[600px] border border-border rounded-xl overflow-hidden">
      <AuroraBackground>
        <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-2xl px-4">
          <div className="p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
            Beautiful Aurora Background
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-xl drop-shadow-sm">
            Powered by Tailwind CSS and Framer Motion. Zero heavy WebGL dependencies, full native performance.
          </p>
          <button className="px-6 py-3 rounded-full bg-white text-black font-semibold tracking-tight hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            Get Started
          </button>
        </div>
      </AuroraBackground>
    </div>
  );
}
