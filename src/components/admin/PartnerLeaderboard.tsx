import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Building2,
  IndianRupee,
  RefreshCw,
  Sparkles,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

type DateRangePreset = "week" | "month" | "quarter" | "year" | "all" | "custom";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface PartnerStats {
  id: string;
  full_name: string;
  username: string;
  profile_photo: string | null;
  phone: string;
  total_listings: number;
  approved_listings: number;
  reputation_upsells: number;
  gms_upsells: number;
  total_upsells: number;
  total_earnings: number;
  pending_earnings: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
};

const getRankBgClass = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
  if (rank === 2) return "bg-gradient-to-r from-gray-300/20 to-gray-400/10 border-gray-400/30";
  if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30";
  return "bg-muted/30";
};

const getPresetDateRange = (preset: DateRangePreset): DateRange => {
  const now = new Date();
  switch (preset) {
    case "week":
      return { from: subDays(now, 7), to: now };
    case "month":
      return { from: subMonths(now, 1), to: now };
    case "quarter":
      return { from: subMonths(now, 3), to: now };
    case "year":
      return { from: subYears(now, 1), to: now };
    case "all":
    default:
      return { from: undefined, to: undefined };
  }
};

const presetLabels: Record<DateRangePreset, string> = {
  week: "Last 7 Days",
  month: "Last 30 Days",
  quarter: "Last 3 Months",
  year: "Last Year",
  all: "All Time",
  custom: "Custom Range",
};

