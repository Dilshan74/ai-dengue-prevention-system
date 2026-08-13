import { cn } from "../../utils/helpers";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-teal-700",
  secondary: "bg-secondary text-secondary-foreground hover:bg-slate-200",
  outline: "border border-border bg-white hover:bg-slate-50 text-foreground",
  ghost: "hover:bg-slate-100 text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-red-700",
  link: "text-primary underline-offset-4 hover:underline",
};

const SIZES = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
  icon: "h-9 w-9",
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
        "inline-flex shrink-0 items-center justify-center gap-2 rounded font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
