import { cn } from "../../utils/helpers";

/** Surface container used across every dashboard page. */
export default function Card({ title, description, action, className, bodyClassName, children }) {
  return (
    <div
      className={cn(
        "rounded-2xl glass card-shadow transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/50 relative z-10">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-medium text-foreground tracking-tight">{title}</h3>}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5 relative z-10", bodyClassName)}>{children}</div>
    </div>
  );
}
