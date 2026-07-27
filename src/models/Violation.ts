import mongoose, { Schema, Document, Types } from "mongoose";

export type ViolationStatus = "open" | "acknowledged" | "escalated";
export type ViolationSeverity = "low" | "medium" | "high";

export const PPE_TYPES = [
  "Helmet",
  "Safety Vest",
  "Safety Goggles",
  "Gloves",
  "Safety Boots",
  "Ear Protection",
  "Harness",
  "Face Mask",
] as const;

export interface IViolation extends Document {
  worker: Types.ObjectId;
  deviceId: string;
  ppeType: string;
  severity: ViolationSeverity;
  site: string;
  department: string;
  location: string;
  status: ViolationStatus;
  detectedAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: Types.ObjectId;
  escalatedAt?: Date;
  notes?: string;
}

const ViolationSchema = new Schema<IViolation>(
  {
    worker: { type: Schema.Types.ObjectId, ref: "Worker", required: true },
    deviceId: { type: String, required: true },
    ppeType: { type: String, required: true, enum: PPE_TYPES },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    site: { type: String, required: true, default: "Main Site" },
    department: { type: String, required: true },
    location: { type: String, default: "Zone A" },
    status: { type: String, enum: ["open", "acknowledged", "escalated"], default: "open" },
    detectedAt: { type: Date, required: true, default: Date.now },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
    escalatedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

ViolationSchema.index({ status: 1, detectedAt: -1 });

export default mongoose.model<IViolation>("Violation", ViolationSchema);
