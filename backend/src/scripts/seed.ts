
import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "tenant-ai-demo" },
    update: {},
    create: {
      name: "TenantAI Demo",
      slug: "tenant-ai-demo",
    },
  });

  console.log("Demo organization ready:", organization.name);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
