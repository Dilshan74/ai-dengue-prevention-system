import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/user.js";
import { usersStore } from "../data/stores.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler, nextId, ApiError } from "../utils/helpers.js";
import sendEmail from "../utils/sendEmail.js";

function publicUser(user) {
  const { passwordHash, ...rest } = user;
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

  const emailLower = String(email).toLowerCase();
  let user = null;

  if (mongoose.connection.readyState === 1) {
    try {
      user = await User.findOne({ email: emailLower }).lean();
    } catch (e) {
      user = usersStore.find((u) => u.email.toLowerCase() === emailLower);
    }
  } else {
    user = usersStore.find((u) => u.email.toLowerCase() === emailLower);
  }

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

  const emailLower = String(email).toLowerCase();
  let existing = null;

  if (mongoose.connection.readyState === 1) {
    try {
      existing = await User.findOne({ email: emailLower });
    } catch (e) {
      existing = usersStore.find((u) => u.email.toLowerCase() === emailLower);
    }
  } else {
    existing = usersStore.find((u) => u.email.toLowerCase() === emailLower);
  }

  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: nextId("U"),
    name,
    email: emailLower,
    mobile: mobile || "",
    address: address || "",
    passwordHash,
    role: "citizen",
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const created = await User.create(newUser);
      return res.status(201).json(authResponse(created.toObject()));
    } catch (e) {
      usersStore.insert(newUser);
      return res.status(201).json(authResponse(newUser));
    }
  }

  usersStore.insert(newUser);
  res.status(201).json(authResponse(newUser));
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — nothing to invalidate server-side.
  res.json({ success: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(String(email).trim())) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  const emailLower = String(email).toLowerCase();
  let user = null;

  if (mongoose.connection.readyState === 1) {
    try {
      user = await User.findOne({ email: emailLower });
    } catch (e) {
      user = usersStore.find((u) => u.email.toLowerCase() === emailLower);
    }
  } else {
    user = usersStore.find((u) => u.email.toLowerCase() === emailLower);
  }

  if (!user) {
    throw new ApiError(404, "No account found with this email address");
  }

  // Generate a cryptographically secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store hashed token
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

  if (mongoose.connection.readyState === 1 && user.save) {
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    await user.save();
  } else {
    usersStore.update((u) => u.id === user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    });
  }

  // The URL sent in the email uses the RAW token
  const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f0f9ff;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,165,164,0.1);">
            <tr>
              <td style="background:linear-gradient(135deg,#0d9488,#06b6d4);padding:36px 40px;text-align:center;">
                <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:700;">AI Dengue Prevention System</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Password Reset</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:700;">Password Reset Request</h2>
                <p style="margin:0 0 8px;color:#475569;font-size:15px;">Hello <strong>${user.name || "User"}</strong>,</p>
                <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                  Click the button below to reset your password.
                </p>
                <div style="text-align:center;margin-bottom:24px;">
                  <a href="${resetUrl}" style="background:#0d9488;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password</a>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset Your Password - AI Dengue Prevention System",
      html,
    });
    res.json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Forgot password email error:", error.message);
    res.json({
      success: true,
      message: "Password reset token generated. (Email service offline in demo mode)",
      devResetUrl: resetUrl,
    });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  let user = null;

  if (mongoose.connection.readyState === 1) {
    try {
      user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
    } catch (e) {
      user = usersStore.find(
        (u) => u.resetPasswordToken === hashedToken && u.resetPasswordExpires > Date.now()
      );
    }
  } else {
    user = usersStore.find(
      (u) => u.resetPasswordToken === hashedToken && u.resetPasswordExpires > Date.now()
    );
  }

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Reset link is invalid or has expired",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (mongoose.connection.readyState === 1 && user.save) {
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
  } else {
    usersStore.update((u) => u.id === user.id, {
      passwordHash: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});
