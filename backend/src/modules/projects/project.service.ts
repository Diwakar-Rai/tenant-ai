import { projectRepository } from "./project.repository.js";

export class AccessDeniedError extends Error {
  constructor(message = "User is not a member of this organization") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

async function getAuthorizedOrganization(
  userEmail: string,
  organizationSlug: string,
  keycloakId: string,
) {
  const membership = await projectRepository.findMembership(
    userEmail,
    organizationSlug,
    keycloakId,
  );

  if (!membership) {
    throw new AccessDeniedError();
  }

  return membership.organization;
}

export class ForbiddenActionError extends Error {
  constructor(message = "Administrator role required") {
    super(message);
    this.name = "ForbiddenActionError";
  }
}

async function getMembership(keycloakId: string, organizationSlug: string) {
  const membership = await projectRepository.findMembership(
    keycloakId,
    organizationSlug,
  );

  if (!membership) {
    throw new AccessDeniedError();
  }

  return membership;
}

export const projectService = {
  async listProjects(keycloakId: string, organizationSlug: string) {
    const membership = await getMembership(keycloakId, organizationSlug);

    return projectRepository.findAll(membership.organizationId);
  },

  async createProject(
    keycloakId: string,
    organizationSlug: string,
    data: { name: string; description?: string },
  ) {
    const membership = await getMembership(keycloakId, organizationSlug);

    if (membership.role !== "ADMIN") {
      throw new ForbiddenActionError();
    }

    return projectRepository.create(membership.organizationId, data);
  },
};
