import { cn } from "../../utils/helpers";

export default function Badge({ variant = "default", className, children, ...props }) {
  const styles = {
    default: "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700",
    primary: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/30",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    destructive: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30",
    low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    high: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30",
    outline: "bg-transparent border border-border text-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium tracking-tight",
        styles[variant] ?? styles.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
