import { cn } from "../../utils/helpers";

export function Label({ className, children, ...props }) {
  return (
    <label className={cn("block text-sm font-medium text-foreground", className)} {...props}>
      {children}
    </label>
  );
}

export function Input({ className, icon: Icon, error, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        className={cn(
          "h-9 w-full rounded border border-input bg-white px-3 text-sm text-foreground",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
          Icon && "pl-9",
          error && "border-destructive",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function Textarea({ className, error, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded border border-input bg-white p-2.5 text-sm text-foreground",
        "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
        error && "border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, options = [], children, ...props }) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded border border-input bg-white px-3 text-sm text-foreground",
        "focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
        className,
      )}
      {...props}
    >
      {children ??
        options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
    </select>
  );
}

export function Checkbox({ className, ...props }) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 rounded border-input accent-primary",
        className,
      )}
      {...props}
    />
  );
}

export function Switch({ checked, onChange, label, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-slate-300",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function FormField({ label, htmlFor, error, hint, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
