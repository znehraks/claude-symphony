/**
 * FIFO (Named Pipe) abstraction layer
 * Handles creation and reading of FIFO for inter-process communication
 */
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getConfig } from './config.js';
import { ensureDir } from '../utils/fs.js';
import type { RelaySignal } from './types.js';

/**
 * Check if a path is a FIFO (named pipe)
 */
export function isFifo(filepath: string): boolean {
  try {
    const stats = fs.statSync(filepath);
    return stats.isFIFO();
  } catch {
    return false;
  }
}

/**
 * Create a FIFO at the specified path
 * Removes existing file/FIFO if present
 */
export function createFifo(fifoPath?: string): boolean {
  const config = getConfig();
  const targetPath = fifoPath ?? config.fifoPath;

  try {
    // Ensure parent directory exists
    ensureDir(path.dirname(targetPath));

    // Remove existing file if present
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    // Create FIFO using mkfifo
    execSync(`mkfifo "${targetPath}"`, { stdio: 'pipe' });

    // Set permissions (600 - owner read/write only)
    fs.chmodSync(targetPath, 0o600);

    return true;
  } catch (error) {
    console.error(`Failed to create FIFO at ${targetPath}:`, error);
    return false;
  }
}

/**
 * Remove a FIFO
 */
export function removeFifo(fifoPath?: string): boolean {
  const config = getConfig();
  const targetPath = fifoPath ?? config.fifoPath;

  try {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Write a message to the FIFO
 * Non-blocking write
 */
export function writeToFifo(message: string, fifoPath?: string): boolean {
  const config = getConfig();
  const targetPath = fifoPath ?? config.fifoPath;

  try {
    if (!isFifo(targetPath)) {
      console.error(`FIFO not found at ${targetPath}`);
      return false;
    }

    // Write to FIFO (this will block until a reader is available)
    fs.writeFileSync(targetPath, message + '\n');
    return true;
  } catch (error) {
    console.error(`Failed to write to FIFO:`, error);
    return false;
  }
}

/**
 * Parse a signal string into RelaySignal object
 * Format: SIGNAL_TYPE:handoff_path:pane_id
 */
export function parseSignal(raw: string): RelaySignal | null {
  const trimmed = raw.trim();

  // Match RELAY_READY:path:pane format
  const match = trimmed.match(/^(RELAY_READY|RELAY_ACK):(.+):(.+)$/);
  if (!match || !match[1] || !match[2] || !match[3]) {
    return null;
  }

  return {
    type: match[1] as RelaySignal['type'],
    handoffPath: match[2],
    paneId: match[3],
  };
}

/**
 * Signal callback type
 */
export type SignalCallback = (signal: RelaySignal) => void;

/**
 * Start a FIFO reader using a bash subprocess
 * This is the recommended approach as bash handles blocking reads efficiently
 *
 * @param fifoPath - Path to the FIFO
 * @param onSignal - Callback for valid signals
 * @param onError - Callback for errors
 * @returns Cleanup function to stop the reader
 */
export function startFifoReader(
  fifoPath: string,
  onSignal: SignalCallback,
  onError?: (error: Error) => void
): () => void {
  // Use bash for efficient blocking reads
  const reader = spawn('bash', ['-c', `while read -r line; do echo "$line"; done < "${fifoPath}"`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  reader.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const signal = parseSignal(line);
      if (signal) {
        onSignal(signal);
      }
    }
  });

  reader.stderr?.on('data', (data: Buffer) => {
    const error = new Error(data.toString());
    if (onError) {
      onError(error);
    }
  });

  reader.on('error', (error) => {
    if (onError) {
      onError(error);
    }
  });

  // Return cleanup function
  return () => {
    reader.kill('SIGTERM');
  };
}

/**
 * Alternative FIFO reader using Node.js fs.createReadStream
 * Less efficient than bash but doesn't require subprocess
 *
 * Note: This may have issues with FIFO semantics in Node.js
 */
export function startFifoReaderNode(
  fifoPath: string,
  onSignal: SignalCallback,
  onError?: (error: Error) => void
): () => void {
  let active = true;

  const readLoop = () => {
    if (!active) return;

    const stream = fs.createReadStream(fifoPath, {
      encoding: 'utf8',
      flags: 'r',
    });

    let buffer = '';

    stream.on('data', (chunk: string | Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.trim()) {
          const signal = parseSignal(line);
          if (signal) {
            onSignal(signal);
          }
        }
      }
    });

    stream.on('end', () => {
      // FIFO closed, reopen
      if (active) {
        setTimeout(readLoop, 100);
      }
    });

    stream.on('error', (error) => {
      if (onError && active) {
        onError(error);
      }
      // Try to reopen on error
      if (active) {
        setTimeout(readLoop, 500);
      }
    });
  };

  readLoop();

  // Return cleanup function
  return () => {
    active = false;
  };
}
