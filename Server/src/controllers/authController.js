import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.js";
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

  const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
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

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    id: nextId("U"),
    name,
    email: String(email).toLowerCase(),
    mobile: mobile || "",
    address: address || "",
    passwordHash,
    role: "citizen",
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  });

  res.status(201).json(authResponse(user.toObject()));
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

  const user = await User.findOne({ email: String(email).toLowerCase() });

  if (!user) {
    throw new ApiError(404, "No account found with this email address");
  }

  // Generate a cryptographically secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store only the hashed token in MongoDB
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  // The URL sent in the email uses the RAW token (not the hashed one)
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
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0d9488,#06b6d4);padding:36px 40px;text-align:center;">
                <div style="display:inline-flex;align-items:center;gap:12px;">
                  <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-block;line-height:48px;text-align:center;">
                    <span style="font-size:24px;">🛡️</span>
                  </div>
                </div>
                <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">AI Dengue Prevention System</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">DengueGuard AI · Password Reset</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:700;">Password Reset Request</h2>
                <p style="margin:0 0 8px;color:#475569;font-size:15px;">Hello <strong>${user.name || "User"}</strong>,</p>
                <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                  We received a request to reset the password for your <strong>AI Dengue Prevention System</strong> account.
                  Click the button below to create a new password.
                </p>
                <!-- CTA Button -->
                <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:12px;">
                      <a href="${resetUrl}"
                         style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;"
                         target="_blank">
                        Reset My Password
                      </a>
                    </td>
                  </tr>
                </table>
                <!-- Expiry notice -->
                <div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
                  <p style="margin:0;color:#854d0e;font-size:13px;font-weight:600;">⏱️ This link expires in <strong>15 minutes</strong>.</p>
                </div>
                <!-- Link fallback -->
                <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin:0 0 28px;word-break:break-all;">
                  <a href="${resetUrl}" style="color:#0d9488;font-size:12px;">${resetUrl}</a>
                </p>
                <!-- Ignore notice -->
                <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
                  <p style="margin:0;color:#94a3b8;font-size:13px;">
                    If you did not request a password reset, you can safely ignore this email.
                    Your password will remain unchanged.
                  </p>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  © ${new Date().getFullYear()} AI Dengue Prevention System. All rights reserved.<br>
                  This is an automated message — please do not reply.
                </p>
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
    // Clean up the token so the user can try again
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    throw new ApiError(500, "Failed to send password reset email. Please try again later.");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "New password is required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  // Hash token received from URL
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Reset link is invalid or has expired",
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Note: the model uses passwordHash, not password
  user.passwordHash = hashedPassword;

  // Remove reset token
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});
