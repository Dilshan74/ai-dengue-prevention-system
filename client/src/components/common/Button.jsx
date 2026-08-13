import { cn } from "../../utils/helpers";

const VARIANTS = {
  primary: "bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-md hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5",
  secondary: "bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-800 hover:-translate-y-0.5",
  outline: "border-2 border-primary/20 bg-transparent hover:bg-primary/5 text-foreground hover:-translate-y-0.5",
  ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground",
  destructive: "bg-gradient-to-r from-destructive to-red-400 text-destructive-foreground shadow-md hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5",
  link: "text-primary underline-offset-4 hover:underline",
};

const SIZES = {
  sm: "h-8 px-4 text-xs",
  md: "h-10 px-6 text-sm",
  lg: "h-12 px-8 text-sm",
  icon: "h-10 w-10",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className,
  type,
  ...props
}) {
  return (
    <Component
      type={Component === "button" ? (type ?? "button") : type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 ease-out active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-900",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
