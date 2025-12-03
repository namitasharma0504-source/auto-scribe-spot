import { ThumbsUp } from "lucide-react";
import { StarRating } from "./StarRating";
import { ServiceTag } from "./ServiceTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReviewCardProps {
  username: string;
  userAvatar?: string;
  rating: number;
  reviewText: string;
  date: string;
  tags?: string[];
  images?: string[];
  helpfulCount?: number;
}

export function ReviewCard({
  username,
  userAvatar,
  rating,
  reviewText,
  date,
  tags = [],
  images = [],
  helpfulCount = 0,
}: ReviewCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 bg-card">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 ring-2 ring-secondary">
            <AvatarImage src={userAvatar} alt={username} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-semibold text-foreground">{username}</h4>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
              <StarRating rating={rating} size="sm" />
            </div>
            
            <p className="mt-4 text-foreground/90 leading-relaxed">{reviewText}</p>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => (
                  <ServiceTag key={tag} label={tag} variant="positive" />
                ))}
              </div>
            )}
            
            {images.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Review image ${index + 1}`}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                  />
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <ThumbsUp className="w-4 h-4 mr-2" />
                Helpful ({helpfulCount})
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
