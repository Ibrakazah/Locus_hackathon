// Роль: UI
// Поля ввода.
"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
}

export function Input({ label, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      {label && <span className="text-sm font-bold">{label}</span>}
      <input
        id={inputId}
        className={`h-11 border-2 border-ink bg-paper px-3 text-sm font-medium shadow-brutal-xs outline-none transition-shadow placeholder:text-smoke/60 focus:shadow-brutal-mint ${className}`}
        {...props}
      />
      {hint && <span className="text-xs text-smoke">{hint}</span>}
    </label>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: ReactNode;
  options: { value: string; label: string }[];
}

export function Select({ label, hint, options, className = "", id, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5" htmlFor={selectId}>
      {label && <span className="text-sm font-bold">{label}</span>}
      <select
        id={selectId}
        className={`h-11 cursor-pointer border-2 border-ink bg-paper px-3 text-sm font-medium shadow-brutal-xs outline-none transition-shadow focus:shadow-brutal-mint ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="text-xs text-smoke">{hint}</span>}
    </label>
  );
}