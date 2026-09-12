import app from "./src/app.js";
import { env } from "./src/config/env.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

import { startNDCUUpdater } from "./src/jobs/ndcuUpdater.js";
import { updateNDCUDengueData } from "./src/services/ndcuService.js";

const startServer = async () => {
  try {
    // Attempt MongoDB connection if available
    await connectDB();
  } catch (error) {
    console.warn("MongoDB connection skipped/failed, proceeding with local storage fallback.");
  }

  app.listen(env.port, () => {
    console.log(`DengueGuard AI backend running on http://localhost:${env.port}`);
    
    // Start the scheduled job for NDCU updates
    try {
      startNDCUUpdater();
      updateNDCUDengueData().catch((err) => {
        console.error("[NDCU] Initial update check failed:", err.message);
      });
    } catch (e) {
      console.warn("NDCU updater startup note:", e.message);
    }
  });
};

startServer();