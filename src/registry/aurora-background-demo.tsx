import { AuroraBackground } from "./aurora-background";
import { Sparkles } from "lucide-react";

export default function AuroraBackgroundDemo() {
  return (
    <div className="h-[600px] w-full overflow-hidden rounded-xl border border-border">
      <AuroraBackground>
        <div className="flex max-w-2xl flex-col items-center justify-center space-y-6 px-4 text-center">
          <div className="rounded-full border border-white/10 bg-white/5 p-3 backdrop-blur-md">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm md:text-6xl">
            Beautiful Aurora Background
          </h2>
          <p className="max-w-xl text-lg text-white/80 drop-shadow-sm md:text-xl">
            Powered by Tailwind CSS and Framer Motion. Zero heavy WebGL dependencies, full native
            performance.
          </p>
          <button className="rounded-full bg-white px-6 py-3 font-semibold tracking-tight text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100">
            Get Started
          </button>
        </div>
      </AuroraBackground>
    </div>
  );
}
