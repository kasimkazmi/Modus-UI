import { BlurText } from "./blur-text";

export default function BlurTextDemo() {
  return (
    <div className="flex w-full items-center justify-center p-12 bg-background border border-border rounded-xl min-h-[300px]">
      <BlurText
        text="Isn't this just beautiful?"
        delay={150}
        animateBy="words"
        direction="top"
        className="text-4xl md:text-5xl font-serif text-foreground font-medium tracking-tight"
      />
    </div>
  );
}
