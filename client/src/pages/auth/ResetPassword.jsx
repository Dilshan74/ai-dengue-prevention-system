import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../../components/common/Button";
import { FormField, Input } from "../../components/common/Field";
import { rules, validate } from "../../utils/validators";
import authService from "../../services/authService";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "error"
  const [apiError, setApiError] = useState("");

  // If no token in the URL, show invalid link immediately
  const hasToken = Boolean(token);

  // Auto-redirect to login after successful reset
  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const onChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setApiError("");
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setApiError("");

    // Client-side validation
    const nextErrors = validate(values, {
      password: [
        rules.required("Password is required"),
        rules.password("Use at least 8 characters"),
      ],
      confirmPassword: [
        rules.required("Please confirm your password"),
        rules.matches("password", "Passwords do not match"),
      ],
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      const data = await authService.resetPassword(token, values.password);

      if (data?.success) {
        setStatus("success");
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message ?? "";

      // Distinguish between expired and invalid token errors
      if (
        serverMsg.toLowerCase().includes("expired") ||
        err?.response?.status === 400
      ) {
        // Could be either expired or invalid — check the message
        if (serverMsg.toLowerCase().includes("expired")) {
          setApiError(
            "Your password reset link has expired. Please request a new password reset link."
          );
        } else {
          setApiError(
            serverMsg ||
              "Invalid or expired password reset link. Please request a new one."
          );
        }
      } else {
        setApiError(
          serverMsg || "Unable to reset password. Please try again."
        );
      }
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ── No token in URL ──────────────────────────────────────────────────────
  if (!hasToken) {
    return (
      <>
        <h1 className="text-xl font-bold text-foreground">Invalid Link</h1>
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Invalid password reset link</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This link is invalid or has already been used.
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/forgot-password"
          className="mt-6 flex justify-center items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Request a new reset link
        </Link>
      </>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <>
        <h1 className="text-xl font-bold text-foreground">Password Reset</h1>
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">
                Password reset successfully!
              </p>
              <p className="mt-1 text-sm text-emerald-700 leading-relaxed">
                Your password has been updated. You can now sign in with your
                new password.
              </p>
              <p className="mt-2 text-xs text-emerald-600">
                Redirecting you to the login page in a moment…
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button as="a" href="/login" className="w-full">
            Go to Sign In
          </Button>
        </div>
      </>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────
  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Choose a New Password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your new password below. Use at least 8 characters.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {/* New Password */}
        <FormField label="New Password" htmlFor="rp-password" error={errors.password}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="rp-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={values.password}
              onChange={onChange("password")}
              disabled={loading}
              autoComplete="new-password"
              className={[
                "h-9 w-full rounded border border-input bg-white pl-9 pr-10 text-sm text-foreground",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
                errors.password ? "border-destructive" : "",
              ].join(" ")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </FormField>

        {/* Confirm Password */}
        <FormField
          label="Confirm New Password"
          htmlFor="rp-confirm"
          error={errors.confirmPassword}
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="rp-confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={values.confirmPassword}
              onChange={onChange("confirmPassword")}
              disabled={loading}
              autoComplete="new-password"
              className={[
                "h-9 w-full rounded border border-input bg-white pl-9 pr-10 text-sm text-foreground",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
                errors.confirmPassword ? "border-destructive" : "",
              ].join(" ")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </FormField>

        {/* API-level error (expired / invalid token) */}
        {apiError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-xs font-medium text-destructive">{apiError}</p>
            </div>
          </div>
        )}

        {/* Request new link shortcut after error */}
        {status === "error" && (
          <p className="text-center text-sm text-muted-foreground">
            <Link
              to="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Request a new reset link
            </Link>
          </p>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={loading}
          id="rp-submit-btn"
        >
          {loading ? "Resetting…" : "Reset Password"}
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 flex justify-center items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </>
  );
}
