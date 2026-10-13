
import type { RequestHandler } from "express";

const testUsers: Record<string, { keycloakId: string; email: string }> = {
  "alice@acme.test": {
    keycloakId: "11111111-1111-4111-8111-111111111111",
    email: "alice@acme.test",
  },
  "bob@globex.test": {
    keycloakId: "22222222-2222-4222-8222-222222222222",
    email: "bob@globex.test",
  },
};

export const testAuth: RequestHandler = (req, res, next) => {
  const email = req.header("x-dev-user-email");
  const user = email ? testUsers[email] : undefined;

  if (!user) {
    res.status(401).json({ error: "Unauthenticated test request" });
    return;
  }

  req.authUser = user;
  next();
};
