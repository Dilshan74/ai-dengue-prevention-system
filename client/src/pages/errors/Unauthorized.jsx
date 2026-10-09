import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowRightLeft, Home, LogIn } from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/common/Button";
import useAuth from "../../hooks/useAuth";
import { ROLE_HOME } from "../../utils/constants";
import authService from "../../services/authService";

export default function Unauthorized() {
  const location = useLocation();
  const { user, role, login } = useAuth();
  const [switching, setSwitching] = useState(false);

  const state = location.state || {};
  const currentRole = (state.currentRole || role || user?.role || "citizen").toLowerCase();
  const requiredRoles = state.requiredRoles || [];
  const homeUrl = ROLE_HOME[currentRole] || "/citizen";

  const handleQuickSwitch = async (targetRole) => {
    try {
      setSwitching(true);
      const email = `${targetRole}@dengueguard.lk`;
      const data = await authService.login({
        email,
        password: "demo1234",
        role: targetRole,
      });
      login({
        email: data.email,
        name: data.name,
        role: targetRole,
        token: data.token,
      });
      toast.success(`Switched to ${targetRole.toUpperCase()} account!`);
      const targetHome = ROLE_HOME[targetRole] || `/${targetRole}`;
      window.location.href = state.from || targetHome;
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to switch to ${targetRole}`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="max-w-lg w-full rounded-3xl border border-border bg-card p-8 text-center soft-shadow">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          403 — Access Restricted
        </h1>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {user ? (
            <>
              You are currently signed in as <strong>{user.name}</strong> (
              <span className="capitalize font-semibold text-foreground">{currentRole}</span> account).
              {requiredRoles.length > 0 && (
                <span>
                  {" "}This section requires <strong>{requiredRoles.join(" / ").toUpperCase()}</strong> permissions.
                </span>
              )}
            </>
          ) : (
            "Your account does not have permission to view this page."
          )}
        </p>

        {/* Primary Dashboard Redirect Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button as={Link} to={homeUrl} size="lg" className="w-full sm:w-auto shadow-md">
            <Home className="h-4 w-4 mr-2" /> Go to {currentRole.toUpperCase()} Dashboard
          </Button>

          <Button as={Link} to="/login" variant="outline" size="lg" className="w-full sm:w-auto">
            <LogIn className="h-4 w-4 mr-2" /> Sign In Different Account
          </Button>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mt-8 border-t border-border/80 pt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Switch Demo Role
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["citizen", "phi", "admin"].map((r) => (
              <Button
                key={r}
                variant={r === currentRole ? "secondary" : "outline"}
                size="sm"
                disabled={switching || r === currentRole}
                onClick={() => handleQuickSwitch(r)}
                className="text-xs"
              >
                <ArrowRightLeft className="h-3 w-3 mr-1" />
                {r.toUpperCase()} {r === currentRole && "(Active)"}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
