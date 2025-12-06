import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  RefreshCw,
  Eye,
  Award,
  Star,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  user_id: string;
  full_name: string | null;
  total_points: number | null;
  created_at: string;
  review_count?: number;
  redemption_count?: number;
}

interface CustomerDetails extends Customer {
  reviews: Array<{
    id: string;
    garage_name: string;
    rating: number;
    status: string | null;
    created_at: string;
  }>;
  redemptions: Array<{
    id: string;
    reward_name: string;
    points_spent: number;
    status: string | null;
    created_at: string;
  }>;
  rewards_history: Array<{
    id: string;
    points: number;
    reason: string;
    created_at: string;
  }>;
}

export function CustomerManagement() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, total_points, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch review counts per user
      const { data: reviewCounts, error: reviewError } = await supabase
        .from("user_reviews")
        .select("user_id");

      if (reviewError) throw reviewError;

      // Fetch redemption counts per user
      const { data: redemptionCounts, error: redemptionError } = await supabase
        .from("redemptions")
        .select("user_id");

      if (redemptionError) throw redemptionError;

      // Combine data
      const customersWithCounts = (profiles || []).map(profile => {
        const reviews = (reviewCounts || []).filter(r => r.user_id === profile.user_id);
        const redemptions = (redemptionCounts || []).filter(r => r.user_id === profile.user_id);
        return {
          ...profile,
          review_count: reviews.length,
          redemption_count: redemptions.length,
        };
      });

      setCustomers(customersWithCounts);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerDetails = async (customer: Customer) => {
    setIsLoadingDetails(true);
    try {
      // Fetch reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from("user_reviews")
        .select("id, garage_name, rating, status, created_at")
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch redemptions
      const { data: redemptions, error: redemptionsError } = await supabase
        .from("redemptions")
        .select("id, reward_name, points_spent, status, created_at")
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false });

      if (redemptionsError) throw redemptionsError;

      // Fetch rewards history
      const { data: rewards_history, error: historyError } = await supabase
        .from("rewards_history")
        .select("id, points, reason, created_at")
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      setSelectedCustomer({
        ...customer,
        reviews: reviews || [],
        redemptions: redemptions || [],
        rewards_history: rewards_history || [],
      });
      setIsDetailsOpen(true);
    } catch (error: any) {
      console.error("Error fetching customer details:", error);
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getTierFromPoints = (points: number): { name: string; color: string } => {
    if (points >= 1000) return { name: "Platinum", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" };
    if (points >= 500) return { name: "Gold", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" };
    if (points >= 200) return { name: "Silver", color: "bg-gray-400/10 text-gray-600 border-gray-400/30" };
    return { name: "Bronze", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" };
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalPoints = customers.reduce((sum, c) => sum + (c.total_points || 0), 0);
  const activeReviewers = customers.filter(c => (c.review_count || 0) > 0).length;
  const rewardRedeemers = customers.filter(c => (c.redemption_count || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchCustomers} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Reviewers</p>
                <p className="text-2xl font-bold">{activeReviewers}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reward Redeemers</p>
                <p className="text-2xl font-bold">{rewardRedeemers}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const tier = getTierFromPoints(customer.total_points || 0);
                    return (
                      <TableRow key={customer.user_id}>
                        <TableCell className="font-medium">
                          {customer.full_name || "Anonymous"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span>{customer.total_points || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tier.color}>
                            {tier.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.review_count || 0}</TableCell>
                        <TableCell>{customer.redemption_count || 0}</TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchCustomerDetails(customer)}
                            disabled={isLoadingDetails}
                          >
                            <Eye className={`w-4 h-4 ${isLoadingDetails ? "animate-spin" : ""}`} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Complete activity and rewards information
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedCustomer.full_name || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="font-medium">{selectedCustomer.total_points || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tier</p>
                  <Badge variant="outline" className={getTierFromPoints(selectedCustomer.total_points || 0).color}>
                    {getTierFromPoints(selectedCustomer.total_points || 0).name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Reviews ({selectedCustomer.reviews.length})
                </h4>
                {selectedCustomer.reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews yet</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCustomer.reviews.map(review => (
                      <div key={review.id} className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{review.garage_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {review.rating}
                            </div>
                            <span>•</span>
                            <span>{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          review.status === "approved" ? "bg-green-500/10 text-green-600" :
                          review.status === "rejected" ? "bg-red-500/10 text-red-600" :
                          "bg-yellow-500/10 text-yellow-600"
                        }>
                          {review.status || "pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Points History */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Points History ({selectedCustomer.rewards_history.length})
                </h4>
                {selectedCustomer.rewards_history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No points earned yet</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCustomer.rewards_history.map(history => (
                      <div key={history.id} className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
                        <div>
                          <p className="text-sm">{history.reason}</p>
                          <p className="text-xs text-muted-foreground">{new Date(history.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          +{history.points} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Redemptions */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Redemptions ({selectedCustomer.redemptions.length})
                </h4>
                {selectedCustomer.redemptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No redemptions yet</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCustomer.redemptions.map(redemption => (
                      <div key={redemption.id} className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{redemption.reward_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(redemption.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                          -{redemption.points_spent} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
