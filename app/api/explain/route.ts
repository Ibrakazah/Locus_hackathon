import { NextResponse } from "next/server";
import type { Recommendation } from "@/lib/store/types";
import { templateExplanation } from "@/lib/text/reasons";

// LLM-объяснение «почему» — только поверх фактов движка.
// Без ключа или при ошибке/невалидном ответе возвращаем детерминированный шаблон.
// TODO(verify): сверить форму запроса с актуальной докой Anthropic Messages API.

interface ExplainBody {
  recommendation?: Recommendation;
}

function fallback(rec: Recommendation) {
  return { text: templateExplanation(rec), source: "template" as const };
}

/** Отбраковка: в тексте есть число, которого нет во входных данных. */
function hasUnknownNumber(text: string, rec: Recommendation): boolean {
  const nums = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const facts = JSON.stringify(rec);
  return nums.some((n) => !facts.includes(n) && !facts.includes(n.replace(",", ".")));
}

export async function POST(request: Request) {
  let body: ExplainBody;
  try {
    body = (await request.json()) as ExplainBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const rec = body.recommendation;
  if (!rec) {
    return NextResponse.json({ error: "recommendation required" }, { status: 400 });
  }

  const key = process.env.EXPLAIN_API_KEY;
  if (!key) {
    return NextResponse.json(fallback(rec));
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
        messages: [
          {
            role: "user",
            content:
              "Объясни по-русски 2-3 предложениями, без чисел, процентов и дат, почему эта программа подходит абитуриенту. Данные: " +
              JSON.stringify(rec),
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(fallback(rec));
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .map((c) => c.text ?? "")
      .join("")
      .trim();

    if (!text || hasUnknownNumber(text, rec)) {
      return NextResponse.json(fallback(rec));
    }

    return NextResponse.json({ text, source: "llm" as const });
  } catch {
    return NextResponse.json(fallback(rec));
  }
}
