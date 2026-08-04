/**
 * TokenManager.ts — caches auth tokens per environment/site so API tests
 * never re-authenticate more than necessary.
 */
class TokenManager {
  private cache = new Map<string, { token: string; expiresAt: number }>();

  /** Retrieve a cached token if it hasn't expired. */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.token;
  }

  /** Store a token with an optional expiry (ms from now). */
  set(key: string, token: string, ttlMs?: number): void {
    this.cache.set(key, {
      token,
      expiresAt: ttlMs ? Date.now() + ttlMs : Number.MAX_SAFE_INTEGER,
    });
  }

  clear(key?: string): void {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }
}

export const tokenManager = new TokenManager();
