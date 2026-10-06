import { SplitText } from "./split-text";

export default function SplitTextDemo() {
  return (
    <div className="flex flex-col gap-12 w-full items-center justify-center p-12 bg-background border border-border rounded-xl min-h-[400px]">
      <SplitText
        text="The details are not the details."
        delay={0.03}
        splitType="chars"
        className="text-3xl md:text-5xl font-serif text-foreground font-semibold"
      />
      
      <SplitText
        text="They make the design."
        delay={0.1}
        splitType="words"
        className="text-xl md:text-3xl font-sans text-muted-foreground tracking-tight"
      />
    </div>
  );
}
