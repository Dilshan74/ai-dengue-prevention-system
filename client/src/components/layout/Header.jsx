import { Link } from "react-router-dom";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import Avatar from "../common/Avatar";
import useTheme from "../../hooks/useTheme";
import useNotification from "../../hooks/useNotification";
import useAuth from "../../hooks/useAuth";

/** Dashboard top bar */
export default function Header({
  title,
  role,
  onOpenMobileNav,
}) {
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  const { user } = useAuth();
  const displayName = user?.name ?? (role === "phi" ? "PHI" : role.charAt(0).toUpperCase() + role.slice(1));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-white px-4">
      <button
        type="button"
        aria-label="Open navigation"
        className="rounded p-1.5 text-muted-foreground hover:bg-slate-100 md:hidden"
        onClick={onOpenMobileNav}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded p-1.5 text-muted-foreground hover:bg-slate-100"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Link
          to={`/${role}/notifications`}
          className="relative rounded p-1.5 text-muted-foreground hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        <Avatar name={displayName} className="ml-1 h-7 w-7" />
      </div>
    </header>
  );
}
