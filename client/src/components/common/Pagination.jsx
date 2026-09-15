import Button from "./Button";

export default function Pagination({ page = 1, pageCount, totalPages, total, perPage, onChange, showRange = true }) {
  const count = pageCount || totalPages || 1;
  const hasRange = typeof total === "number" && typeof perPage === "number";
  const from = hasRange ? (total === 0 ? 0 : (page - 1) * perPage + 1) : null;
  const to = hasRange ? Math.min(page * perPage, total) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      {showRange && hasRange ? (
        <span>
          Showing {from}–{to} of {total}
        </span>
      ) : <span />}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </Button>
        <span className="px-1 font-medium text-foreground">
          {page} / {count}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= count}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
