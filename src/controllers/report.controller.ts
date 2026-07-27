import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Parser } from "json2csv";
import Violation from "../models/Violation";
import { AuthRequest } from "../middleware/auth";

// GET /api/reports/violations/export?status=&department=&from=&to=
export const exportViolations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, department, from, to } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (from || to) {
    filter.detectedAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  const violations = await Violation.find(filter)
    .populate("worker", "name workerId department jobProfile")
    .populate("acknowledgedBy", "name")
    .sort({ detectedAt: -1 });

  const rows = violations.map((v: any) => ({
    ViolationID: v._id.toString(),
    WorkerName: v.worker?.name || "Unknown",
    WorkerID: v.worker?.workerId || "-",
    Department: v.department,
    JobProfile: v.worker?.jobProfile || "-",
    PPEType: v.ppeType,
    Severity: v.severity,
    Site: v.site,
    Location: v.location,
    Status: v.status,
    DetectedAt: v.detectedAt.toISOString(),
    AcknowledgedAt: v.acknowledgedAt ? v.acknowledgedAt.toISOString() : "",
    AcknowledgedBy: v.acknowledgedBy?.name || "",
    EscalatedAt: v.escalatedAt ? v.escalatedAt.toISOString() : "",
  }));

  const fields = [
    "ViolationID",
    "WorkerName",
    "WorkerID",
    "Department",
    "JobProfile",
    "PPEType",
    "Severity",
    "Site",
    "Location",
    "Status",
    "DetectedAt",
    "AcknowledgedAt",
    "AcknowledgedBy",
    "EscalatedAt",
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(`violations-report-${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});
