"use client";

import type { ActivityFit, ActivityType } from "@/lib/extracurricular/types";
import { FIT_LABEL, FORMAT_LABEL, TYPE_LABEL } from "@/lib/extracurricular/labels";

export interface ActivityFiltersProps {
  type: ActivityType | null;
  format: "online" | "offline" | "hybrid" | null;
  fit: ActivityFit | null;
  onType: (v: ActivityType | null) => void;
  onFormat: (v: "online" | "offline" | "hybrid" | null) => void;
  onFit: (v: ActivityFit | null) => void;
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 border-ink px-3 py-1 font-display text-xs font-bold uppercase shadow-brutal-xs ${
        active ? "bg-ink text-cream" : "bg-paper text-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function ActivityFilters({
  type,
  format,
  fit,
  onType,
  onFormat,
  onFit,
}: ActivityFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full text-xs font-bold uppercase text-smoke sm:w-auto">Тип</span>
        <Chip active={type === null} label="Все" onClick={() => onType(null)} />
        {(Object.keys(TYPE_LABEL) as ActivityType[]).map((t) => (
          <Chip key={t} active={type === t} label={TYPE_LABEL[t]} onClick={() => onType(t)} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full text-xs font-bold uppercase text-smoke sm:w-auto">Формат</span>
        <Chip active={format === null} label="Все" onClick={() => onFormat(null)} />
        {(["online", "offline", "hybrid"] as const).map((f) => (
          <Chip key={f} active={format === f} label={FORMAT_LABEL[f]} onClick={() => onFormat(f)} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full text-xs font-bold uppercase text-smoke sm:w-auto">Подходит</span>
        <Chip active={fit === null} label="Все" onClick={() => onFit(null)} />
        {(["high", "medium", "low"] as const).map((f) => (
          <Chip key={f} active={fit === f} label={FIT_LABEL[f]} onClick={() => onFit(f)} />
        ))}
      </div>
    </div>
  );
}
