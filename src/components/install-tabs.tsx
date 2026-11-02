"use client";

import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { SquareTerminal } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { installCommand, PACKAGE_MANAGERS, type PackageManager } from "@/lib/install";

const STORAGE_KEY = "modus-package-manager";
const CHANGE_EVENT = "modus-package-manager-change";

// The choice also lives here, so it still applies to every block on the page when storage is blocked.
let chosenThisSession: PackageManager | null = null;

function readStored(): PackageManager | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return PACKAGE_MANAGERS.find((manager) => manager === value) ?? null;
  } catch {
    return null;
  }
}

/**
 * The command that adds a component, with a tab per package manager. The choice is remembered across
 * pages and shared by every block on the page, but storage is only a convenience: it renders and
 * works with it blocked.
 */
export function InstallTabs({ name }: { name: string }) {
  const [manager, setManager] = useState<PackageManager>("npm");

  useEffect(() => {
    // Another tab changed it (storage), or another block on this page did (change event).
    const fromStorage = () => setManager(readStored() ?? chosenThisSession ?? "npm");
    const fromPage = () => setManager(chosenThisSession ?? "npm");
    fromStorage();
    window.addEventListener(CHANGE_EVENT, fromPage);
    window.addEventListener("storage", fromStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, fromPage);
      window.removeEventListener("storage", fromStorage);
    };
  }, []);

  const choose = (next: string) => {
    const chosen = PACKAGE_MANAGERS.find((m) => m === next) ?? "npm";
    chosenThisSession = chosen;
    setManager(chosen);
    try {
      window.localStorage.setItem(STORAGE_KEY, chosen);
    } catch {
      // Private window or blocked storage: the choice just applies to this page.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <Tabs.Root
      value={manager}
      onValueChange={choose}
      className="not-prose my-8 overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <SquareTerminal aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Tabs.List aria-label="Package manager" className="flex items-center gap-1">
          {PACKAGE_MANAGERS.map((m) => (
            <Tabs.Trigger
              key={m}
              value={m}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                m === manager
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <CopyButton
          value={installCommand(manager, name)}
          className="ml-auto h-8 w-8 text-muted-foreground"
        />
      </div>
      {PACKAGE_MANAGERS.map((m) => (
        <Tabs.Content key={m} value={m} className="overflow-x-auto px-4 py-4">
          <pre className="m-0 bg-transparent p-0 font-mono text-sm text-foreground">
            <code className="bg-transparent p-0 text-sm font-normal text-foreground">
              {installCommand(m, name)}
            </code>
          </pre>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
