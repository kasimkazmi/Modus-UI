"use client";

import React, { useEffect, useRef } from "react";

// Self-contained ripple class for interactive mouse effects in Kinetic design
class CircuitRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  fadeSpeed: number;
  thickness: number;
  waveOffset: number;
  waveSpeed: number;
  waveAmplitude: number;
  waveFrequency: number;
  isActive: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = 80 + Math.random() * 40;
    this.speed = 1.2 + Math.random() * 0.3;
    this.alpha = 0.5;
    this.fadeSpeed = 0.009;
    this.thickness = 1.5;
    this.waveOffset = Math.random() * Math.PI * 2;
    this.waveSpeed = 0.05 + Math.random() * 0.02;
    this.waveAmplitude = 3 + Math.random() * 2;
    this.waveFrequency = 0.02 + Math.random() * 0.01;
    this.isActive = true;
  }

  update(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    this.radius += this.speed;
    this.alpha -= this.fadeSpeed;

    if (this.alpha <= 0 || this.radius > this.maxRadius) {
      this.isActive = false;
      return;
    }

    // Ripple color is strictly Kinetic Acid Yellow: #DFE104 (223, 225, 4)
    const rippleColor = "223, 225, 4";

    for (let i = 0; i < 4; i++) {
      const circleRadius = this.radius - i * 6;
      if (circleRadius > 0) {
        const circleAlpha = this.alpha * (1 - i * 0.2) * 0.8;
        ctx.strokeStyle = `rgba(${rippleColor}, ${circleAlpha})`;
        ctx.lineWidth = this.thickness - i * 0.15;

        ctx.beginPath();
        ctx.moveTo(this.x + circleRadius, this.y);
        for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
          const waveDistortion = Math.sin(angle * this.waveFrequency + this.waveOffset) * this.waveAmplitude;
          const distortedRadius = circleRadius + waveDistortion;
          const pointX = this.x + Math.cos(angle) * distortedRadius;
          const pointY = this.y + Math.sin(angle) * distortedRadius;
          ctx.lineTo(pointX, pointY);
        }
        ctx.stroke();
      }
    }

    this.waveOffset += this.waveSpeed;
  }
}

interface CircuitTrail {
  points: { x: number; y: number }[];
  hue: number;
  startTime: number;
  growTime: number;
  holdTime: number;
  fadeTime: number;
  backSpawned: number;
  endSpawned: number;
  dead?: boolean;
}

export interface CircuitBackgroundProps {
  maxTrails?: number;
  lineColor?: string;
  circleColor?: string;
  glowStrength?: number;
  circleSize?: number;
  spawnChance?: number;
  className?: string;
}

