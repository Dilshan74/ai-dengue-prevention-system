import { Link } from "react-router-dom";
import { APP_NAME } from "../../utils/constants";
import Button from "../common/Button";
import BrandLogo from "../common/BrandLogo";

/** Public marketing navigation used on the landing and auth pages. */
export default function Navbar({ links = [] }) {
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6 slide-up">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-lg text-white group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md border border-white/25 shadow-sm group-hover:bg-white/30 transition-all">
            <BrandLogo className="h-5 w-5 text-white" />
          </div>
          <span className="tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button as={Link} to="/login" variant="ghost" className="text-white hover:bg-white/20 dark:hover:bg-white/20 text-sm font-medium">
            Sign in
          </Button>
          <Button as={Link} to="/register" className="bg-white text-primary hover:bg-white/90 shadow-none hover:shadow-none hover:-translate-y-0.5 text-sm font-medium">
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
