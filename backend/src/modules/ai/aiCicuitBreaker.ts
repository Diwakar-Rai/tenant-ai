import { logger } from "../../lib/logger.js";

const FAILURE_THRESHOLD = 3;
const OPEN_DURATION_MS = 15_000;

type CircuitState = "closed" | "open" | "half-open";

export class AiCircuitOpenError extends Error {
  constructor() {
    super("AI service circuit breaker is open");
    this.name = "AiCircuitOpenError";
  }
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openedAt = 0;
  private probeInFlight = false;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      const cooldownElapsed = Date.now() - this.openedAt >= OPEN_DURATION_MS;

      if (!cooldownElapsed) {
        throw new AiCircuitOpenError();
      }

      this.state = "half-open";

      logger.info("AI circuit breaker entered half-open state");
    }

    if (this.state === "half-open") {
      if (this.probeInFlight) {
        throw new AiCircuitOpenError();
      }

      this.probeInFlight = true;

      try {
        const result = await operation();

        this.state = "closed";
        this.consecutiveFailures = 0;

        logger.info("AI circuit breaker closed after successful probe");

        return result;
      } catch (error) {
        this.openCircuit();

        logger.warn(
          { err: error },
          "AI circuit breaker reopened after failed probe",
        );

        throw error;
      } finally {
        this.probeInFlight = false;
      }
    }

    try {
      const result = await operation();

      this.consecutiveFailures = 0;

      return result;
    } catch (error) {
      this.consecutiveFailures += 1;

      logger.warn(
        {
          failures: this.consecutiveFailures,
          threshold: FAILURE_THRESHOLD,
        },
        "AI circuit breaker recorded a failure",
      );

      if (this.consecutiveFailures >= FAILURE_THRESHOLD) {
        this.openCircuit();
      }

      throw error;
    }
  }

  private openCircuit(): void {
    this.state = "open";
    this.openedAt = Date.now();
    this.consecutiveFailures = FAILURE_THRESHOLD;

    logger.error({ cooldownMs: OPEN_DURATION_MS }, "AI circuit breaker opened");
  }
}

export const aiCircuitBreaker = new CircuitBreaker();
