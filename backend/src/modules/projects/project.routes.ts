import { Router } from "express";
import { projectController } from "./project.controller.js";

const router = Router();

router.get("/", projectController.list);
router.post("/", projectController.create);

export default router;
