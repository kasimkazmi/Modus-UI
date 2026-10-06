import { TrueFocus } from "./true-focus";

export default function TrueFocusDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background p-12">
      <div className="flex flex-col gap-16">
        <TrueFocus
          sentence="Focus On What Matters"
          manualMode={false}
          blurAmount={4}
          borderColor="#38bdf8"
          animationDuration={0.6}
          pauseBetweenAnimations={1.5}
        />
        <TrueFocus
          sentence="Hover Me Manually"
          manualMode={true}
          blurAmount={6}
          borderColor="#f472b6"
          animationDuration={0.4}
        />
      </div>
    </div>
  );
}
