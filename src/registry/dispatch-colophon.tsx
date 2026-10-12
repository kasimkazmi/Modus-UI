"use client";
// Ported from ThreeUI Community's Newsletter Footer (MIT, © 2026 Meng To).

import { useReducedMotion } from "framer-motion";
import { useState, type CSSProperties, type FormEvent } from "react";

import { cn } from "@/lib/utils";

const STYLES = `
.mnf, .mnf *, .mnf *::before, .mnf *::after { box-sizing: border-box; }
.mnf { position: relative; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden; color: hsl(var(--foreground)); background: var(--mnf-bg, hsl(var(--background))); font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; container-type: size; isolation: isolate; display: flex; flex-direction: column; justify-content: space-between; padding: clamp(18px, 6cqh, 56px) clamp(20px, 5cqw, 80px) clamp(12px, 3cqh, 24px); }
.mnf button, .mnf input { font: inherit; }
.mnf-wordmark { width: 100%; color: transparent; -webkit-text-stroke: 1px hsl(var(--primary) / 0.55); font-family: var(--font-heading), ui-serif, Georgia, serif; font-size: clamp(44px, 13.5cqw, 176px); font-style: italic; font-weight: 400; letter-spacing: -0.04em; line-height: 0.95; white-space: nowrap; }
.mnf-row { display: grid; grid-template-columns: auto 1fr minmax(0, 420px); align-items: end; gap: clamp(14px, 3cqw, 40px); padding-top: clamp(14px, 4cqh, 28px); border-top: 1px solid hsl(var(--border)); }
.mnf-mark { color: hsl(var(--primary)); font-family: var(--font-mono, ui-monospace), ui-monospace, monospace; font-size: clamp(10px, 1.3cqw, 13px); letter-spacing: 0.2em; text-transform: uppercase; }
.mnf-mark::before { content: "No. "; color: hsl(var(--muted-foreground)); }
.mnf-brand { margin: 0; color: hsl(var(--muted-foreground)); font-size: clamp(10px, 1.5cqw, 17px); line-height: 1.55; white-space: pre-line; }
.mnf-form { position: relative; display: flex; align-items: center; height: 48px; border-bottom: 1.5px solid hsl(var(--foreground)); transition: border-color 0.3s; }
.mnf-form:focus-within { border-color: hsl(var(--primary)); }
.mnf-form > svg { flex: none; margin-right: 10px; fill: none; stroke: hsl(var(--muted-foreground)); stroke-width: 1.5; pointer-events: none; transition: opacity 0.25s; }
.mnf-form input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; color: hsl(var(--foreground)); background: transparent; font-size: 14px; transition: opacity 0.25s; }
.mnf-form input::placeholder { color: hsl(var(--muted-foreground)); }
.mnf-button { position: absolute; right: 0; bottom: 6px; display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 16px; border: 0; border-radius: var(--radius, 999px); color: hsl(var(--primary-foreground)); background: hsl(var(--primary)); font-family: var(--font-mono, ui-monospace), ui-monospace, monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; transition: transform 0.2s, width 0.45s cubic-bezier(0.32,0.72,0,1); }
.mnf-button:hover { transform: translateY(-1px); }
.mnf-button:active { transform: scale(0.97); }
.mnf-button__arrow { transition: transform 0.3s; }
.mnf-button:hover .mnf-button__arrow { transform: translateX(3px); }
.mnf-form.is-success > svg, .mnf-form.is-success input { opacity: 0; }
.mnf-form.is-success { border-color: var(--mnf-accent, hsl(var(--primary))); }
.mnf-form.is-success .mnf-button { left: 0; justify-content: center; background: var(--mnf-accent, hsl(var(--primary))); }
.mnf-legal { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px clamp(12px, 1.8cqw, 24px); margin-top: clamp(10px, 3cqh, 22px); color: hsl(var(--muted-foreground)); font-family: var(--font-mono, ui-monospace), ui-monospace, monospace; font-size: clamp(8px, 1cqw, 11px); letter-spacing: 0.14em; text-transform: uppercase; }
.mnf-legal nav { display: flex; gap: clamp(12px, 2cqw, 28px); }
.mnf-legal a { color: inherit; text-decoration: none; transition: color 0.2s; }
.mnf-legal a:hover { color: hsl(var(--primary)); }
@container (max-width: 720px) {
  .mnf-row { grid-template-columns: auto 1fr; }
  .mnf-form { grid-column: 1 / -1; }
}
.mnf[data-still] *, .mnf[data-still] *::before, .mnf[data-still] *::after { animation: none !important; transition: none !important; }
`;

export interface DispatchColophonLink {
  label: string;
  href: string;
}

export interface DispatchColophonProps {
  marker?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  successLabel?: string;
  closingPhrase?: string;
  copyright?: string;
  links?: DispatchColophonLink[];
  onSubmit?: (email: string) => void;
  backgroundColor?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_LINKS: DispatchColophonLink[] = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Contact", href: "#contact" },
];

function EnvelopeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        d="M20.5 9.55v4.9c0 1.56 0 2.34-.3 2.94a2.75 2.75 0 0 1-1.21 1.21c-.6.3-1.38.3-2.94.3h-8.1c-1.56 0-2.34 0-2.94-.3a2.75 2.75 0 0 1-1.21-1.21c-.3-.6-.3-1.38-.3-2.94v-4.9c0-1.56 0-2.34.3-2.94A2.75 2.75 0 0 1 5.01 5.4c.6-.3 1.38-.3 2.94-.3h8.1c1.56 0 2.34 0 2.94.3a2.75 2.75 0 0 1 1.21 1.21c.3.6.3 1.38.3 2.94Z"
      />
      <path d="m3.55 6 6.61 5.14a3 3 0 0 0 3.68 0L20.45 6" fill="none" />
    </svg>
  );
}

export function DispatchColophon({
  marker = "01",
  description = "Letters from the studio, once a month:\nnew components, notes on craft, nothing else.",
  placeholder = "you@studio.com",
  buttonLabel = "Subscribe",
  successLabel = "On the list. Thank you.",
  closingPhrase = "Until next issue.",
  copyright = "© 2026 Modus. Set with care.",
  links = DEFAULT_LINKS,
  onSubmit,
  backgroundColor,
  accentColor,
  className,
  style,
}: DispatchColophonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [subscribed, setSubscribed] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    onSubmit?.(typeof email === "string" ? email : "");
    setSubscribed(true);
  };

  return (
    <footer
      className={cn("mnf", className)}
      data-still={prefersReducedMotion ? "" : undefined}
      style={{
        ...style,
        ...(backgroundColor && { ["--mnf-bg" as string]: backgroundColor }),
        ...(accentColor && { ["--mnf-accent" as string]: accentColor }),
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="mnf-wordmark" aria-label={closingPhrase}>
        {closingPhrase}
      </div>
      <div>
        <div className="mnf-row">
          <span className="mnf-mark">{marker}</span>
          <p className="mnf-brand">{description}</p>
          <form
            className={cn("mnf-form", subscribed && "is-success")}
            aria-label="Newsletter sign-up"
            onSubmit={submit}
          >
            <EnvelopeIcon />
            <input
              name="email"
              aria-label="Email address"
              type="email"
              placeholder={placeholder}
              required
            />
            <button className="mnf-button" type="submit">
              {subscribed ? successLabel : buttonLabel}
              {!subscribed && (
                <span className="mnf-button__arrow" aria-hidden="true">
                  →
                </span>
              )}
            </button>
          </form>
        </div>
        <div className="mnf-legal">
          <span>{copyright}</span>
          <nav aria-label="Legal">
            {links.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
