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
    <>
      <h1 className="text-xl font-bold text-foreground">Sign In</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your details to access the system
      </p>

      <div className="mt-6 flex border-b border-border">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setRoleAndEmail(tab.value)}
            className={`flex-1 pb-2 text-sm font-medium ${
              role === tab.value
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={values.email}
            onChange={onChange("email")}
            error={errors.email}
          />
        </FormField>

        <FormField error={errors.password}>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
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
          />
        </FormField>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked />
          <Label htmlFor="remember" className="font-normal text-muted-foreground">
            Remember me on this device
          </Label>
        </div>

        <Button type="submit" className="w-full mt-2">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}
