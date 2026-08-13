const TINTS = {
  primary: "bg-teal-50 text-teal-700",
  accent: "bg-teal-50 text-teal-700",
  warning: "bg-amber-50 text-amber-700",
  destructive: "bg-red-50 text-red-700",
  success: "bg-green-50 text-green-700",
};

export default function StatCard({ label, value, delta, icon: Icon, tint = "primary" }) {
  return (
    <div className="rounded border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </div>
          <div className="mt-1.5 text-2xl font-bold text-foreground">{value}</div>
          {delta && <div className="mt-1 text-xs text-success">{delta}</div>}
        </div>
        {Icon && (
          <div className={`shrink-0 rounded p-2 ${TINTS[tint]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
