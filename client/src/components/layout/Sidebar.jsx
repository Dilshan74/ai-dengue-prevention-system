import { Link, NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
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
    <div className="flex h-full flex-col bg-white">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div>
          <div className="text-sm font-bold text-primary">{APP_NAME}</div>
          <div className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {items.map(({ to, label, icon: Icon, badge, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium mb-0.5 ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-700" : ""}`} />
                <span className="flex-1 truncate">{label}</span>
                {badge != null && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-border px-2 py-2">
        <Link
          to="/login"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}
