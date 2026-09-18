'use client';
import { useEffect, useRef } from 'react';

// Интерактивный фон: поле частиц, реагирующее на курсор.
// Частицы дрейфуют, расталкиваются у указателя и подсвечиваются рядом с ним;
// за курсором тянется мягкая «аура». Без градиентов — только точка.
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, raf = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    let particles: { x: number; y: number; vx: number; vy: number; r: number; base: number }[] = [];

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const seed = () => {
      const count = Math.max(90, Math.min(170, Math.round((w * h) / 5200)));
      particles = Array.from({ length: count }, () => {
        const r = Math.random() * 1.8 + 1.1;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r,
          base: r,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      seed();
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; pointer.active = false; };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      const R = 130;
      const R2 = R * R;

      if (pointer.active) {
        // мягкая аура за курсором
        const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, R);
        g.addColorStop(0, 'rgba(17,17,17,0.08)');
        g.addColorStop(1, 'rgba(17,17,17,0)');
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, R, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      for (const p of particles) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;

        let brightness = 1;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          const k = 1 - d / R;
          // расталкивание от курсора
          const push = k * 1.6;
          p.x += (dx / d) * push;
          p.y += (dy / d) * push;
          // ближе к курсору — крупнее и темнее
          brightness = 0.35 + k * 0.75;
          p.r = p.base + k * 2.6;
        } else {
          p.r += ((p.base - p.r) * 0.08);
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(17,17,17,${Math.min(0.85, 0.45 * brightness + 0.12)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduced) {
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerleave', onLeave);
      window.addEventListener('pointerup', onLeave);
      tick();
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerup', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}