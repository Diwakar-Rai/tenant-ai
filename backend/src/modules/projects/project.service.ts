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
) {
  const membership = await projectRepository.findMembership(
    userEmail,
    organizationSlug,
  );

  if (!membership) {
    throw new AccessDeniedError();
  }

  return membership.organization;
}

export const projectService = {
  async listProjects(userEmail: string, organizationSlug: string) {
    const organization = await getAuthorizedOrganization(
      userEmail,
      organizationSlug,
    );

    return projectRepository.findAll(organization.id);
  },

  async createProject(
    userEmail: string,
    organizationSlug: string,
    data: { name: string; description?: string },
  ) {
    const organization = await getAuthorizedOrganization(
      userEmail,
      organizationSlug,
    );

    return projectRepository.create(organization.id, data);
  },
};
