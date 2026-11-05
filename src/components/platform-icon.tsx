import { Globe, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComponentPlatform = "web" | "native" | "both";

const LABELS: Record<ComponentPlatform, string> = {
  web: "Web",
  native: "React Native",
  both: "React and React Native",
};

/** A small icon telling web components (globe) from React Native ones (phone). */
export function PlatformIcon({
  platform,
  className,
}: {
  platform: ComponentPlatform;
  className?: string;
}) {
  const icons =
    platform === "both" ? [Globe, Smartphone] : [platform === "native" ? Smartphone : Globe];
  return (
    <span
      role="img"
      aria-label={LABELS[platform]}
      title={LABELS[platform]}
      className="flex shrink-0 gap-0.5"
    >
      {icons.map((Icon, i) => (
        <Icon
          key={i}
          aria-hidden
          className={cn("h-3.5 w-3.5 text-muted-foreground/70", className)}
        />
      ))}
    </span>
  );
}

/** Icon and name together, for the top of a component's page. */
export function PlatformBadge({ platform }: { platform: ComponentPlatform }) {
  const icons =
    platform === "both" ? [Globe, Smartphone] : [platform === "native" ? Smartphone : Globe];
  const text = {
    web: "Web (React)",
    native: "React Native (Expo)",
    both: "React and React Native",
  }[platform];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {icons.map((Icon, i) => (
        <Icon key={i} aria-hidden className="h-3.5 w-3.5" />
      ))}
      {text}
    </span>
  );
}
