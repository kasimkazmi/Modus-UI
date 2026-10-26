"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface FavoriteState {
  count: number;
  favorited: boolean;
}

export function FavoriteButton({ slug }: { slug: string }) {
  const { data: session } = authClient.useSession();
  const [state, setState] = useState<FavoriteState | null>(null);

  // Refetch when the session changes so `favorited` reflects whoever is signed in.
  useEffect(() => {
    fetch(`/api/components/${slug}/favorite`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setState)
      .catch(() => setState(null));
  }, [slug, session?.user.id]);

  const toggle = async () => {
    if (!session) {
      await authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
      return;
    }
    const res = await fetch(`/api/components/${slug}/favorite`, { method: "POST" });
    if (res.ok) setState(await res.json());
  };

  if (!state) return null;

  return (
    <button
      onClick={toggle}
      title={session ? "Favorite" : "Sign in with Google to favorite"}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
    >
      <Heart className={cn("h-4 w-4", state.favorited && "fill-primary text-primary")} />
      <span>{state.count}</span>
    </button>
  );
}
