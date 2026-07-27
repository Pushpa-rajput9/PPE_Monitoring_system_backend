import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/ppe_monitoring";
  try {
    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err);
    process.exit(1);
  }
};
