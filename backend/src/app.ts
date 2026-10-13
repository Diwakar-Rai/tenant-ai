import express from "express";
import type { RequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import type { Options as PinoHttpOptions } from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { logger } from "./lib/logger.js";
import projectRoutes from "./modules/projects/project.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { register, metricsMiddleware } from "./lib/metric.js";

export function createApp(
  authMiddleware: RequestHandler = requireAuth,
) {
  const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-organization-slug",
      "x-request-id",
    ],
    exposedHeaders: ["x-request-id"],
  }),
);

app.use(express.json());

const pinoHttpOptions: PinoHttpOptions<
  IncomingMessage,
  ServerResponse
> = {
  logger,
  genReqId: (req) => {
    const incoming = req.headers["x-request-id"];

    if (
      typeof incoming === "string" &&
      /^[a-zA-Z0-9-]{1,64}$/.test(incoming)
    ) {
      return incoming;
    }

    return randomUUID();
  },
  customProps: (req) => ({
    requestId: req.id,
  }),
};

app.use(pinoHttp(pinoHttpOptions));
app.use((req, res, next) => {
  res.setHeader("x-request-id", String(req.id));
  next();
});
app.use(metricsMiddleware);
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});
app.get("/metrics", async (_req, res) => {
  try {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).send("Unable to collect metrics");
  }
});

app.use("/api/projects", authMiddleware, projectRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);

  return app;
}

const app = createApp();

export default app;
