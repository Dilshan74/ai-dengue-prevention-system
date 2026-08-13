import { Link, NavLink } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { APP_NAME } from "../../utils/constants";
import useAuth from "../../hooks/useAuth";

const ROLE_LABELS = {
  citizen: "Citizen Portal",
  phi: "PHI Console",
  admin: "Admin Panel",
};

/**
 * Role-aware navigation sidebar. `items: [{ to, label, icon, badge?, end? }]`
 */
export default function Sidebar({ role, items, onNavigate }) {
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground shadow-2xl">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5 slide-in-right delay-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-400 text-white shadow-lg shadow-teal-500/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold text-white tracking-tight">{APP_NAME}</div>
          <div className="text-xs font-medium text-teal-200 mt-0.5 tracking-wide">{ROLE_LABELS[role]}</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 slide-up delay-200">
        {items.map(({ to, label, icon: Icon, badge, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-black/10"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-sidebar-foreground/70 group-hover:text-white"}`} />
                <span className="flex-1 truncate">{label}</span>
                {badge != null && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-white shadow-sm">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-4 slide-up delay-300">
        <Link
          to="/login"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-all duration-300 hover:bg-sidebar-accent/50 hover:text-white"
        >
          <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}
