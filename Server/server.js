import app from "./src/app.js";
import { env } from "./src/config/env.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

import { startNDCUUpdater } from "./src/jobs/ndcuUpdater.js";
import { updateNDCUDengueData } from "./src/services/ndcuService.js";

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express server after MongoDB connection succeeds
    app.listen(env.port, () => {
      console.log(
        `DengueGuard AI backend running on http://localhost:${env.port}`
      );
      
      // Start the scheduled job for NDCU updates
      startNDCUUpdater();
      
      // Run an initial update check without blocking the server start
      updateNDCUDengueData().catch(err => {
        console.error('[NDCU] Initial update check failed:', err.message);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();