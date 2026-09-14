import { ApiError } from "../utils/helpers.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err?.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  console.error("SERVER ERROR:", err);
  res.status(500).json({
    message: err?.message || "Internal server error",
    error: err?.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
  });
}
