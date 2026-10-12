import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: "alice@acme.test" },
    update: { name: "Alice" },
    create: {
      email: "alice@acme.test",
      name: "Alice",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@globex.test" },
    update: { name: "Bob" },
    create: {
      email: "bob@globex.test",
      name: "Bob",
    },
  });

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

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: alice.id,
        organizationId: acme.id,
      },
    },
    update: { role: "ADMIN" },
    create: {
      userId: alice.id,
      organizationId: acme.id,
      role: "ADMIN",
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: bob.id,
        organizationId: globex.id,
      },
    },
    update: { role: "MEMBER" },
    create: {
      userId: bob.id,
      organizationId: globex.id,
      role: "MEMBER",
    },
  });

  await prisma.project.upsert({
    where: { id: "acme-demo-project" },
    update: {},
    create: {
      id: "acme-demo-project",
      name: "Acme Dashboard",
      organizationId: acme.id,
    },
  });

  await prisma.project.upsert({
    where: { id: "globex-demo-project" },
    update: {},
    create: {
      id: "globex-demo-project",
      name: "Globex Analytics",
      organizationId: globex.id,
    },
  });

  console.log("Development organizations, users, and memberships ready.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
