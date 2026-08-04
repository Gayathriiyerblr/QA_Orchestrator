/**
 * RetryUtil.ts — shared retry logic.
 * retry()            → generic async retry with exponential backoff
 * retryClick()       → retry a click callback
 * retryFill()        → retry a fill callback
 * retryAssertion()   → retry an assertion callback, returning pass/fail
 * Used by ElementActions and BaseAssertions so every website inherits the
 * same resilience behavior.
 */
import { TIMEOUTS, RETRY } from '../constants/TestConstants';

export type Retryable<T> = () => Promise<T>;

async function sleep(ms: number): Promise<void> {
  await new Promise(r => setTimeout(r, ms));
}

/**
 * Run fn, retrying up to `maxRetries` times on failure with exponential
 * backoff starting at `baseDelayMs`.
 */
export async function retry<T>(
  fn: Retryable<T>,
  options?: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? RETRY.COUNT;
  const baseDelayMs = options?.baseDelayMs ?? RETRY.BASE_DELAY_MS;
  const maxDelayMs = options?.maxDelayMs ?? RETRY.MAX_DELAY_MS;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(delay);
    }
  }
}

/** Retry a click action, defaulting to the framework retry budget. */
export async function retryClick(fn: Retryable<void>): Promise<void> {
  await retry(fn);
}

/** Retry a fill action. */
export async function retryFill(fn: Retryable<void>): Promise<void> {
  await retry(fn);
}

/** Retry an assertion callback; resolves true on success, false after retries. */
export async function retryAssertion(fn: Retryable<boolean | void>): Promise<boolean> {
  try {
    await retry(fn, { maxRetries: RETRY.COUNT, baseDelayMs: RETRY.BASE_DELAY_MS });
    return true;
  } catch {
    return false;
  }
}

/** Convenience: overall assertion timeout used by BaseAssertions. */
export const ASSERTION_TIMEOUT = TIMEOUTS.ASSERT;
