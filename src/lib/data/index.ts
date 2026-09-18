// Роль: DATA
// Загрузка данных о вузах. Единая точка доступа для engine/flow/UI.

import universities from "./universities.json";
import type { University } from "./types";

const list: University[] = universities as University[];

export function getAllUniversities(): University[] {
  return list;
}

export function getUniversityById(id: string): University | undefined {
  return list.find((u) => u.id === id);
}

export function getCities(): string[] {
  return [...new Set(list.map((u) => u.city))].sort();
}

export function getUniversityCount(): number {
  return list.length;
}