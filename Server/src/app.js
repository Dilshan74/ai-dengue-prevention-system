import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";
import phiRoutes from "./routes/phiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dengueRiskRoutes from "./routes/dengueRisk.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== "test") app.use(morgan("dev"));

// Serve uploaded images (report photos, inspection photos, AI predict input)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

import mongoose from "mongoose";

app.get("/", (req, res) => res.json({ message: "Welcome to DengueGuard AI API" }));
app.get("/api/health", (req, res) => res.json({ 
  status: "ok", 
  database: mongoose.connection.readyState === 1 ? "MongoDB Connected" : "Local Storage (MongoDB Disconnected)",
  dbHost: mongoose.connection.host || null,
  dbName: mongoose.connection.name || null,
  time: new Date().toISOString() 
}));

app.use("/api/auth", authRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/phi", phiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dengue-risk", dengueRiskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
