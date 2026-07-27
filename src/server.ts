import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { startSimulation } from "./services/simulator";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  startSimulation();
  app.listen(PORT, () => {
    console.log(`[server] PPE Monitoring API running on http://localhost:${PORT}`);
  });
};

start();
