
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { prisma } from "../../lib/prisma.js";
import { createApp } from "../../app.js";
import { testAuth } from "./test-auth.js";

const app = createApp(testAuth);

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
          project.name === "Acme Demo Project",
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
          project.name === "Globex Demo Project",
      ),
    );

  });

  it("prevents a regular member from creating projects", async () => {
  const response = await request(app)
    .post("/api/projects")
    .set(globexHeaders)
    .send({ name: `Unauthorized Project ${Date.now()}` });

  assert.equal(response.status, 403);
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


it("rejects project creation when the name is missing", async () => {
  const response = await request(app)
    .post("/api/projects")
    .set(acmeHeaders)
    .send({ description: "A project without a name" });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid project data");
});

it("rejects project creation when the name is blank", async () => {
  const response = await request(app)
    .post("/api/projects")
    .set(acmeHeaders)
    .send({ name: "   " });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid project data");
});

});

after(async () => {
  await prisma.$disconnect();
});
