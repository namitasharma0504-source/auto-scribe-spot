import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GarageMapPreviewProps {
  locationLink?: string;
  address: string;
  garageName: string;
  variant?: "compact" | "full";
}

export function GarageMapPreview({
  locationLink,
  address,
  garageName,
  variant = "full",
}: GarageMapPreviewProps) {
  const googleMapsEmbedUrl = locationLink 
    ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  const directionsUrl = locationLink || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  if (variant === "compact") {
    return (
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        <MapPin className="w-3 h-3" />
        View on Map
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="relative h-48 bg-muted">
        <iframe
          src={googleMapsEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${garageName} location`}
          className="grayscale-[30%]"
        />
        <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            Garage Located Here
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-3">{address}</p>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Navigation className="w-4 h-4" />
            Get Directions
          </Button>
        </a>
      </div>
    </div>
  );
}
