"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ChipVariant = "default" | "selected" | "outline";

const variants: Record<ChipVariant, string> = {
  default:
    "border-2 border-ink bg-paper text-ink hover:bg-mint-soft",
  selected:
    "border-2 border-ink bg-mint text-ink shadow-brutal-xs",
  outline:
    "border-2 border-ink/30 bg-transparent text-smoke hover:border-ink hover:text-ink",
};

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  children?: ReactNode;
}

export function Chip({
  variant = "default",
  className = "",
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
