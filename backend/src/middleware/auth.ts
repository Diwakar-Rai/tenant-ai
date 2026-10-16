import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const issuer =
  process.env.KEYCLOAK_ISSUER ?? "http://localhost:8081/realms/tenant-ai";

const jwksUrl =
  process.env.KEYCLOAK_JWKS_URL ?? `${issuer}/protocol/openid-connect/certs`;

const jwks = createRemoteJWKSet(new URL(jwksUrl));

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        keycloakId: string;
        email: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Missing bearer access token",
    });
  }

  try {
    const { payload } = await jwtVerify(match[1], jwks, {
      issuer,
    });

    if (
      payload.azp !== "tenant-ai-frontend" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        error: "Invalid token or required identity claims missing",
      });
    }

    req.authUser = {
      keycloakId: payload.sub,
      email: payload.email,
    };

    return next();
  } catch (error) {
    console.error("Keycloak token verification failed:", error);

    return res.status(401).json({
      error: "Invalid or expired access token",
    });
  }
}
