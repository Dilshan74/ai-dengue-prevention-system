import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Button from "../../components/common/Button";
import { FormField, Input } from "../../components/common/Field";
import { rules, validate } from "../../utils/validators";
import authService from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setApiError("");

    // Client-side validation
    const nextErrors = validate({ email }, { email: [rules.required(), rules.email()] });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      const data = await authService.forgotPassword(email);

      // Only mark as sent after backend confirms email was dispatched
      if (data?.success) {
        setSent(true);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Unable to send reset email. Please check your connection and try again.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Reset Password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll email you a link to choose a new password.
      </p>

      {sent ? (
        /* ── Success state ── */
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">Check your inbox!</p>
              <p className="mt-1 text-emerald-700 leading-relaxed">
                A password reset link has been sent to{" "}
                <strong>{email}</strong>. Please check your inbox and{" "}
                <strong>spam folder</strong>.
              </p>
              <p className="mt-2 text-emerald-600 text-xs">
                The link expires in 15 minutes.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Form state ── */
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <FormField label="Email Address" htmlFor="fp-email" error={errors.email}>
            <Input
              id="fp-email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setApiError("");
              }}
              error={errors.email}
              disabled={loading}
              autoComplete="email"
            />
          </FormField>

          {/* API-level error */}
          {apiError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {apiError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={loading}
            id="fp-submit-btn"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-6 flex justify-center items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </>
  );
}
