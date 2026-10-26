"use client";

import * as Popover from "@radix-ui/react-popover";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AccountMenu({ className }: { className?: string }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="h-8 w-8" aria-hidden />;

  if (!session) {
    return (
      <button
        onClick={() =>
          authClient.signIn.social({ provider: "google", callbackURL: window.location.href })
        }
        className={cn(
          "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted",
          className,
        )}
      >
        Sign in
      </button>
    );
  }

  const { name, email, image } = session.user;

  return (
    <Popover.Root>
      <Popover.Trigger
        title={name ?? email}
        className={cn(
          "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          (name ?? email).charAt(0).toUpperCase()
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 rounded-xl border border-border bg-card p-2 shadow-lg"
        >
          <div className="px-3 py-2">
            {name && <p className="truncate text-sm font-medium text-foreground">{name}</p>}
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={() => authClient.signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
