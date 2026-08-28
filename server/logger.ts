import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type LogLevel = 'info' | 'debug' | 'error';

type LogContext = Record<string, unknown>;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logDirectory = resolve(projectRoot, 'logs');
const logFile = resolve(logDirectory, 'backend-log.log');
const errorLogFile = resolve(logDirectory, 'error.log');

mkdirSync(logDirectory, { recursive: true });
appendFileSync(errorLogFile, '', 'utf8');

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
  };
  const line = JSON.stringify(entry);

  try {
    appendFileSync(logFile, `${line}\n`, 'utf8');
    if (level === 'error') appendFileSync(errorLogFile, `${line}\n`, 'utf8');
  } catch (error) {
    process.stderr.write(`Unable to write backend log: ${serializeError(error)}\n`);
  }

  const output = `[${entry.timestamp}] ${level.toUpperCase()} ${message}`;
  if (level === 'error') {
    console.error(output, context ?? '');
  } else if (level === 'debug') {
    console.debug(output, context ?? '');
  } else {
    console.info(output, context ?? '');
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    write('info', message, context);
  },
  debug(message: string, context?: LogContext) {
    write('debug', message, context);
  },
  error(message: string, error?: unknown, context?: LogContext) {
    write('error', message, {
      ...(context ?? {}),
      ...(error !== undefined ? { error: serializeError(error) } : {}),
    });
  },
  file: logFile,
};
