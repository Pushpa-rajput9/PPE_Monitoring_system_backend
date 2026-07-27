import mongoose, { Schema, Document } from "mongoose";

export interface IWorker extends Document {
  name: string;
  workerId: string;
  jobProfile: string;
  department: string;
  mobileNumber: string;
  aadharNumber: string;
  site: string;
  isActive: boolean;
}

const WorkerSchema = new Schema<IWorker>(
  {
    name: { type: String, required: true, trim: true },
    workerId: { type: String, required: true, unique: true, trim: true },
    jobProfile: { type: String, required: true },
    department: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    site: { type: String, default: "Main Site" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IWorker>("Worker", WorkerSchema);
