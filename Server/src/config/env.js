import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const requiredProductionVariables = ["JWT_SECRET", "MONGO_URI", "CORS_ORIGIN"];
const missingProductionVariables =
  nodeEnv === "production"
    ? requiredProductionVariables.filter((name) => !process.env[name]?.trim())
    : [];

if (missingProductionVariables.length > 0) {
  throw new Error(
    `Missing required production environment variables: ${missingProductionVariables.join(", ")}`,
  );
}

if (nodeEnv === "production" && corsOrigin.length === 0) {
  throw new Error("CORS_ORIGIN must contain at least one allowed frontend origin in production.");
}

const jwtSecret =
  process.env.JWT_SECRET || (nodeEnv === "development" ? "dev_secret_change_me" : "");

if (nodeEnv === "production" && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production.");
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin,
  seedPassword:
    process.env.SEED_PASSWORD || (nodeEnv === "development" ? "demo1234" : undefined),
  mongoUri:
    process.env.MONGO_URI ||
    (nodeEnv === "development" ? "mongodb://localhost:27017/dengueguard" : ""),
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:5001",
};
