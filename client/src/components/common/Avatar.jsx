import { cn } from "../../utils/helpers";
import { initials } from "../../utils/helpers";

export default function Avatar({ name = "", src, className, textClassName }) {
  return (
    <div
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-teal-100 border border-border",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className={cn("text-xs font-semibold text-teal-700", textClassName)}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}
