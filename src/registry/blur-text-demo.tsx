import { BlurText } from "./blur-text";

export default function BlurTextDemo() {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center rounded-xl border border-border bg-background p-12">
      <BlurText
        text="Isn't this just beautiful?"
        delay={150}
        animateBy="words"
        direction="top"
        className="font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl"
      />
    </div>
  );
}
