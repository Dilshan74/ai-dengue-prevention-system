import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  seedPassword: process.env.SEED_PASSWORD || "demo1234",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/dengueguard",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:5001",
};
