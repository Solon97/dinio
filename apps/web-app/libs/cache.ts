/**
 * localStorage cache utility with TTL (time-to-live) support
 * Used to cache budget data and reduce unnecessary API calls
 *
 * Rules applied (Vercel best practices):
 * - js-cache-storage: in-memory Map avoids repeated synchronous storage reads
 * - client-localstorage-schema: versioned prefix prevents stale-schema conflicts
 * - SSR guard: all storage access is gated on window availability
 * - Cross-tab sync: `storage` event clears in-memory entries changed elsewhere
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_VERSION = "v1";
const CACHE_PREFIX = `dinio_cache_${CACHE_VERSION}_`;

// In-memory layer — avoids repeated synchronous localStorage reads (js-cache-storage)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const memoryCache = new Map<string, CacheEntry<any>>();

function isClient(): boolean {
  return typeof window !== "undefined";
}

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.timestamp > entry.ttl;
}

/**
 * Proactively remove all expired entries from both layers.
 * Called periodically so TTL is enforced even for keys that are never read again.
 */
function purgeExpiredEntries(): void {
  // In-memory layer
  for (const [key, entry] of memoryCache.entries()) {
    if (isExpired(entry)) memoryCache.delete(key);
  }

  if (!isClient()) return;

  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(CACHE_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const entry: CacheEntry<unknown> = JSON.parse(raw);
        if (isExpired(entry)) localStorage.removeItem(key);
      } catch {
        // Corrupt entry — remove it
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("[Cache] Error during TTL purge:", error);
  }
}

// Invalidate in-memory entries when another tab writes to localStorage
if (isClient()) {
  window.addEventListener("storage", (event) => {
    if (event.key?.startsWith(CACHE_PREFIX)) {
      memoryCache.delete(event.key);
    }
  });

  // Run TTL purge every minute so expired entries are evicted proactively,
  // not only on the next read of that specific key.
  setInterval(purgeExpiredEntries, 60 * 1000);
}

/**
 * Calculate TTL based on whether the data is current or historical
 * Current month/year: 5 minutes (volatile data - daily expenses)
 * Past month/year: 1 hour (stable data - rarely changes)
 */
export function calculateTTL(month?: number, year?: number): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // For yearly data (no month provided)
  if (month === undefined) {
    return year === currentYear ? 1 * 60 * 1000 : 60 * 60 * 1000;
  }

  // For monthly data
  const isCurrent = month === currentMonth && year === currentYear;
  return isCurrent ? 1 * 60 * 1000 : 60 * 60 * 1000;
}

/**
 * Get data from cache if valid, null if expired or not found.
 * Checks in-memory Map first, then falls back to localStorage.
 */
export function getCache<T>(key: string): T | null {
  const storageKey = CACHE_PREFIX + key;

  // 1. Check in-memory layer first (avoids synchronous storage read)
  const memEntry = memoryCache.get(storageKey) as CacheEntry<T> | undefined;
  if (memEntry) {
    if (!isExpired(memEntry)) return memEntry.data;
    memoryCache.delete(storageKey);
  }

  if (!isClient()) return null;

  // 2. Fall back to localStorage
  try {
    const item = localStorage.getItem(storageKey);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);

    if (isExpired(entry)) {
      localStorage.removeItem(storageKey);
      return null;
    }

    // Warm the in-memory layer for subsequent reads
    memoryCache.set(storageKey, entry);
    return entry.data;
  } catch (error) {
    console.warn("[Cache] Error reading from cache:", error);
    return null;
  }
}

/**
 * Save data to cache with timestamp and TTL.
 * Writes to both the in-memory Map and localStorage.
 */
export function setCache<T>(key: string, data: T, ttl: number): void {
  const storageKey = CACHE_PREFIX + key;
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  // Always update in-memory layer
  memoryCache.set(storageKey, entry);

  if (!isClient()) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(entry));
  } catch (error) {
    console.warn("[Cache] Error writing to cache:", error);
  }
}

/**
 * Invalidate cache entries matching a pattern.
 * Pattern uses simple wildcard matching with *.
 * Example: "budget:user123:2026:*" matches all months in 2026
 */
export function invalidateCache(pattern: string): void {
  const regex = new RegExp(
    "^" + CACHE_PREFIX + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
  );

  // Purge in-memory layer
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) memoryCache.delete(key);
  }

  if (!isClient()) return;

  try {
    const matchingKeys = Object.keys(localStorage).filter((key) =>
      regex.test(key),
    );

    matchingKeys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("[Cache] Error invalidating cache:", error);
  }
}

/**
 * Clear all budget-related cache (in-memory and localStorage).
 */
export function clearAllCache(): void {
  // Clear in-memory layer
  for (const key of memoryCache.keys()) {
    if (key.startsWith(CACHE_PREFIX)) memoryCache.delete(key);
  }

  if (!isClient()) return;

  try {
    const cacheKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(CACHE_PREFIX),
    );

    cacheKeys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("[Cache] Error clearing cache:", error);
  }
}

/**
 * Generate cache key for monthly budget
 */
export function getBudgetCacheKey(
  userId: string,
  month: number,
  year: number,
): string {
  return `budget:${userId}:${year}:${month}`;
}

/**
 * Generate cache key for yearly summary
 */
export function getYearlyCacheKey(userId: string, year: number): string {
  return `yearly:${userId}:${year}`;
}

/**
 * Invalidate all cache entries for a specific month
 */
export function invalidateMonthCache(
  userId: string,
  month: number,
  year: number,
): void {
  invalidateCache(getBudgetCacheKey(userId, month, year));
}

/**
 * Invalidate all cache entries for a specific year
 */
export function invalidateYearCache(userId: string, year: number): void {
  invalidateCache(getYearlyCacheKey(userId, year));
}