export function CircuitBackground({
  maxTrails = 60,
  lineColor,
  circleColor,
  glowStrength = 4,
  circleSize = 4,
  spawnChance = 0.03,
  className,
}: CircuitBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rippleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailsRef = useRef<CircuitTrail[]>([]);
  const ripplesRef = useRef<CircuitRipple[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const canvas = canvasRef.current;
    const rippleCanvas = rippleCanvasRef.current;
    if (!canvas || !rippleCanvas) return;

    const ctx = canvas.getContext("2d", { alpha: true })!;
    const rippleCtx = rippleCanvas.getContext("2d", { alpha: true })!;
    const bufferCanvas = document.createElement("canvas");
    const bufferCtx = bufferCanvas.getContext("2d", { alpha: true })!;

    let W: number, H: number;
    let running = true;

    // Direct configuration matching Kinetic Design Tokens (Acid Yellow and Zinc 700)
    const resolvedLineColor = lineColor || "rgba(223, 225, 4, 0.12)";
    const resolvedCircleColor = circleColor || "rgba(223, 225, 4, 0.3)";

    const allowedAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    const turnChoices = [45, 90];

    const random = (a: number = 1, b: number = 0) => Math.random() * (a - b) + b;
    const choose = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const normalizeDegrees = (deg: number) => ((deg % 360) + 360) % 360;

    function pickTurnFrom(baseDeg: number): number {
      const candidates = new Set<number>();
      for (const turn of turnChoices) {
        const angle1 = normalizeDegrees(baseDeg + turn);
        const angle2 = normalizeDegrees(baseDeg - turn);
        if (allowedAngles.includes(angle1)) candidates.add(angle1);
        if (allowedAngles.includes(angle2)) candidates.add(angle2);
      }
      const arr = Array.from(candidates);
      return arr.length ? choose(arr) : baseDeg;
    }

    function createTrail(
      startPoint?: { x: number; y: number },
      angleDeg?: number
    ): CircuitTrail {
      const start = startPoint || {
        x: Math.random() * bufferCanvas.width,
        y: Math.random() * bufferCanvas.height,
      };
      const baseAngle = typeof angleDeg === "number" ? normalizeDegrees(angleDeg) : choose(allowedAngles);
      const baseRad = (baseAngle * Math.PI) / 180;
      
      const length1 = random(60, 100);
      const point1 = {
        x: start.x + Math.cos(baseRad) * length1,
        y: start.y + Math.sin(baseRad) * length1,
      };

      const turnAngle = pickTurnFrom(baseAngle);
      const turnRad = (turnAngle * Math.PI) / 180;
      const length2 = random(60, 120);
      const point2 = {
        x: point1.x + Math.cos(turnRad) * length2,
        y: point1.y + Math.sin(turnRad) * length2,
      };

      const length3 = random(80, 150);
      const point3 = {
        x: point2.x + Math.cos(turnRad) * length3,
        y: point2.y + Math.sin(turnRad) * length3,
      };

      return {
        points: [start, point1, point2, point3],
        hue: 55, // Fixed hue representing yellow spectrum
        startTime: performance.now(),
        growTime: random(2000, 1200),
        holdTime: random(1800, 800),
        fadeTime: 1000,
        backSpawned: 0,
        endSpawned: 0,
      };
    }

    function getTrailLength(points: { x: number; y: number }[]) {
      let length = 0;
      for (let i = 0; i < points.length - 1; i++) {
        length += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      }
      return length;
    }

    function drawCircle(x: number, y: number, radius: number, alpha: number) {
      const dpr = window.devicePixelRatio || 1;
      bufferCtx.globalCompositeOperation = "destination-out";
      bufferCtx.beginPath();
      bufferCtx.arc(x, y, radius - 1.2 * dpr, 0, Math.PI * 2);
      bufferCtx.fill();

      bufferCtx.globalCompositeOperation = "source-over";
      bufferCtx.strokeStyle = resolvedCircleColor;
      bufferCtx.lineWidth = 1.5 * dpr;
      bufferCtx.beginPath();
      bufferCtx.arc(x, y, radius, 0, Math.PI * 2);
      bufferCtx.stroke();
    }

    function drawTrail(trail: CircuitTrail, currentTime: number) {
      const elapsed = currentTime - trail.startTime;
      const totalLength = getTrailLength(trail.points);
      let alpha = 1;
      let progress = 0;

      if (elapsed < trail.growTime) {
        progress = elapsed / trail.growTime;
        alpha = progress;
      } else if (elapsed < trail.growTime + trail.holdTime) {
        progress = 1;
      } else if (elapsed < trail.growTime + trail.holdTime + trail.fadeTime) {
        progress = 1;
        alpha = 1 - (elapsed - trail.growTime - trail.holdTime) / trail.fadeTime;
      } else {
        trail.dead = true;
        return;
      }

      alpha *= 0.25;
      const drawLength = totalLength * progress;

      bufferCtx.strokeStyle = resolvedLineColor;
      bufferCtx.lineWidth = 1.2 * (window.devicePixelRatio || 1);
      bufferCtx.lineCap = "round";

      bufferCtx.shadowBlur = glowStrength * (window.devicePixelRatio || 1);
      bufferCtx.shadowColor = resolvedLineColor;

      bufferCtx.beginPath();
      bufferCtx.moveTo(trail.points[0].x, trail.points[0].y);
      let remaining = drawLength;

      for (let i = 0; i < trail.points.length - 1; i++) {
        const pointA = trail.points[i];
        const pointB = trail.points[i + 1];
        const segmentLength = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
        
        if (remaining >= segmentLength) {
          bufferCtx.lineTo(pointB.x, pointB.y);
          remaining -= segmentLength;
        } else {
          const t = remaining / segmentLength;
          bufferCtx.lineTo(
            pointA.x + (pointB.x - pointA.x) * t,
            pointA.y + (pointB.y - pointA.y) * t
          );
          break;
        }
      }
      bufferCtx.stroke();

      drawCircle(
        trail.points[0].x,
        trail.points[0].y,
        circleSize * (window.devicePixelRatio || 1),
        alpha
      );

      if (progress >= 1) {
        drawCircle(
          trail.points[3].x,
          trail.points[3].y,
          circleSize * (window.devicePixelRatio || 1),
          alpha
        );

        // Branching logic at ends
        if (!trail.endSpawned && trailsRef.current.length < maxTrails && Math.random() < 0.1) {
          trail.endSpawned = 1;
          const dx = trail.points[3].x - trail.points[2].x;
          const dy = trail.points[3].y - trail.points[2].y;
          const parentAngle = normalizeDegrees((Math.atan2(dy, dx) * 180) / Math.PI);
          const turnAngle = pickTurnFrom(parentAngle);

          if (turnAngle !== parentAngle) {
            trailsRef.current.push(createTrail(trail.points[3], turnAngle));
          }
        }
      }
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W;
      canvas!.height = H;
      rippleCanvas!.width = W;
      rippleCanvas!.height = H;
      bufferCanvas.width = W * 1.5;
      bufferCanvas.height = H * 1.5;
    }

    function animate(currentTime: number) {
      if (!running) return;

      bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
      bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

      if (Math.random() < spawnChance && trailsRef.current.length < maxTrails) {
        trailsRef.current.push(createTrail());
      }

      trailsRef.current = trailsRef.current.filter((trail) => {
        drawTrail(trail, currentTime);
        return !trail.dead;
      });

      // Render camera drift/perspective zoom
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      
      const driftX = Math.sin(currentTime * 0.0001) * 80;
      const driftY = Math.cos(currentTime * 0.00008) * 50;
      
      ctx.drawImage(
        bufferCanvas,
        -W * 0.25 + driftX,
        -H * 0.25 + driftY,
        W * 1.5,
        H * 1.5
      );

      // Ripple drawing
      rippleCtx.clearRect(0, 0, rippleCanvas!.width, rippleCanvas!.height);
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.update(rippleCtx);
        return ripple.isActive;
      });

      animationRef.current = requestAnimationFrame(animate);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() < 0.3) {
        ripplesRef.current.push(new CircuitRipple(e.clientX, e.clientY));
      }
    };

    const handleClick = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      for (let i = 0; i < 4; i++) {
        const ripple = new CircuitRipple(
          x + (Math.random() - 0.5) * 20,
          y + (Math.random() - 0.5) * 20
        );
        ripple.maxRadius = 110 + Math.random() * 40;
        ripple.speed = 1.8 + Math.random() * 0.8;
        ripplesRef.current.push(ripple);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    
    for (let i = 0; i < 3; i++) {
      trailsRef.current.push(createTrail());
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      trailsRef.current = [];
      ripplesRef.current = [];
    };
  }, [maxTrails, lineColor, circleColor, glowStrength, circleSize, spawnChance]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          backgroundColor: "#09090B",
        }}
      />
      <canvas
        ref={rippleCanvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
