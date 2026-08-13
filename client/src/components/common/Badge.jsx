import { cn } from "../../utils/helpers";

export default function Badge({ variant = "default", className, children }) {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    primary: "bg-teal-100 text-teal-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    destructive: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        styles[variant] ?? styles.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
