import { MapPin, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { ServiceTag } from "./ServiceTag";
import { Card, CardContent } from "@/components/ui/card";

interface GarageCardProps {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  imageUrl?: string;
}

export function GarageCard({
  id,
  name,
  location,
  rating,
  reviewCount,
  tags,
  imageUrl,
}: GarageCardProps) {
  return (
    <Link to={`/garage/${id}`}>
      <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card">
        <div className="relative h-48 overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground/30">
                {name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
            <div className="flex items-center gap-1.5">
              <StarRating rating={1} maxRating={1} size="sm" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{location}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">{reviewCount} reviews</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.slice(0, 3).map((tag) => (
              <ServiceTag key={tag} label={tag} variant="positive" />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
