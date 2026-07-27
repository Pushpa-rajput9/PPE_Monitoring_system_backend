import { Router } from "express";
import { exportViolations } from "../controllers/report.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/violations/export", exportViolations);

export default router;
