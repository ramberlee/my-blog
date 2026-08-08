import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, "data");
const LOG_FILE = join(LOG_DIR, "error.log");

export function logError(message: string, error?: Error): void {
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const stack = error?.stack ?? "No stack trace";
    const entry = `[${timestamp}] ERROR: ${message}\n${stack}\n---\n`;

    appendFileSync(LOG_FILE, entry, "utf-8");
  } catch (writeErr) {
    console.error("Failed to write to error log:", writeErr);
  }
}
