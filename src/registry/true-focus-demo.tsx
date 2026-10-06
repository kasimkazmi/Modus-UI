import { TrueFocus } from "./true-focus";

export default function TrueFocusDemo() {
  return (
    <div className="flex w-full items-center justify-center p-12 bg-background min-h-[400px]">
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
