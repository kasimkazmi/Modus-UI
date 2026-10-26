"use client";

import * as Popover from "@radix-ui/react-popover";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  /** `avatar` is a compact round button for headers; `row` is a full-width row for the sidebar. */
  variant?: "avatar" | "row";
  className?: string;
}

const signIn = () =>
  authClient.signIn.social({ provider: "google", callbackURL: window.location.href });

export function AccountMenu({ variant = "avatar", className }: AccountMenuProps) {
  const { data: session, isPending } = authClient.useSession();
  const isRow = variant === "row";

  if (isPending) return <div className={isRow ? "h-[46px]" : "h-8 w-8"} aria-hidden />;

  if (!session) {
    return (
      <button
        onClick={signIn}
        className={cn(
          "text-sm font-medium text-foreground transition-colors hover:bg-muted",
          isRow
            ? "flex w-full items-center justify-center rounded-lg border border-border px-3 py-3"
            : "rounded-full border border-border px-4 py-1.5",
          className,
        )}
      >
        Sign in with Google
      </button>
    );
  }

  const { name, email, image } = session.user;
  const avatar = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground",
        isRow ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm",
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
    </span>
  );

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Account"
        className={cn(
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isRow
            ? "flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-muted"
            : "rounded-full",
          className,
        )}
      >
        {avatar}
        {isRow && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {name ?? email}
              </span>
              {name && (
                <span className="block truncate text-xs text-muted-foreground">{email}</span>
              )}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={isRow ? "top" : "bottom"}
          align={isRow ? "start" : "end"}
          sideOffset={8}
          className={cn(
            "z-50 rounded-xl border border-border bg-card p-2 shadow-lg",
            isRow ? "w-[var(--radix-popover-trigger-width)]" : "w-60",
          )}
        >
          {!isRow && (
            <div className="px-3 py-2">
              {name && <p className="truncate text-sm font-medium text-foreground">{name}</p>}
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          )}
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
