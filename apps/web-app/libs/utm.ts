const UTM_STORAGE_KEY = "dinio:utm:session";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

export type UtmProperties = Record<(typeof UTM_KEYS)[number], string>;

const emptyUtmProperties: UtmProperties = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
};

export function getSessionUtmProperties(): UtmProperties {
  if (typeof window === "undefined") {
    return { ...emptyUtmProperties };
  }

  let stored: UtmProperties = { ...emptyUtmProperties };

  const rawStored = sessionStorage.getItem(UTM_STORAGE_KEY);
  if (rawStored) {
    try {
      const parsed = JSON.parse(rawStored) as Partial<UtmProperties>;
      stored = {
        utm_source: parsed.utm_source ?? "",
        utm_medium: parsed.utm_medium ?? "",
        utm_campaign: parsed.utm_campaign ?? "",
        utm_content: parsed.utm_content ?? "",
      };
    } catch {
      stored = { ...emptyUtmProperties };
    }
  }

  const params = new URLSearchParams(window.location.search);
  const merged: UtmProperties = {
    ...stored,
  };

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value !== null) {
      merged[key] = value;
    }
  }

  sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));

  return merged;
}
