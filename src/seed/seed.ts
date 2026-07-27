import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import User from "../models/User";
import Worker from "../models/Worker";
import Violation, { PPE_TYPES, ViolationSeverity } from "../models/Violation";
import workersData from "./workers.json";

const SEVERITIES: ViolationSeverity[] = ["low", "medium", "high"];
const LOCATIONS = ["Zone A", "Zone B", "Zone C", "Loading Bay", "Assembly Line 1", "Warehouse Floor"];
const randomFrom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

const run = async () => {
  await connectDB();

  console.log("[seed] clearing existing collections...");
  await Promise.all([User.deleteMany({}), Worker.deleteMany({}), Violation.deleteMany({})]);

  console.log(`[seed] inserting ${workersData.length} workers...`);
  const workers = await Worker.insertMany(
    workersData.map((w) => ({ ...w, site: "Main Site", isActive: true }))
  );

  console.log("[seed] creating default admin and supervisor accounts...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@ppesite.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  await User.create({
    name: "Site Administrator",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    site: "Main Site",
  });

  await User.create({
    name: "Rahul Verma",
    email: "supervisor@ppesite.com",
    password: "Supervisor@12345",
    role: "supervisor",
    site: "Main Site",
  });

  console.log("[seed] generating demo violation history (last 3 days)...");
  const violationDocs: Record<string, unknown>[] = [];
  for (let i = 0; i < 60; i++) {
    const worker = randomFrom(workers);
    const daysAgo = Math.floor(Math.random() * 3);
    const minutesAgo = Math.floor(Math.random() * 24 * 60);
    const detectedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - minutesAgo * 60 * 1000);
    const roll = Math.random();
    let status: "open" | "acknowledged" | "escalated" = "open";
    let acknowledgedAt: Date | undefined;
    let escalatedAt: Date | undefined;

    if (roll < 0.55) {
      status = "acknowledged";
      acknowledgedAt = new Date(detectedAt.getTime() + Math.floor(Math.random() * 9) * 60 * 1000);
    } else if (roll < 0.75) {
      status = "escalated";
      escalatedAt = new Date(detectedAt.getTime() + 10 * 60 * 1000);
    } else {
      status = daysAgo === 0 && minutesAgo < 10 ? "open" : "escalated";
      if (status === "escalated") escalatedAt = new Date(detectedAt.getTime() + 10 * 60 * 1000);
    }

    violationDocs.push({
      worker: worker._id,
      deviceId: `IOT-${Math.floor(1000 + Math.random() * 9000)}`,
      ppeType: randomFrom(PPE_TYPES),
      severity: randomFrom(SEVERITIES),
      site: "Main Site",
      department: worker.department,
      location: randomFrom(LOCATIONS),
      status,
      detectedAt,
      acknowledgedAt,
      escalatedAt,
    });
  }
  await Violation.insertMany(violationDocs);

  console.log("[seed] done.");
  console.log(`Admin login:      ${adminEmail} / ${adminPassword}`);
  console.log(`Supervisor login: supervisor@ppesite.com / Supervisor@12345`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
