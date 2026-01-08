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
  LogOut,
  Building2,
  LayoutDashboard,
  AlertTriangle,
  BadgeCheck,
  ArrowRight,
  MessageSquare,
  FileText
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { AdminReviewCard } from "@/components/admin/AdminReviewCard";
import { EnhancedUserManagement } from "@/components/admin/EnhancedUserManagement";
import { GarageManagement } from "@/components/admin/GarageManagement";
import { CustomerManagement } from "@/components/admin/CustomerManagement";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { VerificationRequests } from "@/components/admin/VerificationRequests";
import { ClaimManagement } from "@/components/admin/ClaimManagement";
import { LeadsManagement } from "@/components/admin/LeadsManagement";
import { BlogManagement } from "@/components/admin/BlogManagement";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Review {
  id: string;
  garage_name: string;
  garage_location: string | null;
  rating: number;
  review_text: string | null;
  status: string | null;
  created_at: string;
  is_verified: boolean | null;
  dispute_reason: string | null;
  disputed_at: string | null;
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
    disputed: 0,
  });
  const [selectedStatDialog, setSelectedStatDialog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin-login");
      return;
    }
    
    if (!authLoading && !adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions.",
        variant: "destructive",
      });
      navigate("/admin-login");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate, toast]);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from("user_reviews")
        .select("id, garage_name, garage_location, rating, review_text, status, created_at, is_verified, dispute_reason, disputed_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Calculate stats
      const pending = (data || []).filter(r => r.status === "pending" || !r.status).length;
      const approved = (data || []).filter(r => r.status === "approved").length;
      const rejected = (data || []).filter(r => r.status === "rejected").length;
      const disputed = (data || []).filter(r => r.status === "disputed").length;
      setStats({ pending, approved, rejected, disputed });
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

  const handleApprove = async (reviewId: string, wasDisputed: boolean = false, reviewData?: Review) => {
    try {
      const { error } = await supabase
        .from("user_reviews")
        .update({ status: "approved", dispute_reason: null, disputed_at: null })
        .eq("id", reviewId);

      if (error) throw error;

      // Send dispute resolution email if it was a disputed review
      if (wasDisputed && reviewData) {
        await sendDisputeResolutionEmail(reviewData, "approved");
      }

      toast({
        title: "Review Approved",
        description: wasDisputed ? "The disputed review has been re-approved and the garage owner notified." : "The review is now live.",
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

  const handleReject = async (reviewId: string, wasDisputed: boolean = false, reviewData?: Review) => {
    try {
      const { error } = await supabase
        .from("user_reviews")
        .update({ status: "rejected" })
        .eq("id", reviewId);

      if (error) throw error;

      // Send dispute resolution email if it was a disputed review
      if (wasDisputed && reviewData) {
        await sendDisputeResolutionEmail(reviewData, "rejected");
      }

      toast({
        title: "Review Rejected",
        description: wasDisputed ? "The disputed review has been removed and the garage owner notified." : "The review has been rejected.",
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

  const sendDisputeResolutionEmail = async (review: Review, resolution: "approved" | "rejected") => {
    try {
      // Get the garage owner's email
      const { data: garage } = await supabase
        .from("garages")
        .select("owner_id")
        .eq("name", review.garage_name)
        .maybeSingle();

      if (!garage?.owner_id) {
        console.log("No garage owner found for notification");
        return;
      }

      // Get the garage owner's email from auth
      const { data: garageOwner } = await supabase
        .from("garage_owners")
        .select("contact_phone, business_name")
        .eq("user_id", garage.owner_id)
        .maybeSingle();

      // Get user email from profiles or use a fallback
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", garage.owner_id)
        .maybeSingle();

      // We need to get the email from auth.users - use service role via edge function
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      await supabase.functions.invoke("send-review-notification", {
        body: {
          type: "dispute_resolution",
          reviewData: {
            garageEmail: `${garage.owner_id}@garage.merigarage.com`, // Placeholder - will be handled by edge function
            garageName: review.garage_name,
            rating: review.rating,
            reviewText: review.review_text,
            disputeReason: review.dispute_reason,
            resolution: resolution,
            garageOwnerId: garage.owner_id,
          },
        },
      });

      console.log("Dispute resolution notification sent");
    } catch (error) {
      console.error("Error sending dispute resolution email:", error);
      // Don't throw - email failure shouldn't block the action
    }
  };

  const handleEdit = async (reviewId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from("user_reviews")
        .update({ review_text: newText })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review Updated",
        description: "The review text has been saved.",
      });

      fetchReviews();
    } catch (error: any) {
      console.error("Error updating review:", error);
      toast({
        title: "Error",
        description: "Failed to update review",
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
    (review.review_text || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingReviews = filteredReviews.filter(r => r.status === "pending" || !r.status);
  const approvedReviews = filteredReviews.filter(r => r.status === "approved");
  const rejectedReviews = filteredReviews.filter(r => r.status === "rejected");
  const disputedReviews = filteredReviews.filter(r => r.status === "disputed");

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

        {/* Stats Cards - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="border-yellow-500/30 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10 transition-colors"
            onClick={() => setSelectedStatDialog("pending")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                <span>View pending</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="border-green-500/30 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition-colors"
            onClick={() => setSelectedStatDialog("approved")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved Reviews</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <span>View approved</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="border-orange-500/30 bg-orange-500/5 cursor-pointer hover:bg-orange-500/10 transition-colors"
            onClick={() => setSelectedStatDialog("disputed")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disputed Reviews</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.disputed}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                <span>View disputes</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
            onClick={() => setSelectedStatDialog("rejected")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected Reviews</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                <span>View rejected</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stat Detail Dialog */}
        <Dialog open={!!selectedStatDialog} onOpenChange={() => setSelectedStatDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedStatDialog === "pending" && (
                  <>
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span>Pending Reviews ({stats.pending})</span>
                  </>
                )}
                {selectedStatDialog === "approved" && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Approved Reviews ({stats.approved})</span>
                  </>
                )}
                {selectedStatDialog === "disputed" && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Disputed Reviews ({stats.disputed})</span>
                  </>
                )}
                {selectedStatDialog === "rejected" && (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>Rejected Reviews ({stats.rejected})</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedStatDialog === "pending" && "Reviews awaiting your approval or rejection."}
                {selectedStatDialog === "approved" && "Reviews that are live and visible to users."}
                {selectedStatDialog === "disputed" && "Reviews contested by garage owners requiring resolution."}
                {selectedStatDialog === "rejected" && "Reviews that were removed from the platform."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {selectedStatDialog === "pending" && (
                <>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-700 mb-2">Quick Actions</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Approve reviews to make them visible on garage profiles
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Reject reviews that violate community guidelines
                      </li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedStatDialog(null);
                      setActiveTab("reviews");
                    }}
                    className="w-full"
                  >
                    Go to Pending Reviews
                  </Button>
                </>
              )}
              
              {selectedStatDialog === "approved" && (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-2">About Approved Reviews</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Visible on garage profiles and search results</li>
                      <li>• Contribute to garage ratings and rankings</li>
                      <li>• Can still be disputed by garage owners</li>
                      <li>• Points awarded to reviewers</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedStatDialog(null);
                      setActiveTab("reviews");
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    View Approved Reviews
                  </Button>
                </>
              )}
              
              {selectedStatDialog === "disputed" && (
                <>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-700 mb-2">Dispute Resolution</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Review garage owner's dispute reason carefully</li>
                      <li>• Check if review violates community guidelines</li>
                      <li>• Re-approve if dispute is invalid</li>
                      <li>• Reject if the review is genuinely problematic</li>
                      <li>• Garage owners are notified of your decision</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedStatDialog(null);
                      setActiveTab("reviews");
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Resolve Disputes Now
                  </Button>
                </>
              )}
              
              {selectedStatDialog === "rejected" && (
                <>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 mb-2">Rejected Reviews</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Not visible to users</li>
                      <li>• No points awarded to reviewer</li>
                      <li>• Can be re-approved if rejected in error</li>
                      <li>• Keep record for moderation audit</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedStatDialog(null);
                      setActiveTab("reviews");
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    View Rejected Reviews
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-2 p-2">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="w-4 h-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-2">
              <Building2 className="w-4 h-4" />
              Claims
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-2">
              <BadgeCheck className="w-4 h-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="garages" className="gap-2">
              <Building2 className="w-4 h-4" />
              Garages
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <FileText className="w-4 h-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Quote Requests / Leads
                </CardTitle>
                <CardDescription>
                  Manage customer quote requests. For unclaimed garages, contact them manually to pass on leads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Garage Claim Requests
                </CardTitle>
                <CardDescription>
                  Review and approve ownership claims from garage owners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClaimManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {/* Search and Refresh */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews by garage or content..."
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
              <TabsList className="flex-wrap">
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({pendingReviews.length})
                </TabsTrigger>
                <TabsTrigger value="disputed" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Disputed ({disputedReviews.length})
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
                        onEdit={handleEdit}
                        showActions
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="disputed" className="mt-6">
                {disputedReviews.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No disputed reviews</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {disputedReviews.map((review) => (
                      <AdminReviewCard
                        key={review.id}
                        review={review}
                        onApprove={() => handleApprove(review.id, true, review)}
                        onReject={() => handleReject(review.id, true, review)}
                        onEdit={handleEdit}
                        showActions
                        showDisputeReason
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

          <TabsContent value="verification">
            <VerificationRequests />
          </TabsContent>

          <TabsContent value="garages">
            <GarageManagement />
          </TabsContent>

          <TabsContent value="blog">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Blog & Car Care Tips
                </CardTitle>
                <CardDescription>
                  Create and manage blog articles for SEO. Published articles appear on homepage and /blog page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BlogManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="users">
            <EnhancedUserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
