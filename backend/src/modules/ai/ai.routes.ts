import { Router } from "express";
import { aiController } from "./ai.controller.js";
import { aiRateLimiter } from "../../middleware/aiRateLimiter.js";

const router = Router();

router.post("/projects/:projectId/ask", aiRateLimiter, aiController.ask);

router.get("/projects/:projectId/history", aiController.history);

export default router;
