import { Router } from "express";
import {
  listWorkers,
  listDepartments,
  departmentStats,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker,
} from "../controllers/worker.controller";
import { protect } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.use(protect);

router.get("/", listWorkers);
router.get("/departments", listDepartments);
router.get("/stats/department", departmentStats);
router.get("/:id", getWorker);

router.post("/", requireRole("admin"), createWorker);
router.put("/:id", requireRole("admin"), updateWorker);
router.delete("/:id", requireRole("admin"), deleteWorker);

export default router;
