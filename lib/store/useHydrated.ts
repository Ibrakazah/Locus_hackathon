"use client";

import { useSyncExternalStore } from "react";
import { useAppStore } from "./index";

/** true после гидрации persisted store — защита от несовпадения на сервере/клиенте. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAppStore.persist.onFinishHydration(onChange),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}
