import type { Request, Response } from "express";
import { projectService } from "./project.service.js";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

export const projectController = {
  async list(_req: Request, res: Response) {
    try {
      const projects = await projectService.listProjects();
      return res.json({ data: projects });
    } catch (error) {
      console.error("Failed to list projects:", error);
      return res.status(500).json({
        error: "Failed to retrieve projects",
      });
    }
  },

  async create(req: Request, res: Response) {
    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid project data",
        details: parsed.error.flatten(),
      });
    }

    try {
      const project = await projectService.createProject(parsed.data);
      return res.status(201).json({ data: project });
    } catch (error) {
      console.error("Failed to create project:", error);
      return res.status(500).json({
        error: "Failed to create project",
      });
    }
  },
};
