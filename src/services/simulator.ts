import Worker from "../models/Worker";
import Violation, { PPE_TYPES, ViolationSeverity } from "../models/Violation";

const LOCATIONS = ["Zone A", "Zone B", "Zone C", "Loading Bay", "Assembly Line 1", "Assembly Line 2", "Warehouse Floor"];
const SEVERITIES: ViolationSeverity[] = ["low", "medium", "high"];

const randomFrom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const generateRandomViolation = async () => {
  const count = await Worker.countDocuments({ isActive: true });
  if (count === 0) return null;

  const randomSkip = Math.floor(Math.random() * count);
  const worker = await Worker.findOne({ isActive: true }).skip(randomSkip);
  if (!worker) return null;

  const violation = await Violation.create({
    worker: worker._id,
    deviceId: `IOT-${Math.floor(1000 + Math.random() * 9000)}`,
    ppeType: randomFrom(PPE_TYPES),
    severity: randomFrom(SEVERITIES),
    site: worker.site,
    department: worker.department,
    location: randomFrom(LOCATIONS),
    status: "open",
    detectedAt: new Date(),
  });

  return violation;
};
export const escalateOverdueViolations = async () => {
  const minutes = parseInt(process.env.ALERT_ESCALATION_MINUTES || "10", 10);
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  const result = await Violation.updateMany(
    { status: "open", detectedAt: { $lte: cutoff } },
    { $set: { status: "escalated", escalatedAt: new Date() } }
  );

  return result.modifiedCount;
};

let simulationTimer: NodeJS.Timeout | null = null;
let escalationTimer: NodeJS.Timeout | null = null;
export const startSimulation = () => {
  const intervalSeconds = parseInt(process.env.SIMULATION_INTERVAL_SECONDS || "45", 10);

  if (intervalSeconds > 0) {
    simulationTimer = setInterval(async () => {
      try {
        const v = await generateRandomViolation();
        if (v) console.log(`[simulator] new violation generated: ${v.ppeType} - worker ${v.worker}`);
      } catch (err) {
        console.error("[simulator] failed to generate violation:", err);
      }
    }, intervalSeconds * 1000);
  }

  escalationTimer = setInterval(async () => {
    try {
      const escalated = await escalateOverdueViolations();
      if (escalated > 0) console.log(`[simulator] escalated ${escalated} overdue violation(s) to admin alerts`);
    } catch (err) {
      console.error("[simulator] failed to escalate violations:", err);
    }
  }, 30 * 1000);

  console.log(
    `[simulator] started (new violation every ${intervalSeconds}s, escalation check every 30s, escalation window ${
      process.env.ALERT_ESCALATION_MINUTES || 10
    }m)`
  );
};

export const stopSimulation = () => {
  if (simulationTimer) clearInterval(simulationTimer);
  if (escalationTimer) clearInterval(escalationTimer);
};
