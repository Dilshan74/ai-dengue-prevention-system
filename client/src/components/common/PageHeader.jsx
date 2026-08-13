export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4 slide-in-right">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm font-normal text-muted-foreground delay-100 slide-in-right">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 delay-200 slide-in-right">{action}</div>}
    </div>
  );
}
