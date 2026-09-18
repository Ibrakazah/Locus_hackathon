"use client";

import type { ReactNode } from "react";

export interface TaskCardProps {
  title: string;
  deadline?: string;
  source?: string;
  done: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export function TaskCard({
  title,
  deadline,
  source,
  done,
  onToggle,
  children,
}: TaskCardProps) {
  return (
    <div
      className={`border-[3px] border-ink p-4 shadow-brutal-sm transition-all ${
        done ? "bg-mint-soft opacity-70" : "bg-paper"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggle}
          className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
        />
        <div className="flex-1">
          <p
            className={`font-display text-sm font-extrabold ${
              done ? "line-through opacity-60" : ""
            }`}
          >
            {title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {deadline && (
              <span className="border border-ink bg-sun px-1.5 py-0.5 font-display text-[10px] font-bold uppercase">
                {deadline}
              </span>
            )}
            {source && (
              <span className="border border-ink/30 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase text-smoke">
                {source}
              </span>
            )}
          </div>
          {children}
        </div>
      </label>
    </div>
  );
}
