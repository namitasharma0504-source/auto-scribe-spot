import { useState } from "react";
import { MapPin, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { GarageBadges, GarageBadgeData } from "./GarageBadges";
import { GarageServiceTags } from "./GarageServiceTags";
import { GarageActivityStats, GarageActivityData } from "./GarageActivityStats";
import { GarageMapPreview } from "./GarageMapPreview";
import { GetQuoteDialog } from "./GetQuoteDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GarageCardProps extends GarageBadgeData, GarageActivityData {
  id: string;
  name: string;
  location: string;
  address?: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  imageUrl?: string;
  locationLink?: string;
}

export function GarageCard({
  id,
  name,
  location,
  address,
  rating,
  reviewCount,
  tags,
  imageUrl,
  locationLink,
  isVerified = false,
  isCertified = false,
  isRecommended = false,
  hasDiscounts = false,
  responseTime,
  quotesThisMonth,
  walkInWelcome,
}: GarageCardProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card">
      <Link to={`/garage/${id}`}>
        <div className="relative h-48 overflow-hidden bg-muted">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-5xl font-bold text-primary/40">
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
      </Link>
      
      <CardContent className="p-5">
        <Link to={`/garage/${id}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {name}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {reviewCount} reviews
            </span>
          </div>
        </Link>

        {/* Badges */}
        <div className="mb-3">
          <GarageBadges
            isVerified={isVerified}
            isCertified={isCertified}
            isRecommended={isRecommended}
            hasDiscounts={hasDiscounts}
            size="sm"
            showTooltip={true}
          />
        </div>

        {/* Location & Map Link */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">{location}</span>
          </div>
          {(locationLink || address) && (
            <GarageMapPreview 
              locationLink={locationLink} 
              address={address || location} 
              garageName={name} 
              variant="compact" 
            />
          )}
        </div>

        {/* Activity Stats */}
        {(responseTime || quotesThisMonth || walkInWelcome) && (
          <div className="mb-3">
            <GarageActivityStats
              responseTime={responseTime}
              quotesThisMonth={quotesThisMonth}
              walkInWelcome={walkInWelcome}
              variant="compact"
            />
          </div>
        )}

        {/* Service Tags */}
        <div className="mb-4">
          <GarageServiceTags services={tags} maxVisible={3} size="sm" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <GetQuoteDialog
            garageName={name}
            garageId={id}
            variant="primary"
            size="sm"
            className="flex-1"
          />
          <Link to={`/garage/${id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1">
              More Details
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
