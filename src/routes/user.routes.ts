import { Router } from "express";
import { listUsers, createUser, updateUserStatus, deleteUser } from "../controllers/user.controller";
import { protect } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.use(protect, requireRole("admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

export default router;
