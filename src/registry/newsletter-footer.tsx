"use client";
// Ported from ThreeUI Community's Newsletter Footer (MIT, © 2026 Meng To).

import { useReducedMotion } from "framer-motion";
import { useState, type CSSProperties, type FormEvent } from "react";

import { cn } from "@/lib/utils";

const STYLES = `
.mnf, .mnf *, .mnf *::before, .mnf *::after { box-sizing: border-box; }
.mnf { position: relative; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden; color: rgba(255,255,255,0.95); background: var(--mnf-bg); font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; container-type: size; isolation: isolate; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 clamp(24px, 4.5cqw, 90px) clamp(12px, 2cqh, 24px); }
.mnf button, .mnf input { font: inherit; }
.mnf-button { position: relative; display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 32px; overflow: hidden; border: 0; border-radius: 32px; color: rgba(255,255,255,0.7); background: transparent; font-size: 14px; font-weight: 600; line-height: 1.4; cursor: pointer; }
.mnf-button::before, .mnf-button::after { position: absolute; inset: 0; border-radius: inherit; content: ""; }
.mnf-button::before { background: rgba(23,23,23,0.7); box-shadow: inset 2px 4px 16px rgba(255,255,255,0.06); -webkit-backdrop-filter: blur(50px); backdrop-filter: blur(50px); }
.mnf-button::after { z-index: 2; border: 1px solid rgba(255,255,255,0.25); opacity: 0.25; pointer-events: none; -webkit-mask-image: linear-gradient(170deg, #000, transparent 50%); mask-image: linear-gradient(170deg, #000, transparent 50%); }
.mnf-button__title { position: relative; z-index: 4; }
.mnf-button__circle { position: absolute; z-index: 3; top: calc(50% - 100px); left: calc(50% - 100px); width: 200px; height: 200px; }
.mnf-button__circle::before, .mnf-button__circle::after { position: absolute; inset: 0; border-radius: 50%; content: ""; }
.mnf-button__circle::before { background: conic-gradient(from 180deg, rgba(255,255,255,0.012) 180deg, rgba(255,255,255,0.05) 360deg); filter: blur(15px); animation: mnf-circle 3.6s linear infinite; transition: opacity 0.5s; }
.mnf-button__circle::after { inset: 30px; background: rgba(255,255,255,0.12); opacity: 0; filter: blur(5px); transform: scale(0.5); transition: opacity 0.5s, transform 0.7s; -webkit-mask-image: radial-gradient(50% 50%, #000, rgba(23,23,23,0)); mask-image: radial-gradient(50% 50%, #000, rgba(23,23,23,0)); }
.mnf-button:hover .mnf-button__circle::before { opacity: 0; }
.mnf-button:hover .mnf-button__circle::after { opacity: 1; transform: scale(1); }
.mnf-button:active { transform: scale(0.98); }
@keyframes mnf-circle { 0% { transform: translate(0) rotate(0); } 25% { transform: translateX(-30px) rotate(90deg); } 50% { transform: translate(0) rotate(180deg); } 75% { transform: translateX(30px) rotate(270deg); } 100% { transform: translate(0) rotate(360deg); } }
.mnf-row { display: flex; align-items: center; gap: 40px; margin-bottom: clamp(18px, 4.5cqh, 32px); }
.mnf-brand { display: flex; align-items: center; min-width: 0; margin-right: auto; }
.mnf-mark { display: grid; flex: none; width: clamp(32px, 4.4cqw, 56px); height: clamp(32px, 4.4cqw, 56px); margin-right: clamp(16px, 2.5cqw, 32px); border: 1px solid rgba(255,255,255,0.12); border-radius: 24%; place-items: center; background: linear-gradient(145deg, rgba(255,255,255,0.13), rgba(255,255,255,0.025)); box-shadow: inset 0 1px rgba(255,255,255,0.08), 0 14px 28px rgba(0,0,0,0.28); }
.mnf-mark span { color: rgba(255,255,255,0.82); font-size: clamp(9px, 1.1cqw, 14px); font-weight: 600; letter-spacing: -0.04em; }
.mnf-brand p { margin: 0; color: rgba(255,255,255,0.64); font-size: clamp(10px, 1.55cqw, 20px); font-weight: 300; line-height: 1.6; white-space: pre-line; }
.mnf-form { position: relative; flex: 0 1 400px; height: 60px; overflow: hidden; border-radius: 30px; background: rgba(23,23,23,0.3); }
.mnf-form::before { position: absolute; inset: 0; border: 1.5px solid rgba(255,255,255,0.02); border-radius: inherit; content: ""; pointer-events: none; -webkit-mask-image: linear-gradient(175deg, #000, transparent 50%); mask-image: linear-gradient(175deg, #000, transparent 50%); }
.mnf-form > svg { position: absolute; z-index: 1; top: 18px; left: 22px; fill: rgba(255,255,255,0.62); stroke: rgba(255,255,255,0.62); stroke-width: 1.5; pointer-events: none; transition: opacity 0.25s; }
.mnf-form input { width: 100%; height: 60px; padding: 0 164px 0 60px; border: 0; outline: 0; border-radius: 30px; color: rgba(255,255,255,0.95); background: transparent; font-size: 14px; line-height: 1.4; transition: opacity 0.25s; }
.mnf-form input::placeholder { color: rgba(255,255,255,0.5); }
.mnf-form .mnf-button { position: absolute; z-index: 2; top: 4px; right: 4px; width: 148px; padding: 0 12px; transition: width 0.45s cubic-bezier(0.32,0.72,0,1), padding 0.45s cubic-bezier(0.32,0.72,0,1); }
.mnf-ring { position: absolute; inset: -1px; border: 1px solid transparent; border-radius: 999px; opacity: 0; pointer-events: none; transition: opacity 0.3s 0.25s; }
.mnf-form.is-success > svg, .mnf-form.is-success input { opacity: 0; }
.mnf-form.is-success .mnf-button { width: calc(100% - 8px); padding: 0 20px; }
.mnf-form.is-success .mnf-ring { border-color: var(--mnf-accent); opacity: 1; }
.mnf-wordmark { width: 100%; color: rgba(248,248,248,0.055); font-size: clamp(50px, 12.7cqw, 164px); font-weight: 700; letter-spacing: -0.075em; line-height: 0.9; text-align: center; white-space: nowrap; }
.mnf-legal { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px clamp(12px, 1.8cqw, 24px); margin-top: clamp(14px, 3.9cqh, 28px); color: rgba(255,255,255,0.5); font-size: clamp(8px, 1.1cqw, 14px); line-height: 1.4; text-align: center; }
.mnf-legal a { color: rgba(255,255,255,0.64); text-decoration: none; transition: color 0.2s; }
.mnf-legal a:hover { color: #fff; }
@container (max-width: 720px) {
  .mnf { padding-inline: 18px; }
  .mnf-row { gap: 18px; }
  .mnf-form { flex-basis: 42%; height: 44px; }
  .mnf-form > svg { top: 13px; left: 14px; width: 18px; height: 18px; }
  .mnf-form input { height: 44px; padding: 0 92px 0 42px; font-size: 10px; }
  .mnf-form .mnf-button { top: 3px; right: 3px; width: 84px; height: 38px; padding: 0 8px; font-size: 10px; }
}
@container (max-height: 360px) { .mnf-row { margin-bottom: 12px; } .mnf-legal { margin-top: 10px; } }
.mnf[data-still] *, .mnf[data-still] *::before, .mnf[data-still] *::after { animation: none !important; transition: none !important; }
`;

