import { z } from "zod";
import { aiRepository } from "./ai.repository.js";
import { logger } from "../../lib/logger.js";

const aiResponseSchema = z.object({
  answer: z.string(),
  mode: z.string(),
});

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

    let answer: string;
    let mode: string;

    try {
      const response = await fetch(
        `${process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"}/predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            project_name: project.name,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        throw new Error(`AI returned HTTP ${response.status}`);
      }

      const result = aiResponseSchema.parse(await response.json());

      answer = result.answer;
      mode = result.mode;
    } catch (error) {
      logger.error({ err: error }, "AI service request failed");
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
