import mongoose from "mongoose";
import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/helpers.js";
import User from "../models/user.js";
import { usersStore } from "../data/stores.js";

export async function verifyAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = verifyToken(token);
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ id: payload.id }).lean();
      } catch (e) {
        user = usersStore.find((u) => u.id === payload.id);
      }
    } else {
      user = usersStore.find((u) => u.id === payload.id);
    }

    if (!user) return next(new ApiError(401, "User no longer exists"));
    req.user = user;
    next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}
