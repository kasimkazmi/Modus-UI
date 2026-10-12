import { Sketchbook } from "@/registry/sketchbook";

export default function SketchbookDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <Sketchbook />
    </div>
  );
}
