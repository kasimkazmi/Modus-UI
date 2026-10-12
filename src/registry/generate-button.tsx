"use client";
// Ported from ThreeUI Community's Generate Button (MIT, © 2026 Meng To).

import type { CSSProperties, MouseEventHandler } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GenerateButtonProps {
  label?: string;
  activeLabel?: string;
  hue?: number;
  buttonColor?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const STYLES = `
.modus-gen-wrap{position:relative;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;isolation:isolate}
.modus-gen{--border-radius:24px;--padding:4px;--transition:.4s;user-select:none;display:flex;justify-content:center;align-items:center;padding:.5rem 1rem;font:inherit;font-size:16px;line-height:1.5;background-color:var(--button-color);
box-shadow:inset 0px 1px 1px rgba(255,255,255,.2),inset 0px 2px 2px rgba(255,255,255,.15),inset 0px 4px 4px rgba(255,255,255,.1),inset 0px 8px 8px rgba(255,255,255,.05),inset 0px 16px 16px rgba(255,255,255,.05),0px -1px 1px rgba(0,0,0,.02),0px -2px 2px rgba(0,0,0,.03),0px -4px 4px rgba(0,0,0,.05),0px -8px 8px rgba(0,0,0,.06),0px -16px 16px rgba(0,0,0,.08);
border:solid 1px #ffffff22;border-radius:var(--border-radius);cursor:pointer;outline:none;transition:box-shadow var(--transition),border var(--transition),background-color var(--transition)}
.modus-gen::before{content:"";position:absolute;top:calc(0px - var(--padding));left:calc(0px - var(--padding));width:calc(100% + var(--padding)*2);height:calc(100% + var(--padding)*2);border-radius:calc(var(--border-radius) + var(--padding));pointer-events:none;background-image:linear-gradient(0deg,#0004,#000a);z-index:-1;transition:box-shadow var(--transition),filter var(--transition);
box-shadow:0 -8px 8px -6px #0000 inset,0 -16px 16px -8px #00000000 inset,1px 1px 1px #fff2,2px 2px 2px #fff1,-1px -1px 1px #0002,-2px -2px 2px #0001}
.modus-gen::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background-image:linear-gradient(0deg,#fff,hsl(var(--hue),100%,70%),hsla(var(--hue),100%,70%,50%),8%,transparent);background-position:0 0;opacity:0;transition:opacity var(--transition),filter var(--transition)}
.modus-gen-letter{position:relative;display:inline-block;color:#ffffff55;animation:modus-gen-letter 2s ease-in-out infinite;transition:color var(--transition),text-shadow var(--transition),opacity var(--transition)}
@keyframes modus-gen-letter{50%{text-shadow:0 0 3px #ffffff88;color:#fff}}
.modus-gen-svg{flex-grow:1;height:24px;margin-right:.5rem;fill:#e8e8e8;animation:modus-gen-flicker 2s linear infinite;animation-delay:.5s;filter:drop-shadow(0 0 2px #ffffff99);transition:fill var(--transition),filter var(--transition),opacity var(--transition)}
@keyframes modus-gen-flicker{50%{opacity:.3}}
.modus-gen-txt{position:relative;display:flex;align-items:center;min-width:6.4em}
.modus-gen-t1,.modus-gen-t2{position:absolute;word-spacing:-1em}
.modus-gen-t1{animation:modus-gen-appear 1s ease-in-out forwards}
.modus-gen-t2{opacity:0}
@keyframes modus-gen-appear{0%{opacity:0}100%{opacity:1}}
.modus-gen:focus .modus-gen-t1{animation:modus-gen-opacity .3s ease-in-out forwards;animation-delay:1s}
.modus-gen:focus .modus-gen-t2{animation:modus-gen-opacity .3s ease-in-out reverse forwards;animation-delay:1s}
@keyframes modus-gen-opacity{0%{opacity:1}100%{opacity:0}}
.modus-gen:focus .modus-gen-letter{animation:modus-gen-focused 1s ease-in-out forwards,modus-gen-letter 1.2s ease-in-out infinite}
@keyframes modus-gen-focused{0%,100%{filter:blur(0px)}50%{transform:scale(2);filter:blur(10px) brightness(150%) drop-shadow(-36px 12px 12px hsl(var(--hue),100%,70%))}}
.modus-gen:focus .modus-gen-svg{animation-duration:1.2s;animation-delay:.2s}
.modus-gen:focus::before{box-shadow:0 -8px 12px -6px #fff3 inset,0 -16px 16px -8px hsla(var(--hue),100%,70%,20%) inset,1px 1px 1px #fff3,2px 2px 2px #fff1,-1px -1px 1px #0002,-2px -2px 2px #0001}
.modus-gen:focus::after{opacity:.6;-webkit-mask-image:linear-gradient(0deg,#fff,transparent);mask-image:linear-gradient(0deg,#fff,transparent);filter:brightness(100%)}
.modus-gen:active{border:solid 1px hsla(var(--hue),100%,80%,.7);background-color:hsla(var(--hue),50%,20%,.5)}
.modus-gen:active::before{box-shadow:0 -8px 12px -6px #fffa inset,0 -16px 16px -8px hsla(var(--hue),100%,70%,.8) inset,1px 1px 1px #fff4,2px 2px 2px #fff2,-1px -1px 1px #0002,-2px -2px 2px #0001}
.modus-gen:active::after{opacity:1;-webkit-mask-image:linear-gradient(0deg,#fff,transparent);mask-image:linear-gradient(0deg,#fff,transparent);filter:brightness(200%)}
.modus-gen:active .modus-gen-letter{text-shadow:0 0 1px hsla(var(--hue),100%,90%,.9);animation:none}
.modus-gen:hover{border:solid 1px hsla(var(--hue),100%,80%,.4)}
.modus-gen:hover::before{box-shadow:0 -8px 8px -6px #fffa inset,0 -16px 16px -8px hsla(var(--hue),100%,70%,.3) inset,1px 1px 1px #fff2,2px 2px 2px #fff1,-1px -1px 1px #0002,-2px -2px 2px #0001}
.modus-gen:hover::after{opacity:1;-webkit-mask-image:linear-gradient(0deg,#fff,transparent);mask-image:linear-gradient(0deg,#fff,transparent)}
.modus-gen:hover .modus-gen-svg{fill:#fff;filter:drop-shadow(0 0 3px hsl(var(--hue),100%,70%)) drop-shadow(0 -4px 6px #0009);animation:none}
.modus-gen-still,.modus-gen-still *,.modus-gen-still::before,.modus-gen-still::after{animation:none!important;transition:none!important}
`;

function Letters({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="modus-gen-letter" style={{ animationDelay: `${i * 0.08}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

export function GenerateButton({
  label = "Generate",
  activeLabel = "Generating",
  hue = 210,
  buttonColor = "#101010",
  onClick,
  className,
}: GenerateButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={cn("modus-gen-wrap", className)}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        className={cn("modus-gen", prefersReducedMotion && "modus-gen-still")}
        style={{ "--hue": `${hue}deg`, "--button-color": buttonColor } as CSSProperties}
      >
        <svg
          className="modus-gen-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          aria-hidden="true"
        >
          <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
        <div className="modus-gen-txt">
          <div className="modus-gen-t1">
            <Letters text={label} />
          </div>
          <div className="modus-gen-t2">
            <Letters text={activeLabel} />
          </div>
        </div>
      </button>
    </div>
  );
}
