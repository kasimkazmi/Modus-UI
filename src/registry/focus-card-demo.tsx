/* eslint-disable react/no-unescaped-entities */
import { FocusCard } from "./focus-card";

export default function FocusCardDemo() {
  return (
    <div className="flex w-full items-center justify-center p-8">
      <FocusCard className="w-full max-w-sm transition-transform hover:scale-[1.02]">
        <div className="flex flex-col gap-4 relative z-10">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
            ✨
          </div>
          <h3 className="text-xl font-semibold text-foreground">Focus Card</h3>
          <p className="text-muted-foreground">
            This card features a subtle spotlight effect that follows your cursor, 
            bringing attention to the elements you're hovering over.
          </p>
        </div>
      </FocusCard>
    </div>
  );
}
