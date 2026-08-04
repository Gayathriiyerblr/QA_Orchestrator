/**
 * DateUtil.ts — reusable date helpers for calendars/date pickers.
 */
export const DateUtil = {
  /** Today in YYYY-MM-DD. */
  today(): string {
    return new Date().toISOString().slice(0, 10);
  },

  /** Date offset by `days` from today in YYYY-MM-DD. */
  offsetDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  },

  /** Format a Date as YYYY-MM-DD (local time). */
  format(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /** Parse YYYY-MM-DD to a Date at local midnight. */
  parse(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  },
} as const;
