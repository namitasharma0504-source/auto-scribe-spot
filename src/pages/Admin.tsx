import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Star,
  Search,
  RefreshCw,
  LogOut
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { AdminReviewCard } from "@/components/admin/AdminReviewCard";
import { UserManagement } from "@/components/admin/UserManagement";

interface Review {
  id: string;
  garage_name: string;
  garage_location: string | null;
  rating: number;
  review_text: string | null;
  status: string | null;
  created_at: string;
  is_verified: boolean | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (!authLoading && !adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate, toast]);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from("user_reviews")
        .select("id, garage_name, garage_location, rating, review_text, status, created_at, is_verified")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Calculate stats
      const pending = (data || []).filter(r => r.status === "pending" || !r.status).length;
      const approved = (data || []).filter(r => r.status === "approved").length;
      const rejected = (data || []).filter(r => r.status === "rejected").length;
      setStats({ pending, approved, rejected });
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReviews();
    }
  }, [isAdmin]);

  const handleApprove = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      const { error } = await supabase
        .from("user_reviews")
        .update({ status: "approved" })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review Approved",
        description: "The review is now live.",
      });

      fetchReviews();
    } catch (error: any) {
      console.error("Error approving review:", error);
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("user_reviews")
        .update({ status: "rejected" })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review Rejected",
        description: "The review has been rejected.",
      });

      fetchReviews();
    } catch (error: any) {
      console.error("Error rejecting review:", error);
      toast({
        title: "Error",
        description: "Failed to reject review",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredReviews = reviews.filter(review =>
    review.garage_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (review.review_text || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (review.garage_location || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingReviews = filteredReviews.filter(r => r.status === "pending" || !r.status);
  const approvedReviews = filteredReviews.filter(r => r.status === "approved");
  const rejectedReviews = filteredReviews.filter(r => r.status === "rejected");

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage reviews and users</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved Reviews</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected Reviews</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 gap-2">
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="w-4 h-4" />
              Review Moderation
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-6">
            {/* Search and Refresh */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews by garage, content, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchReviews} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoadingReviews ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Review Tabs */}
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({pendingReviews.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approved ({approvedReviews.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="w-4 h-4" />
                  Rejected ({rejectedReviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {isLoadingReviews ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : pendingReviews.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending reviews</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map((review) => (
                      <AdminReviewCard
                        key={review.id}
                        review={review}
                        onApprove={() => handleApprove(review.id)}
                        onReject={() => handleReject(review.id)}
                        showActions
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                {approvedReviews.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No approved reviews</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {approvedReviews.map((review) => (
                      <AdminReviewCard
                        key={review.id}
                        review={review}
                        onApprove={() => {}}
                        onReject={() => handleReject(review.id)}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                {rejectedReviews.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No rejected reviews</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {rejectedReviews.map((review) => (
                      <AdminReviewCard
                        key={review.id}
                        review={review}
                        onApprove={() => handleApprove(review.id)}
                        onReject={() => {}}
                        showActions
                        showApproveOnly
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
