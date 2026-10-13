import { Router } from "express";
import { aiController } from "./ai.controller.js";

const router = Router();

router.post("/projects/:projectId/ask", aiController.ask);
router.get("/projects/:projectId/history", aiController.history);

export default router;
