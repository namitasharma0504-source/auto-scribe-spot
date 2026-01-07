import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Star, MessageSquare, TrendingUp, Eye, 
  Settings, Image, Wrench, ExternalLink, BarChart3,
  Award, Users, Calendar, ArrowUp, ArrowDown, BadgeCheck,
  Percent, ShieldCheck, Clock, Info, Rocket, Sparkles,
  AlertTriangle, MapPin
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { BoostPanel } from "@/components/garage/BoostPanel";
import { StatDetailDialog } from "@/components/garage/StatDetailDialog";
import { GarageLeadsSection } from "@/components/garage/GarageLeadsSection";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Sample analytics data
const viewsData = [
  { month: "Jan", views: 120 },
  { month: "Feb", views: 180 },
  { month: "Mar", views: 250 },
  { month: "Apr", views: 220 },
  { month: "May", views: 340 },
  { month: "Jun", views: 420 },
];

const ratingsData = [
  { month: "Jan", rating: 4.2 },
  { month: "Feb", rating: 4.4 },
  { month: "Mar", rating: 4.3 },
  { month: "Apr", rating: 4.5 },
  { month: "May", rating: 4.6 },
  { month: "Jun", rating: 4.7 },
];

// Garage Reviews Section Component
interface GarageReview {
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

function GarageReviewsSection({ garageName }: { garageName: string }) {
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GarageReview | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [isDisputing, setIsDisputing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!garageName) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_reviews")
          .select("id, garage_name, garage_location, rating, review_text, status, created_at, is_verified, dispute_reason, disputed_at")
          .eq("garage_name", garageName)
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReviews((data as GarageReview[]) || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [garageName]);

  const handleDisputeClick = (review: GarageReview) => {
    setSelectedReview(review);
    setDisputeReason("");
    setDisputeDialogOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!selectedReview || !disputeReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for disputing this review.",
        variant: "destructive",
      });
      return;
    }

    setIsDisputing(true);
    try {
      const { error } = await supabase
        .from("user_reviews")
        .update({
          status: "disputed",
          dispute_reason: disputeReason.trim(),
          disputed_at: new Date().toISOString(),
        })
        .eq("id", selectedReview.id);

      if (error) throw error;

      toast({
        title: "Dispute Submitted",
        description: "Your dispute has been sent to admin for review.",
      });

      // Remove the disputed review from the list
      setReviews(reviews.filter(r => r.id !== selectedReview.id));
      setDisputeDialogOpen(false);
    } catch (error: any) {
      console.error("Error disputing review:", error);
      toast({
        title: "Error",
        description: "Failed to submit dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisputing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!garageName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>See what customers are saying about your garage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please save your garage profile first to see reviews.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>
            See what customers are saying about your garage. You can dispute any review you believe is unfair or inaccurate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No published reviews yet. Share your garage profile to get more reviews!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Location & Date */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {review.garage_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {review.garage_location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(review.created_at), "MMM d, yyyy")}
                          </span>
                          {review.is_verified && (
                            <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30">
                              <BadgeCheck className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
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

                      {/* Dispute Button */}
                      <div className="flex lg:flex-col gap-2">
                        <Button
                          onClick={() => handleDisputeClick(review)}
                          variant="outline"
                          className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Dispute
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Review</DialogTitle>
            <DialogDescription>
              Please explain why you believe this review is unfair or inaccurate. Your dispute will be reviewed by our admin team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReview && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < selectedReview.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedReview.review_text || "No review text"}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="dispute-reason">Reason for Dispute *</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Explain why you're disputing this review..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitDispute} 
              disabled={isDisputing || !disputeReason.trim()}
              className="gap-2"
            >
              {isDisputing ? "Submitting..." : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function GarageDashboard() {
  const [garageOwner, setGarageOwner] = useState<any>(null);
  const [garage, setGarage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBadges, setIsSavingBadges] = useState(false);
  const [statDialogOpen, setStatDialogOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<"rating" | "reviews" | "views" | "inquiries">("rating");
  const [verificationRequest, setVerificationRequest] = useState<any>(null);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    country: "India",
    location_link: "",
    photo_url: "",
    services: [] as string[],
    pricing: "",
    special_offers: "",
  });

  // Badge state
  const [badgeData, setBadgeData] = useState({
    is_verified: false,
    is_certified: false,
    is_recommended: false,
    has_discounts: false,
    response_time: "",
    walk_in_welcome: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/garage-auth");
        return;
      }

      // Get garage owner profile
      const { data: owner, error: ownerError } = await supabase
        .from("garage_owners")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (ownerError || !owner) {
        toast({
          title: "Access Denied",
          description: "You don't have a garage owner account.",
          variant: "destructive",
        });
        navigate("/garage-auth");
        return;
      }

      setGarageOwner(owner);

      // Get garage if exists
      if (owner.garage_id) {
        const { data: garageData } = await supabase
          .from("garages")
          .select("*")
          .eq("id", owner.garage_id)
          .single();

        if (garageData) {
          setGarage(garageData);
          setFormData({
            name: garageData.name || "",
            phone: garageData.phone || "",
            address: garageData.address || "",
            state: garageData.state || "",
            city: garageData.city || "",
            country: garageData.country || "India",
            location_link: garageData.location_link || "",
            photo_url: garageData.photo_url || "",
            services: garageData.services || [],
            pricing: garageData.pricing || "",
            special_offers: garageData.special_offers || "",
          });
          setBadgeData({
            is_verified: garageData.is_verified || false,
            is_certified: garageData.is_certified || false,
            is_recommended: garageData.is_recommended || false,
            has_discounts: garageData.has_discounts || false,
            response_time: garageData.response_time || "",
            walk_in_welcome: garageData.walk_in_welcome ?? true,
          });

          // Fetch verification request status
          const { data: verRequest } = await supabase
            .from("verification_requests")
            .select("*")
            .eq("garage_id", garageData.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (verRequest) {
            setVerificationRequest(verRequest);
          }
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const garageData = {
        ...formData,
        owner_id: session.user.id,
        services: typeof formData.services === "string" 
          ? (formData.services as string).split(",").map(s => s.trim()) 
          : formData.services,
      };

      if (garage) {
        // Update existing garage
        const { error } = await supabase
          .from("garages")
          .update(garageData)
          .eq("id", garage.id);

        if (error) throw error;
      } else {
        // Create new garage
        const { data: newGarage, error } = await supabase
          .from("garages")
          .insert(garageData)
          .select()
          .single();

        if (error) throw error;

        // Update garage owner with garage_id
        await supabase
          .from("garage_owners")
          .update({ garage_id: newGarage.id })
          .eq("user_id", session.user.id);

        setGarage(newGarage);
      }

      toast({
        title: "Profile Saved!",
        description: "Your garage profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBadges = async () => {
    if (!garage) {
      toast({
        title: "No Garage Found",
        description: "Please save your garage profile first before managing badges.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBadges(true);
    try {
      // Only update garage-controllable badges (not is_verified or is_recommended)
      const garageControlledBadges = {
        is_certified: badgeData.is_certified,
        has_discounts: badgeData.has_discounts,
        walk_in_welcome: badgeData.walk_in_welcome,
        response_time: badgeData.response_time,
      };

      const { error } = await supabase
        .from("garages")
        .update(garageControlledBadges)
        .eq("id", garage.id);

      if (error) throw error;

      setGarage({ ...garage, ...garageControlledBadges });

      toast({
        title: "Badges Updated!",
        description: "Your garage badges and highlights have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingBadges(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!garage) return;

    setIsRequestingVerification(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Check if there's already a pending request
      if (verificationRequest?.status === 'pending') {
        toast({
          title: "Request Already Pending",
          description: "You already have a pending verification request.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("verification_requests")
        .insert({
          garage_id: garage.id,
          requested_by: session.user.id,
          status: 'pending',
          request_message: verificationMessage || null,
        })
        .select()
        .single();

      if (error) throw error;

      setVerificationRequest(data);
      setVerificationDialogOpen(false);
      setVerificationMessage("");

      toast({
        title: "Verification Requested!",
        description: "Your verification request has been submitted. We'll review it soon.",
      });
    } catch (error: any) {
      console.error("Error requesting verification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification request",
        variant: "destructive",
      });
    } finally {
      setIsRequestingVerification(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {garage?.name || garageOwner?.business_name || "Garage"} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {garageOwner?.business_name || "Garage Owner"}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* Quick Stats - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
            onClick={() => {
              setSelectedStat("rating");
              setStatDialogOpen(true);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Rating</p>
                  <p className="text-2xl font-bold text-foreground">{garage?.rating || "5.0"}</p>
                </div>
                <Star className="w-8 h-8 text-primary fill-primary" />
              </div>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> Click for details
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
            onClick={() => {
              setSelectedStat("reviews");
              setStatDialogOpen(true);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-2xl font-bold text-foreground">{garage?.review_count || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-accent" />
              </div>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> Click for details
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
            onClick={() => {
              setSelectedStat("views");
              setStatDialogOpen(true);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                  <p className="text-2xl font-bold text-foreground">1,234</p>
                </div>
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> Click for details
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
            onClick={() => {
              setSelectedStat("inquiries");
              setStatDialogOpen(true);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inquiries</p>
                  <p className="text-2xl font-bold text-foreground">42</p>
                </div>
                <Users className="w-8 h-8 text-accent" />
              </div>
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Click for details
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stat Detail Dialog */}
        <StatDetailDialog
          open={statDialogOpen}
          onOpenChange={setStatDialogOpen}
          statType={selectedStat}
          garageName={garage?.name || ""}
          currentValue={
            selectedStat === "rating" ? (garage?.rating || "5.0") :
            selectedStat === "reviews" ? (garage?.review_count || 0) :
            selectedStat === "views" ? "1,234" : "42"
          }
        />

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 max-w-5xl">
            <TabsTrigger value="profile" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <BadgeCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger 
              value="boost" 
              className="gap-2 relative bg-gradient-to-r from-primary/20 to-accent/20 data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground border border-primary/30 animate-pulse hover:animate-none"
            >
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">Boost</span>
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-star" />
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrade</span>
            </TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <GarageLeadsSection garageId={garage?.id || ""} />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Garage Profile</CardTitle>
                <CardDescription>Update your garage information visible to customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Garage Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Garage Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_link">Google Maps Link</Label>
                    <Input
                      id="location_link"
                      value={formData.location_link}
                      onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo_url">Photo URL</Label>
                    <Input
                      id="photo_url"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="services">Services Offered (comma separated)</Label>
                  <Textarea
                    id="services"
                    value={Array.isArray(formData.services) ? formData.services.join(", ") : formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.value.split(",").map(s => s.trim()) })}
                    placeholder="Oil Change, Brake Repair, AC Service, ..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing">Pricing Information</Label>
                    <Textarea
                      id="pricing"
                      value={formData.pricing}
                      onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                      placeholder="Basic Service: ₹999, Full Service: ₹2999..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="special_offers">Special Offers</Label>
                    <Textarea
                      id="special_offers"
                      value={formData.special_offers}
                      onChange={(e) => setFormData({ ...formData, special_offers: e.target.value })}
                      placeholder="20% off on first visit..."
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="w-6 h-6 text-primary" />
                  Garage Badges & Highlights
                </CardTitle>
                <CardDescription>
                  Customize the badges that appear on your garage listing to attract more customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info Banner */}
                <div className="flex items-start gap-3 p-4 bg-accent/10 rounded-xl border border-accent/20">
                  <Info className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Some badges can be managed by you, while others require admin verification. 
                    Enable badges that accurately represent your garage to build trust with potential customers.
                  </p>
                </div>

                {/* Admin-Controlled Badges (Read Only) */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Admin-Verified Badges
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    These badges are managed by MeriGarageReviews team and cannot be changed by you.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Verified Garage - Admin Only */}
                    <div className="flex flex-col p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                            <BadgeCheck className="w-5 h-5 text-success" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">Verified Garage</h4>
                            <p className="text-sm text-muted-foreground">Admin verified authenticity</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {badgeData.is_verified ? (
                            <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">
                              ✓ Verified
                            </span>
                          ) : verificationRequest?.status === 'pending' ? (
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 text-xs font-medium rounded-full">
                              ⏳ Under Review
                            </span>
                          ) : verificationRequest?.status === 'rejected' ? (
                            <span className="px-2 py-1 bg-red-500/10 text-red-600 text-xs font-medium rounded-full">
                              ✗ Declined
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                              Not Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Request Verification Button */}
                      {!badgeData.is_verified && verificationRequest?.status !== 'pending' && garage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVerificationDialogOpen(true)}
                          className="mt-2 gap-2"
                        >
                          <BadgeCheck className="w-4 h-4" />
                          Request Verification
                        </Button>
                      )}
                      
                      {verificationRequest?.status === 'pending' && (
                        <p className="text-xs text-yellow-600 mt-2">
                          Your request is being reviewed by our team.
                        </p>
                      )}
                      
                      {verificationRequest?.status === 'rejected' && verificationRequest?.admin_notes && (
                        <p className="text-xs text-red-600 mt-2">
                          Reason: {verificationRequest.admin_notes}
                        </p>
                      )}
                    </div>

                    {/* Recommended - Admin Only */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-star/10 flex items-center justify-center">
                          <Award className="w-5 h-5 text-star" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Recommended</h4>
                          <p className="text-sm text-muted-foreground">Rating 4.5+ with 10+ reviews</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {badgeData.is_recommended ? (
                          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 text-xs font-medium rounded-full">
                            ★ Recommended
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                            Not yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    💡 Tip: Maintain a rating of 4.5+ with 10+ reviews to become Recommended automatically.
                  </p>
                </div>

                {/* Garage-Controlled Badges */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Your Badges
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    You can enable or disable these badges based on your garage's offerings.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Walk-ins Welcome */}
                    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Walk-ins Welcome</h4>
                          <p className="text-sm text-muted-foreground">Accept customers without appointment</p>
                        </div>
                      </div>
                      <Switch
                        checked={badgeData.walk_in_welcome}
                        onCheckedChange={(checked) => setBadgeData({ ...badgeData, walk_in_welcome: checked })}
                      />
                    </div>

                    {/* Discounts Available */}
                    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Percent className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Discounts Available</h4>
                          <p className="text-sm text-muted-foreground">Show you have special offers</p>
                        </div>
                      </div>
                      <Switch
                        checked={badgeData.has_discounts}
                        onCheckedChange={(checked) => setBadgeData({ ...badgeData, has_discounts: checked })}
                      />
                    </div>

                    {/* Certified Mechanics */}
                    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Certified Mechanics</h4>
                          <p className="text-sm text-muted-foreground">Your mechanics are trained & certified</p>
                        </div>
                      </div>
                      <Switch
                        checked={badgeData.is_certified}
                        onCheckedChange={(checked) => setBadgeData({ ...badgeData, is_certified: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="response_time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Average Response Time
                  </Label>
                  <Input
                    id="response_time"
                    value={badgeData.response_time}
                    onChange={(e) => setBadgeData({ ...badgeData, response_time: e.target.value })}
                    placeholder="e.g., 30-45 mins, 1-2 hours"
                  />
                  <p className="text-xs text-muted-foreground">
                    How quickly do you typically respond to quote requests?
                  </p>
                </div>

                <Button onClick={handleSaveBadges} disabled={isSavingBadges || !garage} className="w-full md:w-auto">
                  {isSavingBadges ? "Saving..." : "Save Badges"}
                </Button>

                {!garage && (
                  <p className="text-sm text-destructive">
                    Please save your garage profile first before managing badges.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Boost Tab */}
          <TabsContent value="boost">
            <BoostPanel garageId={garage?.id || null} garageName={garage?.name || garageOwner?.business_name || ''} />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <GarageReviewsSection garageName={garage?.name || ""} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Views</CardTitle>
                  <CardDescription>How many people viewed your garage profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={viewsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Trend</CardTitle>
                  <CardDescription>Your average rating over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                        <Bar dataKey="rating" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Review Insights */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Review Insights</CardTitle>
                <CardDescription>What customers mention most often</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {["Quality Service", "Fair Pricing", "Friendly Staff", "Quick Turnaround", "Genuine Parts", "Clean Facility"].map((tag) => (
                    <div key={tag} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {tag}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>Add photos of your garage to attract more customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                  <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Drag and drop photos here or click to upload</p>
                  <Button variant="outline">Upload Photos</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upgrade Tab - Software Upsell */}
          <TabsContent value="upgrade">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  Upgrade Your Garage With MeriGarage Management Software
                </CardTitle>
                <CardDescription className="text-lg">
                  Free to Start!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Wrench className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Automate Daily Operations</h4>
                      <p className="text-sm text-muted-foreground">Effortlessly manage your garage workflow</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Calendar className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Manage Bookings & Invoices</h4>
                      <p className="text-sm text-muted-foreground">Customer history in one place</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <MessageSquare className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Reduce No-Shows</h4>
                      <p className="text-sm text-muted-foreground">Automated reminders for customers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Users className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Boost Customer Loyalty</h4>
                      <p className="text-sm text-muted-foreground">Service history & follow-ups</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <BarChart3 className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Track Performance</h4>
                      <p className="text-sm text-muted-foreground">Revenue, profitability & staff metrics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Award className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Works Everywhere</h4>
                      <p className="text-sm text-muted-foreground">Beautiful across all devices</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <a 
                    href="https://merigarage.com/GarageAdmin/login.php" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="text-lg px-8 h-14 gap-2">
                      👉 Try MeriGarage Software – Free
                      <ExternalLink className="w-5 h-5" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Verification Request Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-success" />
              Request Garage Verification
            </DialogTitle>
            <DialogDescription>
              Submit a request to get your garage verified by MeriGarageReviews team. 
              Verified garages get a trust badge that increases customer confidence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">What we verify:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Business registration / GST details</li>
                <li>• Physical location exists</li>
                <li>• Contact information is valid</li>
                <li>• Owner identity confirmation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-message">Additional Information (Optional)</Label>
              <Textarea
                id="verification-message"
                placeholder="Provide any additional details that might help with verification (e.g., business registration number, years in operation, etc.)"
                value={verificationMessage}
                onChange={(e) => setVerificationMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestVerification} 
              disabled={isRequestingVerification}
              className="gap-2"
            >
              {isRequestingVerification ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
