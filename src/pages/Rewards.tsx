import { useState } from "react";
import { Gift, Star, Percent, Coffee, Wrench, Crown, CheckCircle, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: React.ReactNode;
  category: "discount" | "perk" | "premium";
  available: boolean;
}

const rewards: Reward[] = [
  {
    id: "1",
    title: "10% Off Next Service",
    description: "Get 10% discount at any partner garage",
    points: 500,
    icon: <Percent className="w-6 h-6" />,
    category: "discount",
    available: true,
  },
  {
    id: "2",
    title: "Free Oil Check",
    description: "Complimentary oil level check at partner garages",
    points: 200,
    icon: <Wrench className="w-6 h-6" />,
    category: "perk",
    available: true,
  },
  {
    id: "3",
    title: "Free Coffee Voucher",
    description: "Enjoy a coffee while you wait for your service",
    points: 100,
    icon: <Coffee className="w-6 h-6" />,
    category: "perk",
    available: true,
  },
  {
    id: "4",
    title: "25% Off Major Service",
    description: "Big discount on major service appointments",
    points: 1500,
    icon: <Percent className="w-6 h-6" />,
    category: "discount",
    available: true,
  },
  {
    id: "5",
    title: "Priority Booking",
    description: "Skip the queue with priority appointment slots",
    points: 800,
    icon: <Crown className="w-6 h-6" />,
    category: "premium",
    available: true,
  },
  {
    id: "6",
    title: "Free Tire Rotation",
    description: "Complimentary tire rotation service",
    points: 600,
    icon: <Wrench className="w-6 h-6" />,
    category: "perk",
    available: true,
  },
];

const mockUserPoints = 750;
const mockTotalEarned = 1250;
const mockReviewsCount = 12;

export default function Rewards() {
  const [userPoints] = useState(mockUserPoints);
  const { toast } = useToast();

  const handleRedeem = (reward: Reward) => {
    if (userPoints < reward.points) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.points - userPoints} more points to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reward Redeemed! 🎉",
      description: `You've successfully redeemed "${reward.title}". Check your email for details.`,
    });
  };

  const getCategoryColor = (category: Reward["category"]) => {
    switch (category) {
      case "discount":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "perk":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "premium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  const nextTierPoints = 1000;
  const progressToNextTier = (userPoints / nextTierPoints) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Points Overview */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Rewards</h1>
          <p className="text-muted-foreground">Earn points by writing verified reviews and redeem them for exclusive perks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium">Available Points</p>
                  <p className="text-4xl font-bold">{userPoints}</p>
                </div>
                <div className="p-3 bg-primary-foreground/20 rounded-full">
                  <Gift className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Earned</p>
                  <p className="text-4xl font-bold text-foreground">{mockTotalEarned}</p>
                </div>
                <div className="p-3 bg-secondary rounded-full">
                  <Star className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Reviews Written</p>
                  <p className="text-4xl font-bold text-foreground">{mockReviewsCount}</p>
                </div>
                <div className="p-3 bg-secondary rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Tier */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Progress to Gold Tier</CardTitle>
            <CardDescription>
              Earn {nextTierPoints - userPoints} more points to unlock exclusive Gold rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressToNextTier} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{userPoints} points</span>
              <span>{nextTierPoints} points</span>
            </div>
          </CardContent>
        </Card>

        {/* How to Earn Points */}
        <Card className="mb-8 bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              How to Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="text-primary font-bold">+50</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Write a Review</p>
                  <p className="text-sm text-muted-foreground">Share your garage experience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="text-primary font-bold">+100</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Verified Review</p>
                  <p className="text-sm text-muted-foreground">Upload receipt for bonus points</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="text-primary font-bold">+25</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Add Photos</p>
                  <p className="text-sm text-muted-foreground">Include images with your review</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Rewards */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canRedeem = userPoints >= reward.points;
              return (
                <Card 
                  key={reward.id} 
                  className={`transition-all duration-200 hover:shadow-lg ${!canRedeem ? "opacity-75" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${getCategoryColor(reward.category)}`}>
                        {reward.icon}
                      </div>
                      <Badge variant="secondary" className={getCategoryColor(reward.category)}>
                        {reward.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{reward.title}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Gift className="w-4 h-4 text-primary" />
                        <span className="font-bold text-foreground">{reward.points}</span>
                        <span className="text-muted-foreground text-sm">points</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem}
                        className="gap-1"
                      >
                        {canRedeem ? (
                          "Redeem"
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            {reward.points - userPoints} more
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
