import { useState, useEffect } from "react";
import { 
  Building2, 
  Star, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface OverviewStats {
  totalGarages: number;
  garagesWithRatingsOnly: number;
  garagesWithReviews: number;
  totalCustomers: number;
  totalReviews: number;
  pendingReviews: number;
  totalPointsDistributed: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats>({
    totalGarages: 0,
    garagesWithRatingsOnly: 0,
    garagesWithReviews: 0,
    totalCustomers: 0,
    totalReviews: 0,
    pendingReviews: 0,
    totalPointsDistributed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch total garages
      const { count: totalGarages } = await supabase
        .from("garages")
        .select("*", { count: "exact", head: true });

      // Fetch garages with reviews (review_count > 0)
      const { count: garagesWithReviews } = await supabase
        .from("garages")
        .select("*", { count: "exact", head: true })
        .gt("review_count", 0);

      // Garages with only ratings = total - those with reviews
      const garagesWithRatingsOnly = (totalGarages || 0) - (garagesWithReviews || 0);

      // Fetch total profiles (customers)
      const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch total reviews
      const { count: totalReviews } = await supabase
        .from("user_reviews")
        .select("*", { count: "exact", head: true });

      // Fetch pending reviews
      const { count: pendingReviews } = await supabase
        .from("user_reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch total points distributed
      const { data: pointsData } = await supabase
        .from("rewards_history")
        .select("points");
      
      const totalPointsDistributed = pointsData?.reduce((sum, item) => sum + item.points, 0) || 0;

      setStats({
        totalGarages: totalGarages || 0,
        garagesWithRatingsOnly,
        garagesWithReviews: garagesWithReviews || 0,
        totalCustomers: totalCustomers || 0,
        totalReviews: totalReviews || 0,
        pendingReviews: pendingReviews || 0,
        totalPointsDistributed,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Garages",
      value: stats.totalGarages,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Garages with Reviews",
      value: stats.garagesWithReviews,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Ratings Only",
      value: stats.garagesWithRatingsOnly,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
    },
    {
      title: "Points Distributed",
      value: stats.totalPointsDistributed,
      icon: Award,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className={`${stat.borderColor} ${stat.bgColor}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-10 h-10 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="font-medium text-foreground mb-1">Pending Reviews</p>
              <p>{stats.pendingReviews} reviews waiting for moderation</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="font-medium text-foreground mb-1">Customer Engagement</p>
              <p>{stats.totalCustomers} registered customers</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="font-medium text-foreground mb-1">Garage Coverage</p>
              <p>{Math.round((stats.garagesWithReviews / (stats.totalGarages || 1)) * 100)}% garages have reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
