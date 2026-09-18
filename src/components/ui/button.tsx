// Роль: UI
// Дизайн-система: кнопка в neo-brutalist стиле референса.
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-ink bg-mint font-display font-extrabold uppercase tracking-wide text-ink shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-xs active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  secondary:
    "border-2 border-ink bg-paper font-display font-extrabold uppercase tracking-wide text-ink shadow-brutal-sm hover:bg-mint-soft hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-xs active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  outline:
    "border-2 border-ink bg-transparent font-display font-extrabold uppercase tracking-wide text-ink hover:bg-mint-soft",
  ghost: "bg-transparent font-display font-bold uppercase tracking-wide text-ink hover:bg-mint-soft",
  destructive:
    "border-2 border-ink bg-danger font-display font-extrabold uppercase tracking-wide text-white shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-xs active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 py-3 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center transition-all disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}