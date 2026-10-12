import type { Request, Response } from "express";
import { z } from "zod";
import { AccessDeniedError, projectService } from "./project.service.js";

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

function getIdentity(req: Request) {
  const email = req.header("x-dev-user-email");
  const organizationSlug = req.header("x-organization-slug");

  if (!email || !organizationSlug) {
    return null;
  }

  return { email, organizationSlug };
}

function handleError(res: Response, error: unknown) {
  if (error instanceof AccessDeniedError) {
    return res.status(403).json({ error: error.message });
  }

  console.error("Projects API error:", error);
  return res.status(500).json({ error: "Internal server error" });
}

export const projectController = {
  async list(req: Request, res: Response) {
    const identity = getIdentity(req);

    if (!identity) {
      return res.status(401).json({
        error: "Missing development identity or organization headers",
      });
    }

    try {
      const projects = await projectService.listProjects(
        identity.email,
        identity.organizationSlug,
      );

      return res.json({ data: projects });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async create(req: Request, res: Response) {
    const identity = getIdentity(req);

    if (!identity) {
      return res.status(401).json({
        error: "Missing development identity or organization headers",
      });
    }

    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid project data",
        details: parsed.error.flatten(),
      });
    }

    try {
      const project = await projectService.createProject(
        identity.email,
        identity.organizationSlug,
        parsed.data,
      );

      return res.status(201).json({ data: project });
    } catch (error) {
      return handleError(res, error);
    }
  },
};
