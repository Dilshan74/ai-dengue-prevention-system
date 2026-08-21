import bcrypt from "bcryptjs";
import { usersStore } from "../data/stores.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler, nextId, ApiError } from "../utils/helpers.js";

function publicUser(user) {
  const { passwordHash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

/**
 * Response shape matches what AuthContext.login() destructures on the
 * frontend: { email, role, name, token }.
 */
function authResponse(user) {
  const token = signToken({ id: user.id, role: user.role });
  return { token, id: user.id, email: user.email, name: user.name, role: user.role };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = usersStore.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) throw new ApiError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  if (user.status === "Inactive" || user.status === "Suspended") {
    throw new ApiError(403, "Your account has been deactivated. Contact an administrator.");
  }

  res.json(authResponse(user));
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, mobile, password, address } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existing = usersStore.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextId("U"),
    name,
    email,
    mobile: mobile || "",
    address: address || "",
    passwordHash,
    role: "citizen",
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  };
  usersStore.insert(user);

  res.status(201).json(authResponse(user));
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — nothing to invalidate server-side in this demo backend.
  res.json({ success: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = usersStore.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  // Always respond success to avoid leaking which emails exist.
  if (user) {
    // In a real system this would email a reset token. For this demo backend
    // we log it to the console so it can be tested end-to-end.
    const resetToken = signToken({ id: user.id, purpose: "reset" });
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, "Token and new password are required");

  let payload;
  try {
    const { verifyToken } = await import("../utils/jwt.js");
    payload = verifyToken(token);
  } catch {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  if (payload.purpose !== "reset") throw new ApiError(400, "Invalid reset token");

  const passwordHash = await bcrypt.hash(password, 10);
  const updated = usersStore.update((u) => u.id === payload.id, { passwordHash });
  if (!updated) throw new ApiError(404, "User not found");

  res.json({ message: "Password has been reset successfully." });
});
