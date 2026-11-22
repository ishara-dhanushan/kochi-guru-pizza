// tests/unit/mongoConflictRetry.test.ts
import { describe, expect, it } from "@jest/globals";
import {
  isRetryableMongoConflict,
  withMongoConflictRetry
} from "@utils/mongoConflictRetry";

const noDelay = {
  maxAttempts: 6,
  baseDelayMs: 0,
  maxDelayMs: 0,
  maxJitterMs: 0
};

describe("MongoDB conflict retries", () => {
  it("recovers after two transient conflicts", async () => {
    let attempts = 0;

    const result = await withMongoConflictRetry(async () => {
      attempts++;

      if (attempts < 3) {
        throw Object.assign(new Error("Write conflict"), {
          code: 112
        });
      }

      return "success";
    }, noDelay);

    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("stops at the configured attempt limit", async () => {
    let attempts = 0;
    const conflict = Object.assign(new Error("Conflict"), {
      code: 112
    });

    await expect(
      withMongoConflictRetry(
        async () => {
          attempts++;
          throw conflict;
        },
        { ...noDelay, maxAttempts: 3 }
      )
    ).rejects.toBe(conflict);

    expect(attempts).toBe(3);
  });

  it("does not retry duplicate-key errors", async () => {
    let attempts = 0;
    const duplicate = Object.assign(new Error("Duplicate"), {
      code: 11000
    });

    await expect(
      withMongoConflictRetry(async () => {
        attempts++;
        throw duplicate;
      }, noDelay)
    ).rejects.toBe(duplicate);

    expect(attempts).toBe(1);
  });

  it("recognizes transient transaction error labels", () => {
    expect(
      isRetryableMongoConflict({
        hasErrorLabel: (label: string) => label === "TransientTransactionError"
      })
    ).toBe(true);
  });

  it("does not retry uncertain transaction commits", () => {
    expect(
      isRetryableMongoConflict({
        code: 112,
        hasErrorLabel: (label: string) =>
          label === "UnknownTransactionCommitResult"
      })
    ).toBe(false);
  });

  it("rejects invalid retry settings", async () => {
    await expect(
      withMongoConflictRetry(async () => "success", { maxAttempts: 0 })
    ).rejects.toThrow("Invalid MongoDB retry options");
  });
});
