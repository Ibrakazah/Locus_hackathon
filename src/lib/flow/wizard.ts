"use client";

// Роль: FLOW
// State machine визарда: dirty-профиль в sessionStorage + экшены.

import { useEffect, useReducer } from "react";
import type { ApplicantProfile } from "@/lib/engine/profile";
import { EMPTY_PROFILE, entTotal } from "@/lib/engine/profile";
import { STEP_INDEX } from "./steps";
import type { StepKey } from "./steps";

export type WizardState = {
  step: StepKey;
  profile: ApplicantProfile;
  completed: boolean;
};

export type WizardAction =
  | { type: "SET_FIELD"; path: string; value: unknown }
  | { type: "SET_ENT_SCORE"; field: "math" | "reading" | "history" | "profile1" | "profile2"; value: number }
  | { type: "SET_PRIORITY"; key: keyof ApplicantProfile["priorities"]; value: number }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SKIP_TO"; step: StepKey }
  | { type: "RESET" };

const STORAGE_KEY = "locus:onboarding:v1";

function setByPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) return { ...obj, [head]: value } as T;
  return { ...obj, [head]: setByPath((obj as Record<string, unknown>)[head], rest.join("."), value) } as T;
}

function loadInitial(): WizardState {
  if (typeof window === "undefined") return { step: "profile", profile: EMPTY_PROFILE, completed: false };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WizardState;
      return { ...parsed, profile: { ...EMPTY_PROFILE, ...parsed.profile } };
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { step: "profile", profile: EMPTY_PROFILE, completed: false };
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, profile: setByPath(state.profile, action.path, action.value) };
    case "SET_ENT_SCORE":
      return {
        ...state,
        profile: {
          ...state.profile,
          entScores: { ...state.profile.entScores, [action.field]: action.value },
        },
      };
    case "SET_PRIORITY":
      return {
        ...state,
        profile: {
          ...state.profile,
          priorities: { ...state.profile.priorities, [action.key]: action.value },
        },
      };
    case "NEXT": {
      const idx = STEP_INDEX[state.step];
      if (idx >= 4) return { ...state, completed: true };
      const keys = Object.keys(STEP_INDEX) as StepKey[];
      return { ...state, step: keys[idx + 1] };
    }
    case "BACK": {
      if (state.completed) return { ...state, step: "constraints", completed: false };
      const idx = STEP_INDEX[state.step];
      const keys = Object.keys(STEP_INDEX) as StepKey[];
      return { ...state, step: keys[Math.max(idx - 1, 0)] };
    }
    case "SKIP_TO":
      return { ...state, step: action.step, completed: false };
    case "RESET":
      return { step: "profile", profile: EMPTY_PROFILE, completed: false };
    default:
      return state;
  }
}

export function useWizard() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full — не критично */
    }
  }, [state]);

  return { state, dispatch, totals: { ent: entTotal(state.profile.entScores) } };
}

/** Актуальное количество ошибок/«не заполнено» по шагу — для валидации кнопки «Далее». */
export function isStepComplete(state: WizardState, key: StepKey): boolean {
  const p = state.profile;
  switch (key) {
    case "profile":
      return Boolean(p.city.trim());
    case "scores":
      return entTotal(p.entScores) > 0;
    case "career":
      return p.careerField !== null;
    case "budget":
      return p.studyBudget !== null;
    case "constraints":
      return p.regionPref !== null;
    default:
      return true;
  }
}