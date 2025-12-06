import { Clock, Users, Calendar, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GarageActivityData {
  responseTime?: string;
  quotesThisMonth?: number;
  walkInWelcome?: boolean;
  appointmentRequired?: boolean;
  hasVerifiedLicense?: boolean;
}

interface GarageActivityStatsProps extends GarageActivityData {
  variant?: "compact" | "full";
}

export function GarageActivityStats({
  responseTime,
  quotesThisMonth,
  walkInWelcome,
  appointmentRequired,
  hasVerifiedLicense,
  variant = "compact",
}: GarageActivityStatsProps) {
  const stats = [
    responseTime && {
      icon: Clock,
      label: variant === "compact" ? responseTime : `Usually replies in ${responseTime}`,
      className: "text-accent",
    },
    quotesThisMonth && {
      icon: Users,
      label: variant === "compact" 
        ? `${quotesThisMonth} quotes` 
        : `${quotesThisMonth} locals requested a quote this month`,
      className: "text-primary",
    },
    walkInWelcome && {
      icon: Calendar,
      label: "Walk-ins Welcome",
      className: "text-success",
    },
    appointmentRequired && {
      icon: Calendar,
      label: "Appointment Required",
      className: "text-warning",
    },
    hasVerifiedLicense && {
      icon: ShieldCheck,
      label: "Verified License",
      className: "text-success",
    },
  ].filter(Boolean) as { icon: typeof Clock; label: string; className: string }[];

  if (stats.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {stats.slice(0, 2).map((stat, index) => (
          <span key={index} className="flex items-center gap-1">
            <stat.icon className={cn("w-3 h-3", stat.className)} />
            {stat.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <stat.icon className={cn("w-4 h-4", stat.className)} />
          <span className="text-foreground">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
