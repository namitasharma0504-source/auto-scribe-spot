import { cn } from "@/lib/utils";

interface ServiceTagProps {
  label: string;
  variant?: "default" | "positive" | "neutral";
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function ServiceTag({
  label,
  variant = "default",
  selectable = false,
  selected = false,
  onClick,
}: ServiceTagProps) {
  const variantClasses = {
    default: "bg-secondary text-secondary-foreground",
    positive: "bg-accent/10 text-accent",
    neutral: "bg-muted text-muted-foreground",
  };

  return (
    <span
      role={selectable ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200",
        variantClasses[variant],
        selectable && "cursor-pointer hover:ring-2 hover:ring-primary/30",
        selected && "ring-2 ring-primary bg-primary/10 text-primary"
      )}
    >
      {label}
    </span>
  );
}
