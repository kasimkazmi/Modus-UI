"use client";
// A member pass whose face reflects the webcam through a brushed-metal glass filter.
import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Fingerprint, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MirrorPlateProps {
  blurStrength?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  overlayColor?: string;
  displacementStrength?: number;
  noiseScale?: number;
  specularConstant?: number;
  grayscale?: number;
  glassDistortion?: number;
  className?: string;
}

export function MirrorPlate({
  blurStrength = 12,
  color = "hsl(var(--foreground))",
  metalness = 1,
  roughness = 0.4,
  overlayColor = "hsl(var(--background) / 0.35)",
  displacementStrength = 20,
  noiseScale = 1,
  specularConstant = 1.2,
  grayscale = 1,
  glassDistortion = 0,
  className,
}: MirrorPlateProps) {
  const reduce = useReducedMotion();
  const filterId = `mirror-${useId().replace(/:/g, "")}`;
  const video = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video.current) video.current.srcObject = s;
        setLive(true);
      })
      .catch(() => setLive(false));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const blur = (blurStrength * roughness) / 2;

  return (
    <div
      className={cn(
        "relative h-[440px] w-[300px] overflow-hidden rounded-2xl border border-border shadow-xl",
        className,
      )}
      style={{
        color,
        background:
          "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--background)) 55%, hsl(var(--muted)))",
      }}
    >
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.012 * noiseScale}
            numOctaves={2}
            seed={3}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={displacementStrength + glassDistortion}
            xChannelSelector="R"
            yChannelSelector="B"
            result="glass"
          />
          <feSpecularLighting
            in="noise"
            surfaceScale={3 * metalness}
            specularConstant={specularConstant}
            specularExponent={4 + 36 * (1 - roughness)}
            lightingColor="white"
            result="shine"
          >
            <feDistantLight azimuth={225} elevation={40} />
          </feSpecularLighting>
          <feComposite in="shine" in2="SourceAlpha" operator="in" result="shineMasked" />
          <feComposite
            in="glass"
            in2="shineMasked"
            operator="arithmetic"
            k2={1}
            k3={0.35 * metalness}
          />
        </filter>
      </svg>
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-500",
          !live && "opacity-0",
        )}
        style={{ filter: `grayscale(${grayscale}) blur(${blur}px) url(#${filterId})` }}
      />
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, transparent 35%, hsl(var(--background) / 0.45) 50%, transparent 65%)",
            backgroundSize: "250% 100%",
          }}
          animate={{ backgroundPosition: ["120% 0%", "-20% 0%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
        />
      )}
      <div className="absolute inset-0" style={{ background: overlayColor }} />
      <div className="relative flex h-full flex-col justify-between p-7">
        <div className="border-current/20 flex items-center justify-between border-b pb-4">
          <span className="border-current/30 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">
            <Lock className="size-3" /> Modus pass
          </span>
          <Activity className="size-5 opacity-80" />
        </div>
        <div className="text-center">
          <p className="font-serif text-3xl">Ada Moreno</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
            Studio member
          </p>
        </div>
        <div className="border-current/20 flex items-end justify-between border-t pt-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-60">Member no.</p>
            <p className="mt-1 font-mono text-sm tracking-wider">MD-0427-1188</p>
          </div>
          <Fingerprint className="size-8 opacity-70" />
        </div>
      </div>
    </div>
  );
}
