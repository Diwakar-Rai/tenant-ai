import { prisma } from "../../lib/prisma.js";

export const aiRepository = {
  findAuthorizedProject(
    keycloakId: string,
    organizationSlug: string,
    projectId: string,
  ) {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          slug: organizationSlug,
          memberships: {
            some: {
              user: { keycloakId },
            },
          },
        },
      },
      include: {
        organization: true,
      },
    });
  },

  findUser(keycloakId: string) {
    return prisma.user.findUnique({
      where: { keycloakId },
    });
  },

  saveInteraction(data: {
    question: string;
    answer: string;
    mode: string;
    userId: string;
    organizationId: string;
    projectId: string;
  }) {
    return prisma.aiInteraction.create({ data });
  },

  listHistory(organizationId: string, projectId: string) {
    return prisma.aiInteraction.findMany({
      where: { organizationId, projectId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  },
};
