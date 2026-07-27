import { Response } from "express";
import asyncHandler from "express-async-handler";
import Violation from "../models/Violation";
import Worker from "../models/Worker";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// GET /api/dashboard/admin
export const adminDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const today = startOfToday();

  const [totalWorkers, totalSupervisors, violationsToday, openViolations, escalatedAlerts, totalViolations] =
    await Promise.all([
      Worker.countDocuments({ isActive: true }),
      User.countDocuments({ role: "supervisor" }),
      Violation.countDocuments({ detectedAt: { $gte: today } }),
      Violation.countDocuments({ status: "open" }),
      Violation.countDocuments({ status: "escalated" }),
      Violation.countDocuments({}),
    ]);

  const acknowledgedTotal = await Violation.countDocuments({ status: { $in: ["acknowledged", "escalated"] } });
  const complianceRate =
    totalViolations === 0 ? 100 : Math.round(((totalViolations - openViolations - escalatedAlerts) / totalViolations) * 100);

  res.json({
    totalWorkers,
    totalSupervisors,
    violationsToday,
    openViolations,
    escalatedAlerts,
    totalViolations,
    acknowledgedTotal,
    complianceRate,
  });
});

// GET /api/dashboard/supervisor
export const supervisorDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const today = startOfToday();

  const [violationsToday, pendingAck, acknowledgedToday, escalatedToday] = await Promise.all([
    Violation.countDocuments({ detectedAt: { $gte: today } }),
    Violation.countDocuments({ status: "open" }),
    Violation.countDocuments({ status: "acknowledged", acknowledgedAt: { $gte: today } }),
    Violation.countDocuments({ status: "escalated", escalatedAt: { $gte: today } }),
  ]);

  // average response time (minutes) for violations acknowledged in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const acknowledged = await Violation.find({
    status: "acknowledged",
    acknowledgedAt: { $gte: sevenDaysAgo },
  }).select("detectedAt acknowledgedAt");

  let avgResponseMinutes = 0;
  if (acknowledged.length > 0) {
    const totalMinutes = acknowledged.reduce((sum, v) => {
      const diff = (v.acknowledgedAt!.getTime() - v.detectedAt.getTime()) / 60000;
      return sum + diff;
    }, 0);
    avgResponseMinutes = Math.round((totalMinutes / acknowledged.length) * 10) / 10;
  }

  res.json({ violationsToday, pendingAck, acknowledgedToday, escalatedToday, avgResponseMinutes });
});

// GET /api/dashboard/insights  (admin) - chart-ready aggregates
export const insights = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const byDepartment = await Violation.aggregate([
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const byPpeType = await Violation.aggregate([
    { $group: { _id: "$ppeType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const byStatus = await Violation.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  const trend = await Violation.aggregate([
    { $match: { detectedAt: { $gte: fourteenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$detectedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const bySeverity = await Violation.aggregate([
    { $group: { _id: "$severity", count: { $sum: 1 } } },
  ]);

  res.json({
    byDepartment: byDepartment.map((d) => ({ label: d._id, count: d.count })),
    byPpeType: byPpeType.map((d) => ({ label: d._id, count: d.count })),
    byStatus: byStatus.map((d) => ({ label: d._id, count: d.count })),
    bySeverity: bySeverity.map((d) => ({ label: d._id, count: d.count })),
    trend: trend.map((d) => ({ date: d._id, count: d.count })),
  });
});
