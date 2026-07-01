import { settingsSchema, type Settings } from "@/lib/schemas/settings";
import { STORAGE_KEYS } from "./keys";

const DEFAULT_SETTINGS: Settings = {
  volume: 0.8,
  gestureEnabled: false,
  subtitlesEnabled: true,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = settingsSchema.safeParse(parsed);
    return result.success ? result.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}
