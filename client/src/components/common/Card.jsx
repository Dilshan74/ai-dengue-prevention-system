import { cn } from "../../utils/helpers";

/** Surface container used across every dashboard page. */
export default function Card({ title, description, action, className, bodyClassName, children }) {
  return (
    <div
      className={cn(
        "rounded border border-border bg-white shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}
