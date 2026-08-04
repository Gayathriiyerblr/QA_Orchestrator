/**
 * JsonUtil.ts — reusable JSON read/write helpers.
 */
import * as fs from 'fs';

export const JsonUtil = {
  /** Read and parse a JSON file; returns null if missing/malformed. */
  read<T = unknown>(filePath: string): T | null {
    try {
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    } catch {
      return null;
    }
  },

  /** Write an object as pretty-printed JSON. */
  write(filePath: string, data: unknown): void {
    fs.mkdirSync(require('path').dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  },

  /** Deep-clone a JSON-serializable value. */
  clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  },
} as const;
