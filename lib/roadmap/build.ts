// Роль: ROADMAP (ветка B)
// buildRoadmap — чистый планировщик: профиль + цель + prev + now → задачи по дедлайнам.

import type { Profile, Recommendation, RoadmapTask } from "../store/types";
import {
  LEAD_DOCS_DAYS,
  LEAD_EXAM_DAYS,
  NU_OPEN,
  UCAS_OXBRIDGE,
  daysBefore,
  daysUntil,
} from "./constants";
import { gapTaskSpec } from "./gapTasks";

export interface BuildRoadmapInput {
  profile: Profile;
  goal: Recommendation | null;
  prev: RoadmapTask[];
  now: Date;
  /** Дата закрытия подачи программы. Появится у A (Program); пока опциональна. */
  programClosesAt?: string;
}

const SRC = "[демо-данные]";

function defaultApplicationDeadline(profile: Profile): string {
  const uk = (profile.abroad?.countries ?? []).includes("uk");
  return uk ? "2027-01-29" : "2027-08-17";
}

function cmpDeadline(a: RoadmapTask, b: RoadmapTask): number {
  return (
    (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") || a.id.localeCompare(b.id)
  );
}

export function buildRoadmap({
  profile,
  goal,
  prev,
  now,
  programClosesAt,
}: BuildRoadmapInput): RoadmapTask[] {
  const out: RoadmapTask[] = [];

  // 1. Задачи из gaps цели
  if (goal) {
    for (const gap of goal.gaps) {
      const spec = gapTaskSpec(gap, profile);
      out.push({
        id: `${goal.programId}:${gap.type}`,
        title: spec.title,
        done: false,
        kind: spec.kind,
        alert: spec.alert,
        source: gap.source ?? SRC,
      });
    }
  }

  // 2. Базовые задачи: сроки назад от даты закрытия подачи
  const apply = programClosesAt ?? defaultApplicationDeadline(profile);
  out.push({
    id: "base:exam_registration",
    title: "Зарегистрироваться на экзамен",
    deadline: daysBefore(apply, LEAD_EXAM_DAYS),
    done: false,
    kind: "exam_registration",
    source: SRC,
  });
  out.push({
    id: "base:documents",
    title: "Собрать документы",
    deadline: daysBefore(apply, LEAD_DOCS_DAYS),
    done: false,
    kind: "documents",
    source: SRC,
  });
  out.push({
    id: "base:application",
    title: "Подать документы",
    deadline: apply,
    done: false,
    kind: "application",
    source: SRC,
  });

  // 3. Датозависимые правила (время только через now)
  const month = now.getUTCMonth() + 1;
  const isPreparation = profile.grade === 11 && (month >= 9 || month <= 4);
  if (isPreparation) {
    out.push({
      id: "prep:mock-ent",
      title: "Пробный ЕНТ (январь)",
      deadline: "2027-01-15",
      done: false,
      kind: "study",
      source: SRC,
    });
  } else {
    out.push({
      id: "base:grant",
      title: "Конкурс гранта",
      deadline: apply,
      done: false,
      kind: "grant",
      source: SRC,
    });
  }

  if (profile.kz?.interestedInNu && daysUntil(now, NU_OPEN) > 0) {
    const left = daysUntil(now, NU_OPEN);
    out.push({
      id: "nu:apply",
      title: `NU: подача открывается ${NU_OPEN} (через ${left} дн.)`,
      deadline: NU_OPEN,
      done: false,
      kind: "application",
      source: SRC,
    });
  }

  const uk = (profile.abroad?.countries ?? []).includes("uk");
  if (profile.isNis && uk && now.getTime() < new Date(`${UCAS_OXBRIDGE}T00:00:00Z`).getTime()) {
    const left = daysUntil(now, UCAS_OXBRIDGE);
    out.push({
      id: "deadline:ucas-oxbridge",
      title: `UCAS Oxbridge: дедлайн ${UCAS_OXBRIDGE} (осталось ${left} дн.)`,
      deadline: UCAS_OXBRIDGE,
      done: false,
      kind: "application",
      alert: true,
      source: SRC,
    });
  }

  // 4. Сохраняем done и plannedDate из prev по id
  const prevMap = new Map(prev.map((t) => [t.id, t]));
  const merged = out.map((task) => {
    const old = prevMap.get(task.id);
    if (!old) return task;
    return {
      ...task,
      done: old.done,
      plannedDate: task.plannedDate ?? old.plannedDate,
    };
  });

  // 5. Сортировка по дедлайну
  return merged.sort(cmpDeadline);
}
