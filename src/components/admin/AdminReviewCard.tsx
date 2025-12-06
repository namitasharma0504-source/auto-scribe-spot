import { Star, CheckCircle, XCircle, MapPin, Mail, Calendar, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Review {
  id: string;
  garage_name: string;
  garage_location: string | null;
  rating: number;
  review_text: string | null;
  status: string | null;
  created_at: string;
  customer_email: string | null;
  is_verified: boolean | null;
}

interface AdminReviewCardProps {
  review: Review;
  onApprove: () => void;
  onReject: () => void;
  showActions?: boolean;
  showApproveOnly?: boolean;
}

export function AdminReviewCard({
  review,
  onApprove,
  onReject,
  showActions = true,
  showApproveOnly = false,
}: AdminReviewCardProps) {
  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    approved: "bg-green-500/10 text-green-600 border-green-500/30",
    rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  };

  const status = review.status || "pending";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Review Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-lg text-foreground">{review.garage_name}</h3>
              <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              {review.is_verified && (
                <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Location & Email */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {review.garage_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {review.garage_location}
                </span>
              )}
              {review.customer_email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {review.customer_email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(review.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm font-medium">{review.rating}/5</span>
            </div>

            {/* Review Text */}
            {review.review_text && (
              <p className="text-foreground bg-muted/50 p-4 rounded-lg">
                "{review.review_text}"
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex lg:flex-col gap-2">
              {(!showApproveOnly || status === "rejected") && (
                <Button
                  onClick={onApprove}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              )}
              {!showApproveOnly && (
                <Button
                  onClick={onReject}
                  variant="destructive"
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
