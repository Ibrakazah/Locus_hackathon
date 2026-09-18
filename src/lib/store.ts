'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from './types';

const STORE_KEY = 'route-v1';
export const STORE_VERSION = 1;

interface AppState {
  profile: Profile;
  goalProgramId: string | null;
  done: Record<string, boolean>;
  setProfile: (patch: Partial<Profile>) => void;
  setGoal: (id: string | null) => void;
  toggleTask: (id: string) => void;
  reset: () => void;
}

export const defaultProfile: Profile = {
  route: 'kz',
  grade: 11,
  fields: ['undecided'],
  funding: 'grant_or_contract',
  priority: 'cost',
  city: null,
  interests: [],
  abroadCountries: [],
  budgetUsd: null,
  ent: { status: 'not_taken', score: null, profile: null },
  ielts: { status: 'not_taken', score: null },
  toefl: { status: 'not_taken', score: null },
  sat: { status: 'not_taken', score: null },
  act: { status: 'not_taken', score: null },
  nuet: { status: 'not_taken', score: null },
  isNis: false,
  interestedInNu: false,
  gpa: null,
  language: 'any',
  quota: 'unsure',
  foundationOk: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      goalProgramId: null,
      done: {},
      setProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      setGoal: (id) => set({ goalProgramId: id }),
      toggleTask: (id) =>
        set((s) => ({ done: { ...s.done, [id]: !s.done[id] } })),
      reset: () => set({ profile: defaultProfile, goalProgramId: null, done: {} }),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      // Персистим только вводные + галочки. Рекомендации и roadmap пересчитываются.
      partialize: (s) => ({ profile: s.profile, goalProgramId: s.goalProgramId, done: s.done }),
      skipHydration: true,
    },
  ),
);

// Гейт гидрации для Next App Router: useHydrated() => рендерим persisted только на клиенте.
import { useEffect, useState } from 'react';
export function useHydrated(): boolean {
  const [h, setH] = useState(false);
  useEffect(() => {
    useAppStore.persist.rehydrate();
    setH(true);
  }, []);
  return h;
}
