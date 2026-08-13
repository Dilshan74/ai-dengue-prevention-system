import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/common/Button";
import { FormField, Input } from "../../components/common/Field";
import { rules, validate } from "../../utils/validators";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate({ email }, { email: [rules.required(), rules.email()] });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSent(true);
    toast.success("Reset link sent");
  };

  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Reset Password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll email you a link to choose a new password.
      </p>

      {sent ? (
        <div className="mt-6 rounded border border-border bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-foreground">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">
            A reset link has been sent to {email} if an account exists.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <FormField label="Email Address" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
          </FormField>
          <Button type="submit" className="w-full mt-2">
            Send Reset Link
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
