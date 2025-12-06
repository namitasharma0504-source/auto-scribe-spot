import { BadgeCheck, Award, Percent, Info, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

export interface GarageBadgeData {
  isVerified?: boolean;
  isCertified?: boolean;
  isRecommended?: boolean;
  hasDiscounts?: boolean;
}

interface GarageBadgesProps extends GarageBadgeData {
  size?: "sm" | "md";
  showTooltip?: boolean;
}

const badgeConfig = {
  verified: {
    icon: BadgeCheck,
    label: "Verified Garage",
    className: "bg-success/10 text-success border-success/20",
  },
  certified: {
    icon: Wrench,
    label: "Certified Mechanics",
    className: "bg-accent/10 text-accent border-accent/20",
  },
  recommended: {
    icon: Award,
    label: "Recommended",
    className: "bg-star/10 text-star border-star/20",
  },
  discounts: {
    icon: Percent,
    label: "Discounts Available",
    className: "bg-primary/10 text-primary border-primary/20",
  },
};

export function GarageBadges({
  isVerified = false,
  isCertified = false,
  isRecommended = false,
  hasDiscounts = false,
  size = "md",
  showTooltip = true,
}: GarageBadgesProps) {
  const activeBadges = [
    isVerified && "verified",
    isCertified && "certified",
    isRecommended && "recommended",
    hasDiscounts && "discounts",
  ].filter(Boolean) as (keyof typeof badgeConfig)[];

  if (activeBadges.length === 0) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
  };

  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {activeBadges.map((badge) => {
          const config = badgeConfig[badge];
          const Icon = config.icon;

          return (
            <span
              key={badge}
              className={cn(
                "inline-flex items-center rounded-full border font-medium transition-all",
                sizeClasses[size],
                config.className
              )}
            >
              <Icon className={iconSize} />
              {config.label}
            </span>
          );
        })}
        
        {showTooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                <Info className="w-3 h-3 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-sm">
                These Highlights are provided by and paid for by the business.{" "}
                <Link 
                  to="/garage-auth" 
                  className="text-primary hover:underline font-medium"
                >
                  Visit MeriGarage for Garages
                </Link>
                .
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