export interface NewsletterFooterLink {
  label: string;
  href: string;
}

export interface NewsletterFooterProps {
  marker?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  successLabel?: string;
  closingPhrase?: string;
  copyright?: string;
  links?: NewsletterFooterLink[];
  onSubmit?: (email: string) => void;
  backgroundColor?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_LINKS: NewsletterFooterLink[] = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Contact", href: "#contact" },
];

function EnvelopeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 9.55v4.9c0 1.56 0 2.34-.3 2.94a2.75 2.75 0 0 1-1.21 1.21c-.6.3-1.38.3-2.94.3h-8.1c-1.56 0-2.34 0-2.94-.3a2.75 2.75 0 0 1-1.21-1.21c-.3-.6-.3-1.38-.3-2.94v-4.9c0-1.56 0-2.34.3-2.94A2.75 2.75 0 0 1 5.01 5.4c.6-.3 1.38-.3 2.94-.3h8.1c1.56 0 2.34 0 2.94.3a2.75 2.75 0 0 1 1.21 1.21c.3.6.3 1.38.3 2.94Z" />
      <path d="m3.55 6 6.61 5.14a3 3 0 0 0 3.68 0L20.45 6" fill="none" />
    </svg>
  );
}

export function NewsletterFooter({
  marker = "01",
  description = "A monthly edit of thoughtful interfaces,\npractical patterns, and new experiments.",
  placeholder = "Email for monthly notes",
  buttonLabel = "Join the list",
  successLabel = "You're subscribed",
  closingPhrase = "STAY CURIOUS",
  copyright = "© 2026. Built for thoughtful work.",
  links = DEFAULT_LINKS,
  onSubmit,
  backgroundColor = "#0a0a0a",
  accentColor = "rgba(255, 194, 61, 0.5)",
  className,
  style,
}: NewsletterFooterProps) {
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
        ["--mnf-bg" as string]: backgroundColor,
        ["--mnf-accent" as string]: accentColor,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="mnf-row">
        <div className="mnf-brand">
          <span className="mnf-mark" aria-hidden="true">
            <span>{marker}</span>
          </span>
          <p>{description}</p>
        </div>
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
            <span className="mnf-button__title">{subscribed ? successLabel : buttonLabel}</span>
            <span className="mnf-button__circle" aria-hidden="true" />
          </button>
          <span className="mnf-ring" aria-hidden="true" />
        </form>
      </div>
      <div className="mnf-wordmark" aria-label={closingPhrase}>
        {closingPhrase}
      </div>
      <div className="mnf-legal">
        <span>{copyright}</span>
        {links.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
