"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  baseX: number;
  baseY: number;
  hue: number;
  speed: number;
  angle: number;
}

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const COUNT = width < 640 ? 46 : 90;
    const palette = [252, 262, 178, 40]; // hue values: violet, indigo, teal, gold
    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        r: Math.random() * 1.6 + 0.4,
        hue: palette[Math.floor(Math.random() * palette.length)],
        speed: Math.random() * 0.35 + 0.08,
        angle: Math.random() * Math.PI * 2,
      };
    });

    function onPointer(clientX: number, clientY: number) {
      pointer.current.x = clientX;
      pointer.current.y = clientY;
      pointer.current.active = true;
    }

    const mouseHandler = (e: MouseEvent) => onPointer(e.clientX, e.clientY);
    const touchHandler = (e: TouchEvent) => {
      if (e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", mouseHandler, { passive: true });
    window.addEventListener("touchmove", touchHandler, { passive: true });

    let raf = 0;
    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // soft radial glows
      const g1 = ctx!.createRadialGradient(
        width * 0.2,
        height * 0.15,
        0,
        width * 0.2,
        height * 0.15,
        width * 0.55
      );
      g1.addColorStop(0, "rgba(123,92,255,0.16)");
      g1.addColorStop(1, "rgba(123,92,255,0)");
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, width, height);

      const g2 = ctx!.createRadialGradient(
        width * 0.85,
        height * 0.8,
        0,
        width * 0.85,
        height * 0.8,
        width * 0.5
      );
      g2.addColorStop(0, "rgba(61,217,198,0.13)");
      g2.addColorStop(1, "rgba(61,217,198,0)");
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, width, height);

      for (const p of particles) {
        if (!reducedMotion) {
          p.angle += p.speed * 0.01;
          p.baseX += Math.sin(p.angle) * 0.15;
          p.baseY += Math.cos(p.angle * 0.8) * 0.1;

          if (pointer.current.active) {
            const dx = pointer.current.x - p.x;
            const dy = pointer.current.y - p.y;
            const dist = Math.hypot(dx, dy);
            const influence = Math.max(0, 1 - dist / 260);
            p.x += -dx * 0.0009 * influence * 22;
            p.y += -dy * 0.0009 * influence * 22;
          }

          p.x += (p.baseX - p.x) * 0.02;
          p.y += (p.baseY - p.y) * 0.02;

          if (p.baseX < -20) p.baseX = width + 20;
          if (p.baseX > width + 20) p.baseX = -20;
          if (p.baseY < -20) p.baseY = height + 20;
          if (p.baseY > height + 20) p.baseY = -20;
        }

        ctx!.beginPath();
        ctx!.fillStyle = `hsla(${p.hue}, 90%, 72%, 0.55)`;
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", mouseHandler);
      window.removeEventListener("touchmove", touchHandler);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-void overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_#07060B_78%)]" />
    </div>
  );
}
