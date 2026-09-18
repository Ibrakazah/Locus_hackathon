"use client";

import type { Profile, RankChange, Recommendation } from "@/lib/store/types";
import { diffRankings } from "@/lib/diff/rankings";

export interface WhatIfSheetProps {
  open: boolean;
  onClose: () => void;
  before: Recommendation[];
  after: Recommendation[];
  changed?: Partial<Profile>;
  title?: string;
}

export function WhatIfSheet({ open, onClose, before, after, changed, title }: WhatIfSheetProps) {
  if (!open) return null;

  const changes: RankChange[] = diffRankings(before, after, changed);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" role="dialog">
      <div className="w-full max-w-xl border-t-[3px] border-ink bg-cream p-4 shadow-brutal sm:mb-4 sm:border-[3px]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">
            {title ?? "Что изменится, если поменять вводные"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-ink bg-paper px-3 py-1 font-display text-xs font-bold uppercase"
          >
            Закрыть
          </button>
        </div>

        {changes.length === 0 ? (
          <p className="mt-3 text-sm text-smoke">Порядок не изменился.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {changes.map((c) => (
              <li key={c.programId} className="border-2 border-ink bg-paper p-3 text-sm">
                <span className="font-bold">{c.programId}</span>
                <span className="text-smoke">
                  {" "}
                  {c.from === -1 ? "появился" : `${c.from + 1} место`} →{" "}
                  {c.to === -1 ? "выпал" : `${c.to + 1} место`}
                </span>
                <div className="text-xs text-smoke">{c.reason}</div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-smoke">[демо-данные] — порядок пересчитывает движок ветки A.</p>
      </div>
    </div>
  );
}
