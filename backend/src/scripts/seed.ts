import "dotenv/config";
import { PrismaClient, MembershipRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create organizations
  const acme = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: { name: "Acme Inc." },
    create: { name: "Acme Inc.", slug: "acme" },
  });

  const globex = await prisma.organization.upsert({
    where: { slug: "globex" },
    update: { name: "Globex Ltd." },
    create: { name: "Globex Ltd.", slug: "globex" },
  });

  // 2. Create users (email belongs to User, not Membership)
  const alice = await prisma.user.upsert({
    where: { email: "alice@acme.test" },
    update: {
      name: "Alice",
      keycloakId: "11111111-1111-4111-8111-111111111111",
    },
    create: {
      email: "alice@acme.test",
      name: "Alice",
      keycloakId: "11111111-1111-4111-8111-111111111111",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@globex.test" },
    update: {
      name: "Bob",
      keycloakId: "22222222-2222-4222-8222-222222222222",
    },
    create: {
      email: "bob@globex.test",
      name: "Bob",
      keycloakId: "22222222-2222-4222-8222-222222222222",
    },
  });

  // 3. Create memberships using the composite unique key
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: alice.id,
        organizationId: acme.id,
      },
    },
    update: { role: MembershipRole.ADMIN },
    create: {
      userId: alice.id,
      organizationId: acme.id,
      role: MembershipRole.ADMIN,
    },
  });

  await prisma.membership.upsert({
  where: {
    userId_organizationId: {
      userId: bob.id,
      organizationId: globex.id,
    },
  },
  update: { role: MembershipRole.MEMBER },
  create: {
    userId: bob.id,
    organizationId: globex.id,
    role: MembershipRole.MEMBER,
  },
});
  // 4. Create demo projects
  await prisma.project.upsert({
    where: { id: "acme-demo-project" },
    update: {
      name: "Acme Demo Project",
      organizationId: acme.id,
    },
    create: {
      id: "acme-demo-project",
      name: "Acme Demo Project",
      description: "Demo project for Acme Inc.",
      organizationId: acme.id,
    },
  });

  await prisma.project.upsert({
    where: { id: "globex-demo-project" },
    update: {
      name: "Globex Demo Project",
      organizationId: globex.id,
    },
    create: {
      id: "globex-demo-project",
      name: "Globex Demo Project",
      description: "Demo project for Globex Ltd.",
      organizationId: globex.id,
    },
  });

  console.log("TenantAI seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
