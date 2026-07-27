import { Response } from "express";
import asyncHandler from "express-async-handler";
import Violation from "../models/Violation";
import { AuthRequest } from "../middleware/auth";

// GET /api/violations
// Supports filtering by status, department, ppeType, site and a search on worker via populate.
export const listViolations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    status,
    department,
    ppeType,
    from,
    to,
    page = "1",
    limit = "20",
  } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (ppeType) filter.ppeType = ppeType;
  if (from || to) {
    filter.detectedAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 200);

  const [violations, total] = await Promise.all([
    Violation.find(filter)
      .populate("worker", "name workerId department jobProfile")
      .populate("acknowledgedBy", "name")
      .sort({ detectedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Violation.countDocuments(filter),
  ]);

  res.json({ violations, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// GET /api/violations/alerts  (admin only)
// Only violations that have been escalated (unacknowledged for the configured window)
export const listAlerts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const alerts = await Violation.find({ status: "escalated" })
    .populate("worker", "name workerId department jobProfile")
    .sort({ escalatedAt: -1 });
  res.json(alerts);
});

// PATCH /api/violations/:id/acknowledge  (supervisor)
export const acknowledgeViolation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const violation = await Violation.findById(req.params.id);
  if (!violation) {
    res.status(404);
    throw new Error("Violation not found");
  }
  if (violation.status === "acknowledged") {
    res.status(400);
    throw new Error("Violation already acknowledged");
  }

  violation.status = "acknowledged";
  violation.acknowledgedAt = new Date();
  violation.acknowledgedBy = req.user!.id as any;
  await violation.save();

  res.json(violation);
});

// POST /api/violations/simulate  (admin/supervisor) - manually trigger a demo violation event
export const simulateViolation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { generateRandomViolation } = await import("../services/simulator");
  const violation = await generateRandomViolation();
  if (!violation) {
    res.status(400);
    throw new Error("No workers available to simulate a violation for. Seed the database first.");
  }
  res.status(201).json(violation);
});
