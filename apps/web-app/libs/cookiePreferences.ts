export type CookieCategory = "analytics" | "support";

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  support: boolean;
  updatedAt: string;
}

export const COOKIE_PREFERENCES_KEY = "dinio_cookie_preferences_v1";
export const COOKIE_PREFERENCES_UPDATED_EVENT =
  "dinio:cookie-preferences-updated";

export function getDefaultCookiePreferences(): CookiePreferences {
  return {
    essential: true,
    analytics: false,
    support: false,
    updatedAt: new Date().toISOString(),
  };
}

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(COOKIE_PREFERENCES_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;

    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      support: Boolean(parsed.support),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCookiePreferences(
  preferences: Pick<CookiePreferences, "analytics" | "support">,
): CookiePreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  const normalized: CookiePreferences = {
    essential: true,
    analytics: preferences.analytics,
    support: preferences.support,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    COOKIE_PREFERENCES_KEY,
    JSON.stringify(normalized),
  );

  window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_UPDATED_EVENT));

  return normalized;
}

export function hasCookieConsent(category: CookieCategory): boolean {
  const preferences = readCookiePreferences();

  if (!preferences) {
    return false;
  }

  return preferences[category];
}
