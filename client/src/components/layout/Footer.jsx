import { Link } from "react-router-dom";
import { APP_NAME } from "../../utils/constants";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row md:px-6">
        <span>© 2026 {APP_NAME} — Ministry of Health, Sri Lanka</span>
        <div className="flex gap-5">
          <Link to="/login" className="hover:text-foreground">Sign in</Link>
          <Link to="/register" className="hover:text-foreground">Register</Link>
        </div>
      </div>
    </footer>
  );
}
