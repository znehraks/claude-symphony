/**
 * Logger utility with color support
 * Replaces the logging functions from common.sh
 */
import chalk from 'chalk';

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';
export type LogColor = 'red' | 'green' | 'yellow' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray';

const colorMap: Record<LogColor, typeof chalk.red> = {
  red: chalk.red,
  green: chalk.green,
  yellow: chalk.yellow,
  blue: chalk.blue,
  cyan: chalk.cyan,
  magenta: chalk.magenta,
  white: chalk.white,
  gray: chalk.gray,
};

/**
 * Generic log function with optional color
 */
export function log(message: string, color?: LogColor): void {
  if (color && colorMap[color]) {
    console.log(colorMap[color](message));
  } else {
    console.log(message);
  }
}

/**
 * Log with [INFO] prefix
 */
export function logInfo(message: string): void {
  console.log(`${chalk.blue('[INFO]')} ${message}`);
}

/**
 * Log with [SUCCESS] prefix
 */
export function logSuccess(message: string): void {
  console.log(`${chalk.green('[SUCCESS]')} ${message}`);
}

/**
 * Log with [WARNING] prefix
 */
export function logWarning(message: string): void {
  console.log(`${chalk.yellow('[WARNING]')} ${message}`);
}

/**
 * Log with [ERROR] prefix
 */
export function logError(message: string): void {
  console.log(`${chalk.red('[ERROR]')} ${message}`);
}

/**
 * Log with [DEBUG] prefix (only in verbose mode)
 */
export function logDebug(message: string, verbose = false): void {
  if (verbose) {
    console.log(`${chalk.gray('[DEBUG]')} ${message}`);
  }
}

/**
 * Print a section header
 */
export function printSection(title: string): void {
  console.log('');
  console.log(chalk.blue(`▸ ${title}`));
  console.log(chalk.blue('────────────────────────────────────────────────────'));
}

/**
 * Print a header with borders
 */
export function printHeader(title: string): void {
  console.log('');
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan(`  ${title}`));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('');
}

/**
 * Validation result logging
 */
export const result = {
  critical: (message: string): void => {
    console.log(`  ${chalk.red('✗ [CRITICAL]')} ${message}`);
  },
  high: (message: string): void => {
    console.log(`  ${chalk.yellow('⚠ [HIGH]')} ${message}`);
  },
  medium: (message: string): void => {
    console.log(`  ${chalk.magenta('○ [MEDIUM]')} ${message}`);
  },
  pass: (message: string, verbose = false): void => {
    if (verbose) {
      console.log(`  ${chalk.green('✓')} ${message}`);
    }
  },
  fixed: (message: string): void => {
    console.log(`  ${chalk.green('⚡ [FIXED]')} ${message}`);
  },
};

/**
 * Create a logger instance with a prefix
 */
export function createLogger(prefix: string) {
  return {
    info: (message: string) => logInfo(`[${prefix}] ${message}`),
    success: (message: string) => logSuccess(`[${prefix}] ${message}`),
    warning: (message: string) => logWarning(`[${prefix}] ${message}`),
    error: (message: string) => logError(`[${prefix}] ${message}`),
    debug: (message: string, verbose = false) => logDebug(`[${prefix}] ${message}`, verbose),
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);

  if (absBytes < 1024) {
    return `${bytes} B`;
  }

  const exp = Math.min(Math.floor(Math.log(absBytes) / Math.log(1024)), units.length - 1);
  const value = absBytes / Math.pow(1024, exp);

  return `${isNegative ? '-' : ''}${value.toFixed(2)} ${units[exp]}`;
}
