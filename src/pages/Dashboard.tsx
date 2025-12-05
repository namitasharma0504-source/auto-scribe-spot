import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Star, Gift, CheckCircle, Clock, MapPin, Calendar,
  TrendingUp, Award, LogOut, ChevronRight
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Review {
  id: string;
  garage_name: string;
  garage_location: string | null;
  rating: number;
  review_text: string | null;
  is_verified: boolean;
  points_earned: number;
  created_at: string;
}

interface RewardHistory {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

interface Redemption {
  id: string;
  reward_name: string;
  points_spent: number;
  garage_name: string | null;
  status: string;
  created_at: string;
  used_at: string | null;
}

interface Profile {
  full_name: string | null;
  total_points: number;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<RewardHistory[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const [profileRes, reviewsRes, rewardsRes, redemptionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_reviews").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("rewards_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("redemptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (rewardsRes.data) setRewardsHistory(rewardsRes.data);
      if (redemptionsRes.data) setRedemptions(redemptionsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPointsEarned = rewardsHistory.reduce((sum, r) => sum + r.points, 0);
  const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.points_spent, 0);
  const availablePoints = profile?.total_points ?? (totalPointsEarned - totalPointsRedeemed);
  const verifiedReviews = reviews.filter(r => r.is_verified).length;
  const nextTierPoints = 1000;
  const progressToNextTier = Math.min((availablePoints / nextTierPoints) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name || user?.email?.split("@")[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">Track your reviews, rewards, and redemptions</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="mt-4 md:mt-0 gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Gift className="w-8 h-8 mb-2 opacity-80" />
                <p className="text-primary-foreground/80 text-sm">Available Points</p>
                <p className="text-3xl font-bold">{availablePoints}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Star className="w-8 h-8 mb-2 text-primary" />
                <p className="text-muted-foreground text-sm">Total Reviews</p>
                <p className="text-3xl font-bold text-foreground">{reviews.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                <p className="text-muted-foreground text-sm">Verified</p>
                <p className="text-3xl font-bold text-foreground">{verifiedReviews}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Award className="w-8 h-8 mb-2 text-amber-500" />
                <p className="text-muted-foreground text-sm">Redeemed</p>
                <p className="text-3xl font-bold text-foreground">{redemptions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Tier */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Progress to Gold Tier
              </CardTitle>
              <Link to="/rewards">
                <Button variant="ghost" size="sm" className="gap-1">
                  View Rewards <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              {availablePoints >= nextTierPoints 
                ? "Congratulations! You've reached Gold Tier!" 
                : `Earn ${nextTierPoints - availablePoints} more points to unlock exclusive Gold rewards`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressToNextTier} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{availablePoints} points</span>
              <span>{nextTierPoints} points</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Reviews, Rewards History, Redemptions */}
        <Tabs defaultValue="reviews" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reviews">My Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="earned">Points Earned ({rewardsHistory.length})</TabsTrigger>
            <TabsTrigger value="redeemed">Redemptions ({redemptions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground mb-4">Start reviewing garages to earn points!</p>
                  <Link to="/submit-review">
                    <Button>Write Your First Review</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{review.garage_name}</h3>
                          {review.is_verified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        {review.garage_location && (
                          <p className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                            <MapPin className="w-4 h-4" />
                            {review.garage_location}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? "text-primary fill-primary" : "text-muted"}`}
                            />
                          ))}
                        </div>
                        {review.review_text && (
                          <p className="text-foreground line-clamp-2">{review.review_text}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Gift className="w-3 h-3" />
                          +{review.points_earned} pts
                        </Badge>
                        <p className="text-muted-foreground text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="earned" className="space-y-4">
            {rewardsHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No points earned yet</h3>
                  <p className="text-muted-foreground">Write reviews to start earning points!</p>
                </CardContent>
              </Card>
            ) : (
              rewardsHistory.map((reward) => (
                <Card key={reward.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{reward.reason}</p>
                          <p className="text-muted-foreground text-sm">
                            {format(new Date(reward.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        +{reward.points} pts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="redeemed" className="space-y-4">
            {redemptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No redemptions yet</h3>
                  <p className="text-muted-foreground mb-4">Use your points to get rewards!</p>
                  <Link to="/rewards">
                    <Button>Browse Rewards</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              redemptions.map((redemption) => (
                <Card key={redemption.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          redemption.status === "active" 
                            ? "bg-blue-100" 
                            : redemption.status === "used" 
                            ? "bg-gray-100" 
                            : "bg-red-100"
                        }`}>
                          <Gift className={`w-5 h-5 ${
                            redemption.status === "active" 
                              ? "text-blue-600" 
                              : redemption.status === "used" 
                              ? "text-gray-600" 
                              : "text-red-600"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{redemption.reward_name}</p>
                          <p className="text-muted-foreground text-sm">
                            {redemption.garage_name && `at ${redemption.garage_name} • `}
                            {format(new Date(redemption.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={
                          redemption.status === "active" 
                            ? "bg-blue-100 text-blue-700" 
                            : redemption.status === "used" 
                            ? "bg-gray-100 text-gray-700" 
                            : "bg-red-100 text-red-700"
                        }>
                          {redemption.status}
                        </Badge>
                        <Badge variant="outline">-{redemption.points_spent} pts</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
