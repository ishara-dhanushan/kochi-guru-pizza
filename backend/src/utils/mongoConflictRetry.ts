// src/utils/mongoConflictRetry.ts

export interface MongoRetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxJitterMs?: number;
}

// Read integer retry settings without silently accepting invalid values.
function readRetrySetting(
  name: string,
  defaultValue: number,
  minimum: number
): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`Invalid MongoDB retry setting: ${name}`);
  }

  return value;
}

/**
 * Recognize transient MongoDB write conflicts.
 * Duplicate keys and uncertain transaction commits must not be
 * blindly retried.
 */
export function isRetryableMongoConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    hasErrorLabel?: (label: string) => boolean;
  };

  if (candidate.code === 11000) {
    return false;
  }

  const hasLabel = (label: string): boolean =>
    typeof candidate.hasErrorLabel === "function" &&
    candidate.hasErrorLabel(label);

  if (hasLabel("UnknownTransactionCommitResult")) {
    return false;
  }

  return candidate.code === 112 || hasLabel("TransientTransactionError");
}

/**
 * Retry safe MongoDB operations with bounded exponential backoff.
 *
 * The operation must re-read database state on each attempt.
 * Do not use this wrapper for payment requests or other external
 * side effects.
 */
export async function withMongoConflictRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: MongoRetryOptions = {}
): Promise<T> {
  const maxAttempts =
    options.maxAttempts ??
    readRetrySetting("MONGO_CONFLICT_MAX_ATTEMPTS", 6, 1);

  const baseDelayMs =
    options.baseDelayMs ??
    readRetrySetting("MONGO_CONFLICT_BASE_DELAY_MS", 100, 0);

  const maxDelayMs =
    options.maxDelayMs ??
    readRetrySetting("MONGO_CONFLICT_MAX_DELAY_MS", 2000, 0);

  const maxJitterMs =
    options.maxJitterMs ??
    readRetrySetting("MONGO_CONFLICT_MAX_JITTER_MS", 100, 0);

  if (
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > 20 ||
    ![baseDelayMs, maxDelayMs, maxJitterMs].every(
      (value) => Number.isSafeInteger(value) && value >= 0
    )
  ) {
    throw new Error("Invalid MongoDB retry options");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (!isRetryableMongoConflict(error) || attempt === maxAttempts) {
        throw error;
      }

      const backoffMs = Math.min(maxDelayMs, baseDelayMs * 3 ** (attempt - 1));

      const jitterMs = Math.floor(Math.random() * (maxJitterMs + 1));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, backoffMs + jitterMs);
      });
    }
  }

  throw new Error("MongoDB retry attempts exhausted");
}
