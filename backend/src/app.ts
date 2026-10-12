
import express from "express";
import cors from "cors";
import projectRoutes from "./modules/projects/project.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/projects", projectRoutes);

export default app;
