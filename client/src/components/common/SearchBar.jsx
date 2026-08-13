import { Search } from "lucide-react";
import { cn } from "../../utils/helpers";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
  inputClassName,
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded border border-input bg-white pl-8 pr-3 text-sm text-foreground",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
          inputClassName,
        )}
      />
    </div>
  );
}
