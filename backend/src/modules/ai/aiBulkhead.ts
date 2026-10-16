import { logger } from "../../lib/logger.js";

const MAX_CONCURRENT_AI_OPERATIONS = 5;

export class AiBulkheadFullError extends Error {
  constructor() {
    super("AI service is handling too many concurrent requests");
    this.name = "AiBulkheadFullError";
  }
}

class Bulkhead {
  private activeOperations = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeOperations >= MAX_CONCURRENT_AI_OPERATIONS) {
      logger.warn(
        {
          activeOperations: this.activeOperations,
          limit: MAX_CONCURRENT_AI_OPERATIONS,
        },
        "AI bulkhead rejected a request",
      );

      throw new AiBulkheadFullError();
    }

    this.activeOperations += 1;

    try {
      return await operation();
    } finally {
      this.activeOperations -= 1;
    }
  }
}

export const aiBulkhead = new Bulkhead();
