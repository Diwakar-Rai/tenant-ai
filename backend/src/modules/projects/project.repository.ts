import { prisma } from "../../lib/prisma.js";

export const projectRepository = {
  findOrganizationBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug },
    });
  },

  findAll(organizationId: string) {
    return prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(organizationId: string, data: { name: string; description?: string }) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId,
      },
    });
  },
};
