import type { Request, Response } from "express";
import { z } from "zod";
import {
  AccessDeniedError,
  ForbiddenActionError,
  projectService,
} from "./project.service.js";

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

function getOrganizationSlug(req: Request) {
  return req.header("x-organization-slug");
}

function handleError(res: Response, error: unknown) {
  if (
    error instanceof AccessDeniedError ||
    error instanceof ForbiddenActionError
  ) {
    return res.status(403).json({ error: error.message });
  }

  console.error("Projects API error:", error);
  return res.status(500).json({ error: "Internal server error" });
}

export const projectController = {
  async list(req: Request, res: Response) {
    const user = req.authUser;
    const organizationSlug = getOrganizationSlug(req);

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!organizationSlug) {
      return res.status(400).json({
        error: "Missing x-organization-slug header",
      });
    }

    try {
      const projects = await projectService.listProjects(
        user.keycloakId,
        organizationSlug,
      );

      return res.json({ data: projects });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async create(req: Request, res: Response) {
    const user = req.authUser;
    const organizationSlug = getOrganizationSlug(req);

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!organizationSlug) {
      return res.status(400).json({
        error: "Missing x-organization-slug header",
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
        user.keycloakId,
        organizationSlug,
        parsed.data,
      );

      return res.status(201).json({ data: project });
    } catch (error) {
      return handleError(res, error);
    }
  },
};
