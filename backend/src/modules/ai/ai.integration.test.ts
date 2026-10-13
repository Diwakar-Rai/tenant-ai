import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { prisma } from "../../lib/prisma.js";
import { createApp } from "../../app.js";
import { testAuth } from "../projects/test-auth.js";

const app = createApp(testAuth);

const acmeHeaders = {
  "x-dev-user-email": "alice@acme.test",
  "x-organization-slug": "acme",
};

const globexHeaders = {
  "x-dev-user-email": "bob@globex.test",
  "x-organization-slug": "globex",
};

describe("AI API tenant isolation", () => {
  it("allows an authorized user to ask a question and retrieve its history", async () => {
    const question = `Integration test ${Date.now()}`;
    const originalFetch = globalThis.fetch;

    // Mock only the external Python AI service.
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          answer: "This is a test AI response.",
          mode: "mock",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

    try {
      const response = await request(app)
        .post("/api/ai/projects/acme-demo-project/ask")
        .set(acmeHeaders)
        .send({ question });

      assert.equal(response.status, 201);
      assert.equal(response.body.data.question, question);
      assert.equal(response.body.data.answer, "This is a test AI response.");

      const historyResponse = await request(app)
        .get("/api/ai/projects/acme-demo-project/history")
        .set(acmeHeaders);

      assert.equal(historyResponse.status, 200);
      assert.ok(
        historyResponse.body.data.some(
          (item: { question: string }) => item.question === question,
        ),
      );

      // Remove the test interaction from the database.
      await prisma.aiInteraction.delete({
        where: { id: response.body.data.id },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("denies questions about another organization's project", async () => {
    const response = await request(app)
      .post("/api/ai/projects/globex-demo-project/ask")
      .set(acmeHeaders)
      .send({ question: "Show me project details" });

    assert.equal(response.status, 404);
  });

  it("denies access to another organization's AI history", async () => {
    const response = await request(app)
      .get("/api/ai/projects/acme-demo-project/history")
      .set(globexHeaders);

    assert.equal(response.status, 404);
  });

  it("rejects blank questions", async () => {
    const response = await request(app)
      .post("/api/ai/projects/acme-demo-project/ask")
      .set(acmeHeaders)
      .send({ question: "   " });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Invalid question");
  });
});

after(async () => {
  await prisma.$disconnect();
});
