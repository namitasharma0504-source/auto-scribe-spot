import { StarRating } from "./StarRating";
import { Progress } from "@/components/ui/progress";

interface RatingBreakdownProps {
  overall: number;
  totalReviews: number;
  categories: {
    name: string;
    rating: number;
  }[];
  distribution: {
    stars: number;
    count: number;
  }[];
}

export function RatingBreakdown({
  overall,
  totalReviews,
  categories,
  distribution,
}: RatingBreakdownProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count));

  return (
    <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Overall Rating */}
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-foreground">{overall.toFixed(1)}</div>
          <StarRating rating={Math.round(overall)} size="lg" />
          <p className="mt-2 text-muted-foreground">
            {totalReviews.toLocaleString()} reviews
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {distribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3">
              <span className="w-8 text-sm text-muted-foreground text-right">
                {item.stars}★
              </span>
              <Progress
                value={maxCount > 0 ? (item.count / maxCount) * 100 : 0}
                className="h-2 flex-1"
              />
              <span className="w-10 text-sm text-muted-foreground">
                {item.count}
              </span>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground mb-4">By Category</h4>
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{cat.name}</span>
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(cat.rating)} size="sm" maxRating={5} />
                <span className="text-sm font-medium text-foreground w-6">
                  {cat.rating.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
