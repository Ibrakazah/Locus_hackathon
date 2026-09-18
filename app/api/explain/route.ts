import { NextResponse } from "next/server";
import type { Recommendation } from "@/lib/store/types";
import type { Activity } from "@/lib/extracurricular/types";
import { templateExplanation } from "@/lib/text/reasons";

// LLM-объяснение «почему» — только поверх фактов движка.
// Без ключа или при ошибке/невалидном ответе возвращаем детерминированный шаблон.
// TODO(verify): сверить форму запроса с актуальной докой Anthropic Messages API.

type ExplainKind = "recommendation" | "activity";

interface ExplainBody {
  kind?: ExplainKind;
  recommendation?: Recommendation;
  activity?: { activity: Activity; profile: unknown; why: string };
}

function fallback(body: ExplainBody): { text: string; source: "template" } {
  if (body.kind === "activity" && body.activity) {
    return { text: body.activity.why, source: "template" };
  }
  if (body.recommendation) {
    return { text: templateExplanation(body.recommendation), source: "template" };
  }
  return { text: "Недостаточно данных для объяснения", source: "template" };
}

function promptFor(body: ExplainBody): { prompt: string; facts: unknown } | null {
  if (body.kind === "activity" && body.activity) {
    const facts = { activity: body.activity.activity, profile: body.activity.profile };
    return {
      prompt:
        "Объясни по-русски 1-2 предложениями, без чисел, процентов и дат, почему эта активность подходит абитуриенту с таким профилем. Данные: " +
        JSON.stringify(facts),
      facts,
    };
  }
  if (body.recommendation) {
    const facts = body.recommendation;
    return {
      prompt:
        "Объясни по-русски 2-3 предложениями, без чисел, процентов и дат, почему эта программа подходит абитуриенту. Данные: " +
        JSON.stringify(facts),
      facts,
    };
  }
  return null;
}

/** Отбраковка: в тексте есть число, которого нет во входных данных. */
function hasUnknownNumber(text: string, facts: unknown): boolean {
  const nums = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const factStr = JSON.stringify(facts);
  return nums.some((n) => !factStr.includes(n) && !factStr.includes(n.replace(",", ".")));
}

export async function POST(request: Request) {
  let body: ExplainBody;
  try {
    body = (await request.json()) as ExplainBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const payload = promptFor(body);
  if (!payload) {
    return NextResponse.json({ error: "recommendation or activity required" }, { status: 400 });
  }

  const key = process.env.EXPLAIN_API_KEY;
  if (!key) {
    return NextResponse.json(fallback(body));
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.EXPLAIN_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: payload.prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(fallback(body));
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .map((c) => c.text ?? "")
      .join("")
      .trim();

    if (!text || hasUnknownNumber(text, payload.facts)) {
      return NextResponse.json(fallback(body));
    }

    return NextResponse.json({ text, source: "llm" as const });
  } catch {
    return NextResponse.json(fallback(body));
  }
}
