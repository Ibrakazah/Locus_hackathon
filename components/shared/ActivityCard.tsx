"use client";

import { useState } from "react";
import type { MatchedActivity } from "@/lib/extracurricular/types";
import type { Profile } from "@/lib/store/types";
import { FIT_LABEL, FIT_STYLE, FORMAT_LABEL, PRICE_LABEL, TYPE_LABEL } from "@/lib/extracurricular/labels";

export function ActivityCard({ m, profile }: { m: MatchedActivity; profile: Profile }) {
  const [llm, setLlm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "activity",
          activity: { activity: m.activity, profile, why: m.why },
        }),
      });
      const data = (await res.json()) as { text?: string };
      if (data.text) setLlm(data.text);
    } catch {
      // оставляем rule-based why
    } finally {
      setLoading(false);
    }
  };

  const { activity, fit, why } = m;

  return (
    <article className="flex flex-col border-2 border-ink bg-paper p-4 shadow-brutal-sm">
      <div className="flex flex-wrap gap-2">
        <span className="border-2 border-ink bg-paper px-2 py-0.5 font-display text-[11px] font-bold uppercase">
          {TYPE_LABEL[activity.type]}
        </span>
        <span className="border-2 border-ink bg-paper px-2 py-0.5 font-display text-[11px] font-bold uppercase">
          {FORMAT_LABEL[activity.format]}
        </span>
        <span className="border-2 border-ink bg-paper px-2 py-0.5 font-display text-[11px] font-bold uppercase">
          {PRICE_LABEL[activity.price]}
        </span>
        {activity.demo && (
          <span className="px-2 py-0.5 font-display text-[11px] font-bold uppercase text-smoke">
            демо-данные
          </span>
        )}
      </div>

      <h2 className="mt-3 font-display text-lg font-bold leading-tight">{activity.title}</h2>

      <p className="mt-2 text-sm font-bold text-mint-deep">+ {activity.gain}</p>

      {activity.deadline && (
        <p className="mt-2 text-xs text-smoke">дедлайн: {activity.deadline}</p>
      )}

      <p className="mt-3 text-sm text-ink/80">
        {llm ?? why}
        {llm && <span className="ml-1 text-[11px] uppercase text-smoke">(ИИ)</span>}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className={`border-2 border-ink px-2 py-1 font-display text-[11px] font-bold uppercase ${FIT_STYLE[fit]}`}>
          {FIT_LABEL[fit]}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={ask}
            disabled={loading}
            className="border-2 border-ink bg-mint-soft px-3 py-1.5 font-display text-xs font-bold uppercase shadow-brutal-xs"
          >
            {loading ? "…" : "Уточнить ИИ"}
          </button>
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-ink bg-ink px-3 py-1.5 font-display text-xs font-bold uppercase text-cream shadow-brutal-xs"
          >
            Подробнее
          </a>
        </div>
      </div>
    </article>
  );
}
