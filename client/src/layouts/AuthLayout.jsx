import { Link, Outlet } from "react-router-dom";
import { APP_NAME } from "../utils/constants";

/** Simple centered shell for login, register and password recovery. */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-white px-4 py-3">
        <Link to="/" className="text-sm font-bold text-primary">
          {APP_NAME}
        </Link>
      </div>

      {/* Centered form */}
      <div className="flex min-h-[calc(100vh-53px)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded border border-border bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
