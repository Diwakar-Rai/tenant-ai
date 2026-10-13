import type { Request, Response } from "express";
import { z } from "zod";
import {
  AiAccessDeniedError,
  AiServiceUnavailableError,
  aiService,
} from "./ai.service.js";

const questionSchema = z.object({
  question: z.string().trim().min(1).max(2000),
});

function handleError(res: Response, error: unknown) {
  if (error instanceof AiAccessDeniedError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof AiServiceUnavailableError) {
    return res.status(502).json({ error: error.message });
  }

  console.error("AI API error:", error);
  return res.status(500).json({ error: "Internal server error" });
}

function getContext(req: Request, res: Response) {
  const keycloakId = req.authUser?.keycloakId;
  const organizationSlug = req.header("x-organization-slug");
  const projectId = req.params.projectId;

  if (!keycloakId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  if (!organizationSlug || !projectId || typeof projectId !== "string") {
    res.status(400).json({ error: "Organization and project required" });
    return null;
  }

  return { keycloakId, organizationSlug, projectId };
}

export const aiController = {
  async ask(req: Request, res: Response) {
    const context = getContext(req, res);
    if (!context) return;

    const parsed = questionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid question",
        details: parsed.error.flatten(),
      });
    }

    try {
      const interaction = await aiService.ask(
        context.keycloakId,
        context.organizationSlug,
        context.projectId,
        parsed.data.question,
      );

      return res.status(201).json({ data: interaction });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async history(req: Request, res: Response) {
    const context = getContext(req, res);
    if (!context) return;

    try {
      const history = await aiService.history(
        context.keycloakId,
        context.organizationSlug,
        context.projectId,
      );

      return res.json({ data: history });
    } catch (error) {
      return handleError(res, error);
    }
  },
};
