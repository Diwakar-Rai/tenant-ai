import { prisma } from "../../lib/prisma.js";

export const projectRepository = {
  findMembership(keycloakId: string, organizationSlug: string) {
    return prisma.membership.findFirst({
      where: {
        user: { keycloakId },
        organization: { slug: organizationSlug },
      },
      include: {
        organization: true,
        user: true,
      },
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
