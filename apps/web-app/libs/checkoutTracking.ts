import {
  emptyUtmProperties,
  type UtmProperties,
  UTM_KEYS,
  UTM_STORAGE_KEY,
} from "@/libs/utm";

export const CHECKOUT_TRACKING_COOKIE_KEY = "dinio:checkout:context";
export const CHECKOUT_FUNNEL_ID_KEY = "dinio:checkout:funnel_id";
export const SELECTED_PLAN_KEY = "selectedPlan";

const COOKIE_MAX_AGE_SECONDS = 60 * 60;

type CheckoutTrackingCookie = Partial<UtmProperties> & {
  plan?: string;
  funnel_id?: string;
};

const emptyCheckoutTrackingContext = {
  plan: "",
  funnelId: "",
  utmProperties: { ...emptyUtmProperties },
};

function parseJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );

  if (!match?.[1]) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function readCookieContext(): CheckoutTrackingCookie {
  const parsed = parseJson<CheckoutTrackingCookie>(
    readCookie(CHECKOUT_TRACKING_COOKIE_KEY),
  );

  return parsed ?? {};
}

function readSessionUtmProperties(): UtmProperties {
  if (typeof window === "undefined") {
    return { ...emptyUtmProperties };
  }

  const parsed = parseJson<Partial<UtmProperties>>(
    sessionStorage.getItem(UTM_STORAGE_KEY),
  );

  return {
    utm_source: parsed?.utm_source ?? "",
    utm_medium: parsed?.utm_medium ?? "",
    utm_campaign: parsed?.utm_campaign ?? "",
    utm_content: parsed?.utm_content ?? "",
  };
}

function getQueryParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

function persistMergedContext(context: {
  plan: string;
  funnelId: string;
  utmProperties: UtmProperties;
}) {
  if (typeof window === "undefined") {
    return;
  }

  if (context.plan) {
    sessionStorage.setItem(SELECTED_PLAN_KEY, context.plan);
  }

  if (context.funnelId) {
    sessionStorage.setItem(CHECKOUT_FUNNEL_ID_KEY, context.funnelId);
  }

  sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(context.utmProperties));

  writeCookie(
    CHECKOUT_TRACKING_COOKIE_KEY,
    JSON.stringify({
      plan: context.plan,
      funnel_id: context.funnelId,
      ...context.utmProperties,
    }),
    COOKIE_MAX_AGE_SECONDS,
  );
}

export function resolveCheckoutTrackingContext() {
  if (typeof window === "undefined") {
    return { ...emptyCheckoutTrackingContext };
  }

  const params = getQueryParams();
  const cookieContext = readCookieContext();

  const sessionPlan = sessionStorage.getItem(SELECTED_PLAN_KEY) ?? "";
  const sessionFunnelId =
    sessionStorage.getItem(CHECKOUT_FUNNEL_ID_KEY) ?? "";
  const sessionUtm = readSessionUtmProperties();

  const plan =
    params.get("plan") ?? cookieContext.plan ?? sessionPlan ?? "";
  const funnelId =
    params.get("funnel_id") ??
    cookieContext.funnel_id ??
    sessionFunnelId ??
    "";

  const mergedUtm: UtmProperties = { ...sessionUtm };

  for (const key of UTM_KEYS) {
    const queryValue = params.get(key);
    const cookieValue = cookieContext[key] ?? "";

    if (queryValue !== null) {
      mergedUtm[key] = queryValue;
      continue;
    }

    if (cookieValue) {
      mergedUtm[key] = cookieValue;
    }
  }

  const resolved = {
    plan,
    funnelId,
    utmProperties: mergedUtm,
  };

  persistMergedContext(resolved);

  return resolved;
}

export function ensureCheckoutFunnelId() {
  if (typeof window === "undefined") {
    return "";
  }

  const { funnelId } = resolveCheckoutTrackingContext();
  if (funnelId) {
    return funnelId;
  }

  const generatedFunnelId = crypto.randomUUID();
  const context = resolveCheckoutTrackingContext();

  persistMergedContext({
    ...context,
    funnelId: generatedFunnelId,
  });

  return generatedFunnelId;
}

export function clearCheckoutTrackingCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${CHECKOUT_TRACKING_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}
