import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/common/Button";
import { Checkbox, FormField, Input, Label } from "../../components/common/Field";
import useAuth from "../../hooks/useAuth";
import { ROLES, ROLE_HOME } from "../../utils/constants";
import { rules, validate } from "../../utils/validators";

const ROLE_TABS = [
  { value: ROLES.CITIZEN, label: "Citizen" },
  { value: ROLES.PHI, label: "PHI" },
  { value: ROLES.ADMIN, label: "Admin" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState(ROLES.CITIZEN);
  const [values, setValues] = useState({ email: "citizen@dengueguard.lk", password: "demo1234" });
  const [errors, setErrors] = useState({});

  const setRoleAndEmail = (nextRole) => {
    setRole(nextRole);
    setValues((current) => ({ ...current, email: `${nextRole}@dengueguard.lk` }));
  };

  const onChange = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values, {
      email: [rules.required(), rules.email()],
      password: [rules.required(), rules.password()],
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    login({ email: values.email, role });
    toast.success(`Welcome back — signed in as ${role.toUpperCase()}`);
    navigate(ROLE_HOME[role]);
  };

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome Back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-8 flex rounded-xl bg-secondary/50 p-1 mb-8">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setRoleAndEmail(tab.value)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-300 ${
              role === tab.value
                ? "bg-white text-primary shadow-sm dark:bg-slate-800"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-5">
        <FormField label="Email Address" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={values.email}
            onChange={onChange("email")}
            error={errors.email}
            className="h-12 bg-white/50 focus:bg-white transition-colors"
          />
        </FormField>

        <FormField error={errors.password}>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={values.password}
            onChange={onChange("password")}
            error={errors.password}
            className="h-12 bg-white/50 focus:bg-white transition-colors"
          />
        </FormField>

        <div className="flex items-center gap-3 pt-2">
          <Checkbox id="remember" defaultChecked className="h-5 w-5 rounded border-gray-300" />
          <Label htmlFor="remember" className="font-medium text-sm text-foreground cursor-pointer">
            Remember me for 30 days
          </Label>
        </div>

        <Button type="submit" size="lg" className="w-full mt-6 shadow-lg shadow-primary/20">
          Sign In to Dashboard
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
          Create an account
        </Link>
      </p>
    </div>
  );
}
