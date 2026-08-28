import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/helpers.js";
import User from "../models/user.js";

export async function verifyAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findOne({ id: payload.id }).lean();
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
