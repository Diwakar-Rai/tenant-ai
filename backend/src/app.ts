import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "./lib/logger.js";
import projectRoutes from "./modules/projects/project.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { register, metricsMiddleware } from "./lib/metric.js";

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

app.use(
  pinoHttp({
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
  }),
);
app.use((req, res, next) => {
  res.setHeader("x-request-id", req.id);
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

app.use("/api/projects", requireAuth, projectRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

export default app;
