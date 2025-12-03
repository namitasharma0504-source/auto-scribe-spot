import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  showValue = false,
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < rating;
          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(index)}
              className={cn(
                "transition-all duration-200",
                interactive && "cursor-pointer hover:scale-110 active:animate-star-pop",
                !interactive && "cursor-default"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-200",
                  filled
                    ? "fill-star text-star"
                    : "fill-star-empty text-star-empty"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-1 font-semibold text-foreground">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
