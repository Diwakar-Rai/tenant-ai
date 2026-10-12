
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../lib/prisma.js";

const acmeHeaders = {
  "x-dev-user-email": "alice@acme.test",
  "x-organization-slug": "acme",
};

const globexHeaders = {
  "x-dev-user-email": "bob@globex.test",
  "x-organization-slug": "globex",
};

describe("Projects API tenant isolation", () => {
  it("allows an Acme member to list Acme projects", async () => {
    const response = await request(app)
      .get("/api/projects")
      .set(acmeHeaders);

    assert.equal(response.status, 200);
    assert.ok(
      response.body.data.some(
        (project: { name: string }) =>
          project.name === "Acme Dashboard",
      ),
    );
    assert.ok(
      response.body.data.every(
        (project: { organizationId: string }) =>
          project.organizationId ===
          response.body.data[0]?.organizationId,
      ),
    );
  });

  it("denies Alice access to Globex", async () => {
    const response = await request(app)
      .get("/api/projects")
      .set({
        "x-dev-user-email": "alice@acme.test",
        "x-organization-slug": "globex",
      });

    assert.equal(response.status, 403);
  });

  it("allows Bob to list Globex projects", async () => {
    const response = await request(app)
      .get("/api/projects")
      .set(globexHeaders);

    assert.equal(response.status, 200);
    assert.ok(
      response.body.data.some(
        (project: { name: string }) =>
          project.name === "Globex Analytics",
      ),
    );
  });

  it("creates a project within the authorized organization", async () => {
    const projectName = `Acme Test ${Date.now()}`;

    const response = await request(app)
      .post("/api/projects")
      .set(acmeHeaders)
      .send({ name: projectName });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.name, projectName);

    const globexResponse = await request(app)
      .get("/api/projects")
      .set(globexHeaders);

    assert.equal(globexResponse.status, 200);
    assert.ok(
      globexResponse.body.data.every(
        (project: { name: string }) =>
          project.name !== projectName,
      ),
    );
  });

  it("rejects requests without identity headers", async () => {
    const response = await request(app).get("/api/projects");

    assert.equal(response.status, 401);
  });
});

after(async () => {
  await prisma.$disconnect();
});
