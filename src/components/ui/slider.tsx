// Роль: UI
// Слайдер, прогресс-бар и бейдж в neo-brutalist стиле референса.
"use client";

import type { HTMLAttributes, ReactNode } from "react";

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 5,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{label}</span>
          <span className="border-2 border-ink bg-mint px-2 py-0.5 font-display text-xs font-extrabold shadow-brutal-xs">
            {value}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="brutal-range h-6 w-full"
        aria-label={label ?? "slider"}
      />
    </div>
  );
}

export function Progress({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-4 w-full border-2 border-ink bg-paper ${className}`}
    >
      <div className="h-full bg-mint transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className = "",
  ...props
}: {
  children: ReactNode;
  tone?: "slate" | "indigo" | "emerald" | "amber" | "red" | "sky";
  className?: string;
} & HTMLAttributes<HTMLSpanElement>) {
  const tones: Record<string, string> = {
    slate: "bg-paper text-ink",
    indigo: "bg-mint-soft text-ink",
    emerald: "bg-mint text-ink",
    amber: "bg-sun text-ink",
    red: "bg-danger text-white",
    sky: "bg-sky-soft text-ink",
  };
  return (
    <span
      className={`inline-flex items-center border-2 border-ink px-2.5 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-wide shadow-brutal-xs ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}