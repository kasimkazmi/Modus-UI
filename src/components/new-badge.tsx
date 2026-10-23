import { cn } from "@/lib/utils";

/** Marks a component published in the last 30 days. */
export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold uppercase leading-4 tracking-wider text-primary",
        className,
      )}
    >
      New
    </span>
  );
}
