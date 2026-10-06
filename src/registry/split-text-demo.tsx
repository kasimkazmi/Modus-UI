import { SplitText } from "./split-text";

export default function SplitTextDemo() {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-12 rounded-xl border border-border bg-background p-12">
      <SplitText
        text="The details are not the details."
        delay={0.03}
        splitType="chars"
        className="font-serif text-3xl font-semibold text-foreground md:text-5xl"
      />

      <SplitText
        text="They make the design."
        delay={0.1}
        splitType="words"
        className="font-sans text-xl tracking-tight text-muted-foreground md:text-3xl"
      />
    </div>
  );
}
