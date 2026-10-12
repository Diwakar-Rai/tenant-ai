import express from "express";
import cors from "cors";
import pino from "pino";
import "dotenv/config";

const app = express();
const logger = pino();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.get("/api/info", (_req, res) => {
  res.json({
    name: "TenantAI",
    message: "Backend is working",
  });
});

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  logger.info({ port }, "TenantAI backend started");
});
