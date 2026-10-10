import { useEffect, useState } from "react";

export function accountStorageKey(key: string): string {
  const userId = window.localStorage.getItem("vital.auth.userId");
  return userId ? `vital.account.${userId}.${key}` : key;
}

function readStored<T>(key: string, scopedKey: string, fallback: T): T {
  try {
    let value = window.localStorage.getItem(scopedKey);
    const userId = window.localStorage.getItem("vital.auth.userId");
    if (!value && scopedKey !== key && userId && window.localStorage.getItem("vital.auth.legacyMigrated") === userId) {
      // Keep data from the original single-user demo when the first account is created.
      value = window.localStorage.getItem(key);
      if (value) window.localStorage.setItem(scopedKey, value);
    }
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useStoredState<T>(key: string, fallback: T) {
  const scopedKey = accountStorageKey(key);
  const [value, setValue] = useState<T>(() => readStored(key, scopedKey, fallback));

  useEffect(() => {
    window.localStorage.setItem(scopedKey, JSON.stringify(value));
  }, [scopedKey, value]);

  return [value, setValue] as const;
}
