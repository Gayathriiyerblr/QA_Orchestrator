/**
 * Logger.ts — shared logging utility.
 * Logs to console and, when a jiraId is provided, to artifacts/{jiraId}/logs/run.log.
 * Every website and every generated test uses this same logger, so all runs
 * produce identical log formatting.
 */
import * as fs from 'fs';
import * as path from 'path';

type Level = 'INFO' | 'PASS' | 'FAIL' | 'WARN' | 'DEBUG';

const LEVEL_ORDER: Record<Level, number> = { DEBUG: 0, INFO: 1, PASS: 1, WARN: 2, FAIL: 3 };

class Logger {
  private jiraId?: string;
  private logPath: string | null = null;
  private minLevel: Level = 'DEBUG';

  /** Initialize the logger for a specific JIRA run. */
  init(jiraId: string, options?: { dir?: string; minLevel?: Level }): void {
    this.jiraId = jiraId;
    if (options?.minLevel) this.minLevel = options.minLevel;
    const base = options?.dir ?? path.join(process.cwd(), 'artifacts', jiraId, 'logs');
    this.logPath = path.join(base, 'run.log');
    try {
      fs.mkdirSync(base, { recursive: true });
    } catch {
      this.logPath = null; // never let logging break a test
    }
  }

  setMinLevel(level: Level): void {
    this.minLevel = level;
  }

  info(message: string): void {
    this.write('INFO', message);
  }

  pass(message: string): void {
    this.write('PASS', message);
  }

  fail(message: string): void {
    this.write('FAIL', message);
  }

  warn(message: string): void {
    this.write('WARN', message);
  }

  debug(message: string): void {
    this.write('DEBUG', message);
  }

  private write(level: Level, message: string): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    const line = `[${new Date().toISOString()}] [${level}] ${message}`;
    // eslint-disable-next-line no-console
    console.log(line);
    if (this.logPath) {
      try {
        fs.appendFileSync(this.logPath, line + '\n', 'utf8');
      } catch {
        /* ignore write failures */
      }
    }
  }
}

/** Singleton logger — import { logger } from framework/utils/Logger. */
export const logger = new Logger();
