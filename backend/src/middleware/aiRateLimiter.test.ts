import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";

import { aiRateLimiter } from "./aiRateLimiter.js";

function createMockRequest(userId: string) {
  return {
    authUser: { keycloakId: userId },
  } as Request;
}

function createMockResponse() {
  const headers = new Map<string, string>();

  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers,

    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
      return this;
    },

    status(code: number) {
      this.statusCode = code;
      return this;
    },

    json(body: unknown) {
      this.body = body;
      return this;
    },
  };

  return res as unknown as Response & typeof res;
}

test("rate limiter allows 10 requests and rejects the 11th", () => {
  const userId = `rate-limit-test-${Date.now()}`;
  let nextCalls = 0;

  const next: NextFunction = () => {
    nextCalls += 1;
  };

  for (let i = 0; i < 10; i += 1) {
    const req = createMockRequest(userId);
    const res = createMockResponse();

    aiRateLimiter(req, res, next);

    assert.equal(res.statusCode, 200);
  }

  assert.equal(nextCalls, 10);

  const req = createMockRequest(userId);
  const res = createMockResponse();

  aiRateLimiter(req, res, next);

  assert.equal(res.statusCode, 429);
  assert.equal(nextCalls, 10);
  assert.equal(res.headers.get("x-ratelimit-remaining"), "0");
  assert.equal(res.headers.has("retry-after"), true);
});

test("rate limiter tracks different users independently", () => {
  const userA = `rate-limit-user-a-${Date.now()}`;
  const userB = `rate-limit-user-b-${Date.now()}`;

  const next: NextFunction = () => {};

  for (let i = 0; i < 10; i += 1) {
    aiRateLimiter(createMockRequest(userA), createMockResponse(), next);
  }

  const userBResponse = createMockResponse();

  aiRateLimiter(createMockRequest(userB), userBResponse, next);

  assert.equal(userBResponse.statusCode, 200);
  assert.equal(userBResponse.headers.get("x-ratelimit-remaining"), "9");
});
