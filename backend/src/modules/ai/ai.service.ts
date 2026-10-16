import { z } from "zod";
import { aiRepository } from "./ai.repository.js";
import { AiCircuitOpenError, aiCircuitBreaker } from "./aiCicuitBreaker.js";
import { logger } from "../../lib/logger.js";
import { AiBulkheadFullError, aiBulkhead } from "./aiBulkhead.js";

const aiResponseSchema = z.object({
  answer: z.string(),
  mode: z.string(),
});

const AI_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 500;

const RETRYABLE_STATUS_CODES = new Set([
  429, // Too many requests
  500, // Internal server error
  502, // Bad gateway
  503, // Service unavailable
  504, // Gateway timeout
]);

type AiPayload = {
  question: string;
  project_name: string;
};

export class AiAccessDeniedError extends Error {
  constructor() {
    super("Project not found or access denied");
    this.name = "AiAccessDeniedError";
  }
}

export class AiServiceUnavailableError extends Error {
  constructor() {
    super("AI service is unavailable");
    this.name = "AiServiceUnavailableError";
  }
}

export class AiServiceTimeoutError extends Error {
  constructor() {
    super("AI service request timed out");
    this.name = "AiServiceTimeoutError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestAiWithRetry(
  url: string,
  payload: AiPayload,
): Promise<unknown> {
  let lastError: unknown;
  let lastFailureWasTimeout = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
      lastFailureWasTimeout =
        error instanceof Error && error.name === "TimeoutError";

      if (attempt === MAX_ATTEMPTS) {
        break;
      }

      const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);

      logger.warn(
        {
          attempt,
          nextAttempt: attempt + 1,
          delayMs,
          err: error,
        },
        "AI request failed; retrying",
      );

      await sleep(delayMs);
      continue;
    }

    if (response.ok) {
      return await response.json();
    }

    lastError = new Error(`AI returned HTTP ${response.status}`);
    lastFailureWasTimeout = false;

    if (!RETRYABLE_STATUS_CODES.has(response.status)) {
      logger.error(
        { status: response.status },
        "AI service returned a non-retryable response",
      );

      throw new AiServiceUnavailableError();
    }

    if (attempt === MAX_ATTEMPTS) {
      break;
    }

    const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);

    logger.warn(
      {
        attempt,
        status: response.status,
        nextAttempt: attempt + 1,
        delayMs,
      },
      "AI service returned a retryable response; retrying",
    );

    await sleep(delayMs);
  }

  logger.error(
    {
      err: lastError,
      attempts: MAX_ATTEMPTS,
    },
    "AI request failed after all attempts",
  );

  if (lastFailureWasTimeout) {
    throw new AiServiceTimeoutError();
  }

  throw new AiServiceUnavailableError();
}

async function getContext(
  keycloakId: string,
  organizationSlug: string,
  projectId: string,
) {
  const [project, user] = await Promise.all([
    aiRepository.findAuthorizedProject(keycloakId, organizationSlug, projectId),
    aiRepository.findUser(keycloakId),
  ]);

  if (!project || !user) {
    throw new AiAccessDeniedError();
  }

  return { project, user };
}

export const aiService = {
  async ask(
    keycloakId: string,
    organizationSlug: string,
    projectId: string,
    question: string,
  ) {
    const { project, user } = await getContext(
      keycloakId,
      organizationSlug,
      projectId,
    );

    const url = `${
      process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"
    }/predict`;

    let answer: string;
    let mode: string;

    try {
      const rawResult = await aiBulkhead.execute(() =>
        aiCircuitBreaker.execute(() =>
          requestAiWithRetry(url, {
            question,
            project_name: project.name,
          }),
        ),
      );

      const result = aiResponseSchema.parse(rawResult);

      answer = result.answer;
      mode = result.mode;
    } catch (error) {
      if (
        error instanceof AiServiceTimeoutError ||
        error instanceof AiServiceUnavailableError
      ) {
        throw error;
      }

      logger.error({ err: error }, "AI service returned an invalid response");

      if (
        error instanceof AiServiceTimeoutError ||
        error instanceof AiServiceUnavailableError ||
        error instanceof AiCircuitOpenError ||
        error instanceof AiBulkheadFullError
      ) {
        throw error;
      }

      throw new AiServiceUnavailableError();
    }

    return aiRepository.saveInteraction({
      question,
      answer,
      mode,
      userId: user.id,
      organizationId: project.organizationId,
      projectId: project.id,
    });
  },

  async history(
    keycloakId: string,
    organizationSlug: string,
    projectId: string,
  ) {
    const { project } = await getContext(
      keycloakId,
      organizationSlug,
      projectId,
    );

    return aiRepository.listHistory(project.organizationId, project.id);
  },
};
