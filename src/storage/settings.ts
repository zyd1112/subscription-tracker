const SETTINGS_KEY = 'tracker-settings';

export interface Settings {
  isPro: boolean;
  currency: string;
}

const defaultSettings: Settings = {
  isPro: false,
  currency: 'CNY',
};

export function getSettings(): Settings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
  }
  return defaultSettings;
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
