import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/common/Button";
import { FormField, Input, Textarea } from "../../components/common/Field";
import useAuth from "../../hooks/useAuth";
import { ROLES, ROLE_HOME } from "../../utils/constants";
import { rules, validate } from "../../utils/validators";

const INITIAL = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  confirm: "",
  address: "",
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const onChange = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values, {
      name: [rules.required("Enter your full name")],
      email: [rules.required(), rules.email()],
      mobile: [rules.required(), rules.mobile()],
      password: [rules.required(), rules.password()],
      confirm: [rules.required("Confirm your password"), rules.matches("password", "Passwords do not match")],
      address: [rules.required("Enter your address")],
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    login({ email: values.email, name: values.name, role: ROLES.CITIZEN });
    toast.success("Account created successfully");
    navigate(ROLE_HOME[ROLES.CITIZEN]);
  };

  return (
    <>
      <h1 className="text-xl font-bold text-foreground">Register</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a new citizen account
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <FormField label="Full Name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            icon={User}
            placeholder="Nimal Perera"
            value={values.name}
            onChange={onChange("name")}
            error={errors.name}
          />
        </FormField>
        <FormField label="Email Address" htmlFor="email" error={errors.email}>
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
        <FormField label="Mobile Number" htmlFor="mobile" error={errors.mobile}>
          <Input
            id="mobile"
            icon={Phone}
            placeholder="+94 77 123 4567"
            value={values.mobile}
            onChange={onChange("mobile")}
            error={errors.mobile}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password" error={errors.password}>
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
          <FormField label="Confirm Password" htmlFor="confirm" error={errors.confirm}>
            <Input
              id="confirm"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={values.confirm}
              onChange={onChange("confirm")}
              error={errors.confirm}
            />
          </FormField>
        </div>
        <FormField label="Address" htmlFor="address" error={errors.address}>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="address"
              placeholder="Street, Ward, City"
              className="min-h-[80px] resize-none pl-9"
              value={values.address}
              onChange={onChange("address")}
              error={errors.address}
            />
          </div>
        </FormField>

        <Button type="submit" className="w-full mt-2">
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
