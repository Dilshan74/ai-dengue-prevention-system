import app from "./src/app.js";
import { env } from "./src/config/env.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express server after MongoDB connection succeeds
    app.listen(env.port, () => {
      console.log(
        `DengueGuard AI backend running on http://localhost:${env.port}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();