import { projectRepository } from "./project.repository.js";

const demoOrgSlug = process.env.DEMO_ORG_SLUG || "tenant-ai-demo";

async function getDemoOrganization() {
  const organization =
    await projectRepository.findOrganizationBySlug(demoOrgSlug);

  if (!organization) {
    throw new Error("Demo organization not found. Run npm run db:seed first.");
  }

  return organization;
}

export const projectService = {
  async listProjects() {
    const organization = await getDemoOrganization();
    return projectRepository.findAll(organization.id);
  },

  async createProject(data: { name: string; description?: string }) {
    const organization = await getDemoOrganization();

    return projectRepository.create(organization.id, data);
  },
};
