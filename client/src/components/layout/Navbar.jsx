import { Link } from "react-router-dom";
import { APP_NAME } from "../../utils/constants";

/** Public marketing navigation used on the landing and auth pages. */
export default function Navbar({ links = [] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="text-base">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
