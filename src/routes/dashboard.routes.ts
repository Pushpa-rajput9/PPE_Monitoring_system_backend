import { Router } from "express";
import { adminDashboard, supervisorDashboard, insights } from "../controllers/dashboard.controller";
import { protect } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.use(protect);

router.get("/admin", requireRole("admin"), adminDashboard);
router.get("/supervisor", requireRole("supervisor"), supervisorDashboard);
router.get("/insights", requireRole("admin", "supervisor"), insights);

export default router;
