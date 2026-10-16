import { test } from "node:test";
import assert from "node:assert/strict";

import { AiBulkheadFullError, aiBulkhead } from "./aiBulkhead.js";

test("bulkhead rejects requests beyond five concurrent operations", async () => {
  let releaseOperations!: () => void;

  const gate = new Promise<void>((resolve) => {
    releaseOperations = resolve;
  });

  // Start five operations and keep them running.
  const activeOperations = Array.from({ length: 5 }, (_, index) =>
    aiBulkhead.execute(async () => {
      await gate;
      return `operation-${index + 1}`;
    }),
  );

  try {
    // The sixth operation must be rejected immediately.
    await assert.rejects(
      aiBulkhead.execute(async () => "unexpected"),
      AiBulkheadFullError,
    );
  } finally {
    // Release all five operations, even if the assertion fails.
    releaseOperations();
  }

  const results = await Promise.all(activeOperations);

  assert.equal(results.length, 5);
  assert.equal(results[0], "operation-1");
  assert.equal(results[4], "operation-5");
});
