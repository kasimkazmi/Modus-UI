"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

export function Comments({ slug }: { slug: string }) {
  const { data: session } = authClient.useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/components/${slug}/comments`);
    if (res.ok) setComments((await res.json()).comments);
  }, [slug]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const res = await fetch(`/api/components/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Couldn't post comment");
      return;
    }
    setDraft("");
    await load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/components/${slug}/comments?id=${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  return (
    <section id="comments" className="mt-24">
      <h2 className="mb-6 border-b border-border pb-3 font-serif text-2xl tracking-tight">
        Comments
      </h2>

      {session ? (
        <form onSubmit={submit} className="mb-10 space-y-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Share feedback or a question about this component"
            className="w-full rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            Post comment
          </button>
        </form>
      ) : (
        <button
          onClick={() =>
            authClient.signIn.social({ provider: "google", callbackURL: window.location.href })
          }
          className="mb-10 text-sm text-primary hover:underline"
        >
          Sign in with Google to comment
        </button>
      )}

      <ul className="space-y-6">
        {comments.map((comment) => (
          <li key={comment.id}>
            <div className="mb-1 flex items-center gap-3 text-sm">
              <span className="font-medium text-foreground">
                {comment.user.name ?? "Anonymous"}
              </span>
              <span className="text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
              {session?.user.id === comment.user.id && (
                <button
                  onClick={() => remove(comment.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {comment.body}
            </p>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-muted-foreground">No comments yet.</li>
        )}
      </ul>
    </section>
  );
}
