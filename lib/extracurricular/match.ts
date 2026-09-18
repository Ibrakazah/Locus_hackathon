// Роль: EXTRACURRICULARS (ветка B)
// Чистый матчинг активностей по профилю. Rule-based, без LLM.

import type { Grade, Profile, Route } from "../store/types";
import type { Activity, ActivityFit, ActivityType, MatchedActivity } from "./types";

const FIT_RANK: Record<ActivityFit, number> = { high: 0, medium: 1, low: 2 };

// Типы активностей, которые усиливают заявку в зависимости от маршрута.
const ROUTE_BOOST: Record<Route, ActivityType[]> = {
  abroad: ["research", "leadership", "volunteering"],
  kz: ["olympiad", "hackathon"],
  undecided: [],
};

function gradeFits(grade: Grade | null, [min, max]: Activity["gradeRange"]): boolean {
  if (grade === null) return true;
  if (grade === "graduate") return max === "graduate";
  return grade >= min && (max === "graduate" || grade <= max);
}

function computeFit(activity: Activity, profile: Profile): ActivityFit {
  const overlap = activity.fields.filter((f) => profile.fields.includes(f));
  let fit: ActivityFit = "low";
  if (overlap.length > 0) fit = "high";
  else if (profile.fields.length === 0 || profile.fields.includes("undecided")) fit = "medium";

  const boost = ROUTE_BOOST[profile.route] ?? [];
  if (boost.includes(activity.type) && fit !== "high") {
    fit = fit === "medium" ? "high" : "medium";
  }
  return fit;
}

function buildWhy(activity: Activity, profile: Profile): string {
  const overlap = activity.fields.filter((f) => profile.fields.includes(f));
  const parts: string[] = [];
  if (overlap.length > 0) parts.push(`подходит к направлению: ${overlap.join(", ")}`);
  if (ROUTE_BOOST[profile.route]?.includes(activity.type)) parts.push("усиливает заявку");
  if (activity.format === "online") parts.push("онлайн — без переезда");
  if (activity.deadline) parts.push(`дедлайн ${activity.deadline}`);
  return parts.length ? parts.join(" · ") : "стоит рассмотреть";
}

function isUpcoming(activity: Activity, today: string): boolean {
  return !activity.deadline || activity.deadline >= today;
}

export function matchActivities(
  profile: Profile,
  catalog: Activity[],
  now: Date,
): MatchedActivity[] {
  const today = now.toISOString().slice(0, 10);

  let filtered = catalog.filter(
    (a) => gradeFits(profile.grade, a.gradeRange) && isUpcoming(a, today),
  );

  // Fallback: ослабляем фильтр по классу, затем по дедлайну.
  if (filtered.length < 3) filtered = catalog.filter((a) => isUpcoming(a, today));
  if (filtered.length < 3) filtered = catalog;

  const matched: MatchedActivity[] = filtered.map((activity) => ({
    activity,
    fit: computeFit(activity, profile),
    why: buildWhy(activity, profile),
  }));

  matched.sort((a, b) => {
    return (
      (a.activity.deadline ?? "9999").localeCompare(b.activity.deadline ?? "9999") ||
      FIT_RANK[a.fit] - FIT_RANK[b.fit] ||
      b.activity.intensity - a.activity.intensity ||
      a.activity.id.localeCompare(b.activity.id)
    );
  });

  return matched;
}
