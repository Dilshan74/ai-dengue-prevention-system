import { cn } from "../../utils/helpers";

export function Label({ className, children, ...props }) {
  return (
    <label className={cn("block text-xs font-semibold text-foreground uppercase tracking-wider mb-1", className)} {...props}>
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
          "h-10 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground",
          "placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs transition-colors",
          Icon && "pl-9",
          error && "border-destructive focus:border-destructive focus:ring-destructive/20",
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
        "w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground",
        "placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs transition-colors",
        error && "border-destructive focus:border-destructive focus:ring-destructive/20",
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
        "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs transition-colors cursor-pointer",
        className,
      )}
      {...props}
    >
      {children ??
        options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value} className="bg-card text-foreground">
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
        "h-4 w-4 shrink-0 rounded border-input accent-primary cursor-pointer",
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
        "relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function FormField({ label, htmlFor, error, hint, className, children }) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}