export function PartnerLeaderboard() {
  const [partners, setPartners] = useState<PartnerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePresetChange = (preset: DateRangePreset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      setDateRange(getPresetDateRange(preset));
    }
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
      setDatePreset("custom");
    }
  };

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all partners
      const { data: partnersData, error: partnersError } = await supabase
        .from("partners")
        .select("id, full_name, username, profile_photo, phone")
        .eq("status", "active");

      if (partnersError) throw partnersError;

      // Build listings query with date filter
      let listingsQuery = supabase
        .from("partner_listings")
        .select("partner_id, status, reputation_upsell, gms_upsell, total_earning, payout_status, submitted_at");

      // Apply date filter if set
      if (dateRange.from) {
        listingsQuery = listingsQuery.gte("submitted_at", startOfDay(dateRange.from).toISOString());
      }
      if (dateRange.to) {
        listingsQuery = listingsQuery.lte("submitted_at", endOfDay(dateRange.to).toISOString());
      }

      const { data: listingsData, error: listingsError } = await listingsQuery;

      if (listingsError) throw listingsError;

      // Calculate stats for each partner
      const partnerStats: PartnerStats[] = (partnersData || []).map((partner) => {
        const partnerListings = (listingsData || []).filter(
          (l) => l.partner_id === partner.id
        );

        const approvedListings = partnerListings.filter((l) => l.status === "approved");
        const reputationUpsells = approvedListings.filter((l) => l.reputation_upsell).length;
        const gmsUpsells = approvedListings.filter((l) => l.gms_upsell).length;

        const totalEarnings = approvedListings
          .filter((l) => l.payout_status === "paid")
          .reduce((sum, l) => sum + (l.total_earning || 0), 0);

        const pendingEarnings = approvedListings
          .filter((l) => l.payout_status === "pending")
          .reduce((sum, l) => sum + (l.total_earning || 0), 0);

        return {
          id: partner.id,
          full_name: partner.full_name,
          username: partner.username,
          profile_photo: partner.profile_photo,
          phone: partner.phone,
          total_listings: partnerListings.length,
          approved_listings: approvedListings.length,
          reputation_upsells: reputationUpsells,
          gms_upsells: gmsUpsells,
          total_upsells: reputationUpsells + gmsUpsells,
          total_earnings: totalEarnings,
          pending_earnings: pendingEarnings,
        };
      });

      setPartners(partnerStats);
    } catch (error: any) {
      console.error("Error fetching leaderboard data:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [dateRange]);

  const topByListings = [...partners]
    .sort((a, b) => b.approved_listings - a.approved_listings)
    .slice(0, 10);

  const topByUpsells = [...partners]
    .sort((a, b) => b.total_upsells - a.total_upsells)
    .slice(0, 10);

  const topByEarnings = [...partners]
    .sort((a, b) => b.total_earnings - a.total_earnings)
    .slice(0, 10);

  const totalStats = {
    totalPartners: partners.length,
    totalListings: partners.reduce((sum, p) => sum + p.approved_listings, 0),
    totalUpsells: partners.reduce((sum, p) => sum + p.total_upsells, 0),
    totalEarnings: partners.reduce((sum, p) => sum + p.total_earnings, 0),
  };

  const LeaderboardList = ({
    data,
    metric,
    getValue,
    icon: Icon,
  }: {
    data: PartnerStats[];
    metric: string;
    getValue: (p: PartnerStats) => number | string;
    icon: React.ElementType;
  }) => (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No partners yet</p>
        </div>
      ) : (
        data.map((partner, index) => (
          <div
            key={partner.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-sm ${getRankBgClass(index + 1)}`}
          >
            <div className="flex-shrink-0 w-8 flex justify-center">
              {getRankIcon(index + 1)}
            </div>
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={partner.profile_photo || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {partner.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{partner.full_name}</p>
              <p className="text-sm text-muted-foreground">@{partner.username}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 font-bold text-lg">
                <Icon className="w-4 h-4 text-primary" />
                {getValue(partner)}
              </div>
              <p className="text-xs text-muted-foreground">{metric}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Partner Leaderboard</h2>
            <p className="text-sm text-muted-foreground">Top performing partners</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={fetchLeaderboardData} size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>Time Period:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["week", "month", "quarter", "year", "all"] as DateRangePreset[]).map((preset) => (
                <Button
                  key={preset}
                  variant={datePreset === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(preset)}
                  className="text-xs"
                >
                  {presetLabels[preset]}
                </Button>
              ))}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={datePreset === "custom" ? "default" : "outline"}
                    size="sm"
                    className="gap-2 text-xs"
                  >
                    <Calendar className="w-3 h-3" />
                    {datePreset === "custom" && dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                      : "Custom"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => {
                      handleCustomDateSelect(range as DateRange);
                      if (range?.from && range?.to) {
                        setIsCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {datePreset !== "all" && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                  : presetLabels[datePreset]}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Partners</p>
                <p className="text-2xl font-bold">{totalStats.totalPartners}</p>
              </div>
              <Users className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Listings</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.totalListings}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Upsells</p>
                <p className="text-2xl font-bold text-purple-600">{totalStats.totalUpsells}</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
                <p className="text-2xl font-bold text-green-600">₹{totalStats.totalEarnings.toLocaleString()}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Tabs */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      ) : (
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">By Listings</span>
              <span className="sm:hidden">Listings</span>
            </TabsTrigger>
            <TabsTrigger value="upsells" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">By Upsells</span>
              <span className="sm:hidden">Upsells</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2">
              <IndianRupee className="w-4 h-4" />
              <span className="hidden sm:inline">By Earnings</span>
              <span className="sm:hidden">Earnings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Top Partners by Approved Listings
                </CardTitle>
                <CardDescription>
                  Partners ranked by total approved garage listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardList
                  data={topByListings}
                  metric="listings"
                  getValue={(p) => p.approved_listings}
                  icon={Building2}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upsells">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Top Partners by Upsells
                </CardTitle>
                <CardDescription>
                  Partners ranked by total upsells (Reputation + GMS)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardList
                  data={topByUpsells}
                  metric="upsells"
                  getValue={(p) => p.total_upsells}
                  icon={TrendingUp}
                />
                {/* Upsell Breakdown for Top 3 */}
                {topByUpsells.slice(0, 3).length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground">
                      Upsell Breakdown (Top 3)
                    </h4>
                    <div className="space-y-3">
                      {topByUpsells.slice(0, 3).map((partner, index) => (
                        <div key={partner.id} className="flex items-center gap-4 text-sm">
                          <span className="w-6 font-bold text-muted-foreground">#{index + 1}</span>
                          <span className="flex-1 truncate">{partner.full_name}</span>
                          <Badge variant="secondary" className="gap-1">
                            <span className="text-purple-600">{partner.reputation_upsells}</span> Rep
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <span className="text-blue-600">{partner.gms_upsells}</span> GMS
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IndianRupee className="w-5 h-5 text-green-500" />
                  Top Partners by Earnings
                </CardTitle>
                <CardDescription>
                  Partners ranked by total paid earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardList
                  data={topByEarnings}
                  metric="earned"
                  getValue={(p) => `₹${p.total_earnings.toLocaleString()}`}
                  icon={IndianRupee}
                />
                {/* Pending Earnings Note */}
                {topByEarnings.some((p) => p.pending_earnings > 0) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground">
                      Pending Payouts (Top Partners)
                    </h4>
                    <div className="space-y-2">
                      {topByEarnings
                        .filter((p) => p.pending_earnings > 0)
                        .slice(0, 5)
                        .map((partner) => (
                          <div key={partner.id} className="flex items-center justify-between text-sm p-2 bg-yellow-500/10 rounded">
                            <span className="truncate">{partner.full_name}</span>
                            <Badge variant="outline" className="text-yellow-700 border-yellow-500/30">
                              ₹{partner.pending_earnings.toLocaleString()} pending
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
