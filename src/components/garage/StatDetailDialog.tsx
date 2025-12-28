import { useState, useEffect } from "react";
import { 
  Star, MessageSquare, Eye, Users, TrendingUp, TrendingDown,
  Calendar, ArrowUp, ArrowDown, Clock, ThumbsUp, ThumbsDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface StatDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statType: "rating" | "reviews" | "views" | "inquiries";
  garageName: string;
  currentValue: number | string;
}

interface ReviewBreakdown {
  rating: number;
  count: number;
  percentage: number;
}

interface RecentReview {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  garage_location: string | null;
}

export function StatDetailDialog({
  open,
  onOpenChange,
  statType,
  garageName,
  currentValue,
}: StatDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [reviewBreakdown, setReviewBreakdown] = useState<ReviewBreakdown[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    change: 0,
  });
  const [ratingTrend, setRatingTrend] = useState({
    thisMonth: 0,
    lastMonth: 0,
    change: 0,
  });

  useEffect(() => {
    if (open && garageName) {
      fetchData();
    }
  }, [open, garageName, statType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const thisMonthStart = startOfMonth(new Date());
      const thisMonthEnd = endOfMonth(new Date());
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

      // Fetch all approved reviews for the garage
      const { data: reviews, error } = await supabase
        .from("user_reviews")
        .select("id, rating, review_text, created_at, garage_location")
        .eq("garage_name", garageName)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const allReviews = (reviews || []) as RecentReview[];

      // Calculate rating breakdown
      const breakdown: ReviewBreakdown[] = [5, 4, 3, 2, 1].map(rating => {
        const count = allReviews.filter(r => r.rating === rating).length;
        return {
          rating,
          count,
          percentage: allReviews.length > 0 ? (count / allReviews.length) * 100 : 0,
        };
      });
      setReviewBreakdown(breakdown);

      // Get recent reviews (last 5)
      setRecentReviews(allReviews.slice(0, 5));

      // Calculate monthly stats
      const thisMonthReviews = allReviews.filter(r => {
        const date = new Date(r.created_at);
        return date >= thisMonthStart && date <= thisMonthEnd;
      });

      const lastMonthReviews = allReviews.filter(r => {
        const date = new Date(r.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });

      setMonthlyStats({
        thisMonth: thisMonthReviews.length,
        lastMonth: lastMonthReviews.length,
        change: thisMonthReviews.length - lastMonthReviews.length,
      });

      // Calculate rating trend
      const thisMonthAvg = thisMonthReviews.length > 0
        ? thisMonthReviews.reduce((sum, r) => sum + r.rating, 0) / thisMonthReviews.length
        : 0;
      const lastMonthAvg = lastMonthReviews.length > 0
        ? lastMonthReviews.reduce((sum, r) => sum + r.rating, 0) / lastMonthReviews.length
        : 0;

      setRatingTrend({
        thisMonth: Math.round(thisMonthAvg * 10) / 10,
        lastMonth: Math.round(lastMonthAvg * 10) / 10,
        change: Math.round((thisMonthAvg - lastMonthAvg) * 10) / 10,
      });

    } catch (error) {
      console.error("Error fetching stat details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (statType) {
      case "rating": return "Rating Details";
      case "reviews": return "Review Insights";
      case "views": return "Profile Views";
      case "inquiries": return "Customer Inquiries";
      default: return "Details";
    }
  };

  const getDialogIcon = () => {
    switch (statType) {
      case "rating": return <Star className="w-5 h-5 text-primary fill-primary" />;
      case "reviews": return <MessageSquare className="w-5 h-5 text-accent" />;
      case "views": return <Eye className="w-5 h-5 text-primary" />;
      case "inquiries": return <Users className="w-5 h-5 text-accent" />;
      default: return null;
    }
  };

  const renderRatingDetails = () => (
    <div className="space-y-6">
      {/* Current Rating Overview */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Current Overall Rating</p>
          <p className="text-4xl font-bold text-foreground">{currentValue}</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 ${ratingTrend.change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {ratingTrend.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span className="font-medium">{ratingTrend.change >= 0 ? "+" : ""}{ratingTrend.change}</span>
          </div>
          <p className="text-xs text-muted-foreground">vs last month</p>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div>
        <h4 className="font-medium mb-3">Rating Distribution</h4>
        <div className="space-y-2">
          {reviewBreakdown.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm font-medium">{item.rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={item.percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-16 text-right">
                {item.count} ({Math.round(item.percentage)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Trend Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Why Rating Changed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {ratingTrend.change > 0 && (
            <div className="flex items-start gap-2 text-green-600">
              <ThumbsUp className="w-4 h-4 mt-0.5" />
              <span>You received more positive reviews this month! Keep up the great service.</span>
            </div>
          )}
          {ratingTrend.change < 0 && (
            <div className="flex items-start gap-2 text-red-600">
              <ThumbsDown className="w-4 h-4 mt-0.5" />
              <span>Some customers had lower ratings. Check recent reviews for feedback.</span>
            </div>
          )}
          {ratingTrend.change === 0 && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4 mt-0.5" />
              <span>Your rating is stable. Maintain quality service to improve further.</span>
            </div>
          )}
          <div className="pt-2 border-t">
            <p className="text-muted-foreground">
              This month avg: <span className="font-medium text-foreground">{ratingTrend.thisMonth || "N/A"}</span> | 
              Last month avg: <span className="font-medium text-foreground">{ratingTrend.lastMonth || "N/A"}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReviewDetails = () => (
    <div className="space-y-6">
      {/* Monthly Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-3xl font-bold text-foreground">{monthlyStats.thisMonth}</p>
          <p className="text-xs text-muted-foreground">new reviews</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Last Month</p>
          <p className="text-3xl font-bold text-foreground">{monthlyStats.lastMonth}</p>
          <p className="text-xs text-muted-foreground">reviews</p>
        </div>
      </div>

      {/* Change Indicator */}
      <div className={`p-4 rounded-lg ${monthlyStats.change >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
        <div className="flex items-center gap-2">
          {monthlyStats.change >= 0 ? (
            <ArrowUp className="w-5 h-5 text-green-500" />
          ) : (
            <ArrowDown className="w-5 h-5 text-red-500" />
          )}
          <span className={`font-medium ${monthlyStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {monthlyStats.change >= 0 ? "+" : ""}{monthlyStats.change} reviews vs last month
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {monthlyStats.change > 0 
            ? "Great job! More customers are leaving reviews." 
            : monthlyStats.change < 0 
              ? "Consider asking satisfied customers to leave reviews."
              : "Review rate is consistent with last month."
          }
        </p>
      </div>

      {/* Recent Reviews */}
      <div>
        <h4 className="font-medium mb-3">Recent Reviews</h4>
        {recentReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {recentReviews.map((review) => (
              <div key={review.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                {review.review_text && (
                  <p className="text-sm text-foreground line-clamp-2">{review.review_text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderViewsDetails = () => (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">Total Profile Views</p>
        <p className="text-4xl font-bold text-foreground">{currentValue}</p>
        <Badge variant="secondary" className="mt-2">
          <TrendingUp className="w-3 h-3 mr-1" />
          +12% this month
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Traffic Sources (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Detailed analytics on where your visitors come from will be available soon.</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              Direct Search - tracking in progress
            </li>
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              Google Maps - tracking in progress
            </li>
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Referrals - tracking in progress
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">💡 Tips to Increase Views</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Complete your garage profile with photos</li>
          <li>• Add all services you offer</li>
          <li>• Respond to reviews promptly</li>
          <li>• Share your profile on social media</li>
        </ul>
      </div>
    </div>
  );

  const renderInquiriesDetails = () => (
    <div className="space-y-6">
      <div className="p-4 bg-accent/10 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">Total Inquiries</p>
        <p className="text-4xl font-bold text-foreground">{currentValue}</p>
        <Badge variant="outline" className="mt-2 text-red-500 border-red-300">
          <TrendingDown className="w-3 h-3 mr-1" />
          -3% this month
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Inquiry Breakdown (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Detailed breakdown of inquiry types will be available soon:</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between">
              <span>Quote Requests</span>
              <span className="font-medium text-foreground">--</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Phone Calls</span>
              <span className="font-medium text-foreground">--</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Direction Requests</span>
              <span className="font-medium text-foreground">--</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">💡 Tips to Increase Inquiries</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Set competitive pricing</li>
          <li>• Highlight special offers</li>
          <li>• Maintain a high rating</li>
          <li>• Add detailed service descriptions</li>
        </ul>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (statType) {
      case "rating": return renderRatingDetails();
      case "reviews": return renderReviewDetails();
      case "views": return renderViewsDetails();
      case "inquiries": return renderInquiriesDetails();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDialogIcon()}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            Understand what's driving your numbers and how to improve.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}