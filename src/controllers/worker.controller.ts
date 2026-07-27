import { Response } from "express";
import asyncHandler from "express-async-handler";
import Worker from "../models/Worker";
import { AuthRequest } from "../middleware/auth";

// GET /api/workers
export const listWorkers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { department, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { workerId: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  const [workers, total] = await Promise.all([
    Worker.find(filter)
      .sort({ workerId: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Worker.countDocuments(filter),
  ]);

  res.json({ workers, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// GET /api/workers/departments
export const listDepartments = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const departments = await Worker.distinct("department");
  res.json(departments.sort());
});

// GET /api/workers/stats/department - headcount per department, for charts
export const departmentStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await Worker.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json(stats.map((s) => ({ label: s._id, count: s.count })));
});

// GET /api/workers/:id
export const getWorker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    res.status(404);
    throw new Error("Worker not found");
  }
  res.json(worker);
});

// POST /api/workers
export const createWorker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const worker = await Worker.create(req.body);
  res.status(201).json(worker);
});

// PUT /api/workers/:id
export const updateWorker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!worker) {
    res.status(404);
    throw new Error("Worker not found");
  }
  res.json(worker);
});

// DELETE /api/workers/:id
export const deleteWorker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const worker = await Worker.findByIdAndDelete(req.params.id);
  if (!worker) {
    res.status(404);
    throw new Error("Worker not found");
  }
  res.json({ message: "Worker removed" });
});
