export default function PageHeader({ title, description, action, badge }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            DENGUEGUARD SURVEILLANCE CONSOLE
          </span>
          {badge}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
