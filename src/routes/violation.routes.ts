import { Router } from "express";
import {
  listViolations,
  listAlerts,
  acknowledgeViolation,
  simulateViolation,
} from "../controllers/violation.controller";
import { protect } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.use(protect);

router.get("/", listViolations);
router.get("/alerts", requireRole("admin"), listAlerts);
router.patch("/:id/acknowledge", requireRole("supervisor"), acknowledgeViolation);
router.post("/simulate", simulateViolation);

export default router;
