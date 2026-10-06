/* eslint-disable react/no-unescaped-entities */
import { FocusCard } from "./focus-card";

export default function FocusCardDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-8">
      <FocusCard className="w-full max-w-sm transition-transform hover:scale-[1.02]">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-xl">
            ✨
          </div>
          <h3 className="text-xl font-semibold text-foreground">Focus Card</h3>
          <p className="text-muted-foreground">
            This card features a subtle spotlight effect that follows your cursor, bringing
            attention to the elements you're hovering over.
          </p>
        </div>
      </FocusCard>
    </div>
  );
}
