import { cn } from "@/lib/utils";

export interface ServiceCategory {
  label: string;
  type: "service" | "specialization";
}

interface GarageServiceTagsProps {
  services: string[];
  maxVisible?: number;
  size?: "sm" | "md";
  showAll?: boolean;
}

const serviceTypeMap: Record<string, "service" | "specialization"> = {
  "General Service": "service",
  "AC Repair": "service",
  "Body Work": "service",
  "Tyres": "service",
  "Diagnostics": "service",
  "Oil Change": "service",
  "Brake Repair": "service",
  "Engine Service": "service",
  "Battery": "service",
  "Denting": "service",
  "Painting": "service",
  "EV-friendly": "specialization",
  "Multi-brand": "specialization",
  "Premium Cars": "specialization",
  "Luxury Cars": "specialization",
  "German Cars": "specialization",
  "Japanese Cars": "specialization",
  "All Brands": "specialization",
  "24/7 Service": "specialization",
  "Doorstep Service": "specialization",
};

export function GarageServiceTags({
  services,
  maxVisible = 3,
  size = "sm",
  showAll = false,
}: GarageServiceTagsProps) {
  const displayedServices = showAll ? services : services.slice(0, maxVisible);
  const remainingCount = services.length - maxVisible;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayedServices.map((service) => {
        const type = serviceTypeMap[service] || "service";
        return (
          <span
            key={service}
            className={cn(
              "rounded-full font-medium transition-colors",
              sizeClasses[size],
              type === "specialization"
                ? "bg-accent/10 text-accent border border-accent/20"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {service}
          </span>
        );
      })}
      {!showAll && remainingCount > 0 && (
        <span
          className={cn(
            "rounded-full font-medium bg-muted text-muted-foreground",
            sizeClasses[size]
          )}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
