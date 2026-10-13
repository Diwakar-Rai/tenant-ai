import express from "express";
import cors from "cors";
import projectRoutes from "./modules/projects/project.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    allowedHeaders: ["Content-Type", "Authorization", "x-organization-slug"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/projects", requireAuth, projectRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

export default app;
