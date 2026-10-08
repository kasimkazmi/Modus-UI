"use client";

import { useEffect, useRef } from "react";
import { Fingerprint, Activity, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReflectiveCardProps {
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

export function ReflectiveCard({
  blurStrength = 12,
  color = "white",
  metalness = 1,
  roughness = 0.4,
  overlayColor = "rgba(255, 255, 255, 0.1)",
  displacementStrength = 20,
  noiseScale = 1,
  specularConstant = 1.2,
  grayscale = 1,
  glassDistortion = 0,
  className,
}: ReflectiveCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale);
  const saturation = 1 - Math.max(0, Math.min(1, grayscale));

  const cssVariables = {
    "--blur-strength": `${blurStrength}px`,
    "--metalness": metalness.toString(),
    "--roughness": roughness.toString(),
    "--overlay-color": overlayColor,
    "--text-color": color,
    "--saturation": saturation.toString(),
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "relative isolate h-[500px] w-[320px] overflow-hidden rounded-[20px] bg-[hsl(var(--background))] font-sans shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset]",
        className,
      )}
      style={cssVariables}
    >
      <svg className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden="true">
        <defs>
          <filter id="metallic-displacement" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="turbulence"
              baseFrequency={baseFrequency}
              numOctaves={2}
              result="noise"
            />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="rippled"
            />
            <feSpecularLighting
              in="noiseAlpha"
              surfaceScale={displacementStrength}
              specularConstant={specularConstant}
              specularExponent="20"
              lightingColor="hsl(var(--foreground))"
              result="light"
            >
              <fePointLight x="0" y="0" z="300" />
            </feSpecularLighting>
            <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
            <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="solidAlpha"
            />
            <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
            <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
            <feComponentTransfer in="blurredMap" result="glassMap">
              <feFuncA type="linear" slope="0.5" intercept="0" />
            </feComponentTransfer>
            <feDisplacementMap
              in="metallic-result"
              in2="glassMap"
              scale={glassDistortion}
              xChannelSelector="A"
              yChannelSelector="A"
              result="final"
            />
          </filter>
        </defs>
      </svg>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute left-0 top-0 z-0 h-full w-full scale-[1.2] -scale-x-100 object-cover opacity-90 transition-[filter] duration-300 motion-reduce:transition-none"
        style={{
          filter:
            "saturate(var(--saturation, 0)) contrast(120%) brightness(110%) blur(var(--blur-strength, 12px)) url(#metallic-displacement)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-10 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%20200%20200%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cfilter%20id%3D%27noiseFilter%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.8%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noiseFilter)%27%2F%3E%3C%2Fsvg%3E')] opacity-[var(--roughness,0.4)] mix-blend-overlay" />

      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.1)_40%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.1)_60%,rgba(255,255,255,0.3)_100%)] opacity-[var(--metalness,1)] mix-blend-overlay" />

      <div className="pointer-events-none absolute inset-0 z-20 rounded-[20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.6)_100%)] p-[1px] [mask-composite:exclude] [mask:linear-gradient(hsl(var(--foreground))_0_0)_content-box,linear-gradient(hsl(var(--foreground))_0_0)]" />

      <div className="relative z-10 flex h-full flex-col justify-between bg-[var(--overlay-color,rgba(255,255,255,0.05))] p-8 text-[var(--text-color,white)]">
        <div className="flex items-center justify-between border-b border-white/20 pb-4">
          <div className="flex items-center gap-1.5 rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold tracking-[0.1em]">
            <Lock size={14} className="opacity-80" />
            <span>SECURE ACCESS</span>
          </div>
          <Activity className="opacity-80" size={20} />
        </div>

        <div className="mb-8 flex flex-1 flex-col items-center justify-end gap-6 text-center">
          <div className="text-center">
            <h2 className="m-0 mb-2 text-2xl font-bold tracking-[0.05em] drop-shadow-md">
              ALEXANDER DOE
            </h2>
            <p className="m-0 text-xs uppercase tracking-[0.2em] opacity-70">SENIOR DEVELOPER</p>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-white/20 pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] tracking-[0.1em] opacity-60">ID NUMBER</span>
            <span className="font-mono text-sm tracking-[0.05em]">8901-2345-6789</span>
          </div>
          <div className="opacity-40">
            <Fingerprint size={32} />
          </div>
        </div>
      </div>
    </div>
  );
}
