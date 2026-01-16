import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Building2, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  LogOut,
  ArrowRight,
  MapPin,
  Phone,
  Star
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import defaultGaragePlaceholder from "@/assets/default-garage-placeholder.png";

interface ClaimRequest {
  id: string;
  garage_id: string;
  status: string;
  created_at: string;
  garage?: {
    id: string;
    name: string;
    slug: string | null;
    city: string | null;
    state: string | null;
  };
}

interface GarageOwner {
  id: string;
  user_id: string;
  garage_id: string | null;
  business_name: string | null;
  contact_phone: string | null;
  subscription_active: boolean;
  subscription_date: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface SubmittedGarage {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  photo_url: string | null;
  phone: string | null;
  rating: number | null;
  owner_id: string | null;
}

export default function GarageAccount() {
  const [garageOwner, setGarageOwner] = useState<GarageOwner | null>(null);
  const [garage, setGarage] = useState<any>(null);
  const [submittedGarages, setSubmittedGarages] = useState<SubmittedGarage[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Check if owner has an approved claim (has garage_id)
      if (owner.garage_id) {
        const { data: garageData } = await supabase
          .from("garages")
          .select("*")
          .eq("id", owner.garage_id)
          .single();

        if (garageData) {
          setGarage(garageData);
        }
      }

      // Fetch garages submitted by this user (as owner)
      const { data: userGarages } = await supabase
        .from("garages")
        .select("id, name, slug, city, state, photo_url, phone, rating, owner_id")
        .eq("submitted_by", session.user.id)
        .eq("listing_type", "owner")
        .order("created_at", { ascending: false });

      setSubmittedGarages(userGarages || []);

      // Fetch all claim requests for this user
      const { data: claims } = await supabase
        .from("garage_claim_requests")
        .select(`
          id,
          garage_id,
          status,
          created_at,
          garage:garages(id, name, slug, city, state)
        `)
        .eq("claimant_user_id", session.user.id)
        .order("created_at", { ascending: false });

      setClaimRequests((claims as ClaimRequest[]) || []);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/garage-auth");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if a garage has a pending claim from this user
  const getClaimStatusForGarage = (garageId: string) => {
    return claimRequests.find(claim => claim.garage_id === garageId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has an approved claim (garage_id exists) and subscription is active
  const hasApprovedClaim = garageOwner?.garage_id && garage;
  const hasActiveSubscription = garageOwner?.subscription_active === true;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Garage Owner Account</h1>
                <p className="text-muted-foreground">
                  {garageOwner?.business_name || "Welcome!"}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Dashboard Access Card (if approved and subscription active) */}
          {hasApprovedClaim && hasActiveSubscription && (() => {
            const isExpired = garageOwner?.subscription_end_date && new Date(garageOwner.subscription_end_date) < new Date();
            const daysRemaining = garageOwner?.subscription_end_date 
              ? Math.ceil((new Date(garageOwner.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
            
            return (
              <Card className={cn(
                "border-green-500/30 bg-green-500/5",
                isExpiringSoon && "border-amber-500/30 bg-amber-500/5"
              )}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={cn(
                        "flex items-center gap-2",
                        isExpiringSoon ? "text-amber-700" : "text-green-700"
                      )}>
                        <CheckCircle className="w-5 h-5" />
                        Dashboard Access Active
                      </CardTitle>
                      <CardDescription className={isExpiringSoon ? "text-amber-600" : "text-green-600"}>
                        {isExpiringSoon 
                          ? `Your subscription expires in ${daysRemaining} days. Renew soon!`
                          : "Your subscription is active! You can access and manage your garage dashboard."}
                      </CardDescription>
                    </div>
                    {garageOwner?.subscription_end_date && (
                      <Badge variant={isExpiringSoon ? "outline" : "default"} className={cn(
                        isExpiringSoon ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-green-500/10 text-green-600 border-green-500/30"
                      )}>
                        {daysRemaining} days left
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{garage.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[garage.city, garage.state].filter(Boolean).join(", ")}
                      </p>
                      {garageOwner?.subscription_end_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Subscription valid until: {new Date(garageOwner.subscription_end_date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => navigate("/garage-dashboard")} className="gap-2">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Claim Approved but Subscription Pending Card */}
          {hasApprovedClaim && !hasActiveSubscription && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-amber-700 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Subscription Pending
                    </CardTitle>
                    <CardDescription className="text-amber-600">
                      Your claim is approved! Dashboard access will be enabled once your subscription is activated.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{garage.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[garage.city, garage.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Awaiting Payment
                  </Badge>
                </div>
                <p className="text-xs text-amber-600 mt-4 bg-amber-500/10 p-3 rounded-lg">
                  Please complete your subscription payment. Our team will contact you shortly.
                  Call <strong>+91 93107 45153</strong> for immediate assistance.
                </p>
              </CardContent>
            </Card>
          )}

          {/* User's Submitted Garages (Show only if not yet approved) */}
          {!hasApprovedClaim && submittedGarages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Garage Listings</h2>
              <div className="space-y-3">
                {submittedGarages.map((g) => {
                  const claimStatus = getClaimStatusForGarage(g.id);
                  const isClaimPending = claimStatus?.status === "pending";
                  const isClaimApproved = claimStatus?.status === "approved";
                  
                  return (
                    <Card key={g.id} className={isClaimApproved ? "border-green-500/30" : ""}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <img 
                            src={g.photo_url || defaultGaragePlaceholder}
                            alt={g.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <Link 
                                  to={`/garage/${g.slug}`}
                                  className="font-semibold text-lg hover:text-primary transition-colors"
                                >
                                  {g.name}
                                </Link>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {[g.city, g.state].filter(Boolean).join(", ") || "Location not set"}
                                </div>
                                {g.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5" />
                                    {g.phone}
                                  </div>
                                )}
                                {g.rating && (
                                  <div className="flex items-center gap-1 text-sm mt-1">
                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                    <span>{g.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {claimStatus && getStatusBadge(claimStatus.status)}
                                {!claimStatus && !g.owner_id && (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Needs Claim
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/garage/${g.slug}`)}
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                View Listing
                              </Button>
                              {!claimStatus && !g.owner_id && (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => navigate(`/garage/${g.slug}`)}
                                >
                                  Claim to Get Dashboard
                                </Button>
                              )}
                            </div>
                            
                            {isClaimPending && (
                              <p className="text-xs text-yellow-600 mt-2 bg-yellow-500/10 p-2 rounded">
                                Your claim is being reviewed. You'll get dashboard access once approved.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Approved Claim and No Submitted Garages - Show Instructions */}
          {!hasApprovedClaim && submittedGarages.length === 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  List Your Garage to Get Started
                </CardTitle>
                <CardDescription>
                  To manage your garage on MeriGarage, first list your garage, then claim ownership. 
                  Our team will verify your ownership and grant you dashboard access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button 
                    variant="default" 
                    className="h-auto py-4 px-6 justify-start"
                    onClick={() => navigate("/search")}
                  >
                    <Search className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">Find Your Garage</p>
                      <p className="text-xs opacity-80">Search and claim existing listing</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 px-6 justify-start"
                    onClick={() => navigate("/list-garage", { 
                      state: { 
                        prefill: {
                          businessName: garageOwner?.business_name || "",
                          phone: garageOwner?.contact_phone || ""
                        }
                      }
                    })}
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">List New Garage</p>
                      <p className="text-xs text-muted-foreground">Add your garage to MeriGarage</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Claim Requests (for garages they didn't submit) */}
          {claimRequests.filter(c => !submittedGarages.some(g => g.id === c.garage_id)).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Other Claim Requests</h2>
              <div className="space-y-3">
                {claimRequests
                  .filter(c => !submittedGarages.some(g => g.id === c.garage_id))
                  .map((claim) => (
                  <Card key={claim.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Building2 className="w-10 h-10 text-muted-foreground p-2 bg-muted rounded-lg" />
                          <div>
                            <p className="font-medium">{claim.garage?.name || "Unknown Garage"}</p>
                            <p className="text-sm text-muted-foreground">
                              {[claim.garage?.city, claim.garage?.state].filter(Boolean).join(", ")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Submitted: {new Date(claim.created_at).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(claim.status)}
                          {claim.garage?.slug && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/garage/${claim.garage?.slug}`)}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {claim.status === "pending" && (
                        <p className="text-xs text-yellow-600 mt-3 bg-yellow-500/10 p-2 rounded">
                          Your claim is being reviewed by our team. We'll notify you once it's processed.
                        </p>
                      )}
                      {claim.status === "rejected" && (
                        <p className="text-xs text-red-600 mt-3 bg-red-500/10 p-2 rounded">
                          Your claim was not approved. Please contact support for more information.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <Card className="bg-muted/50">
            <CardContent className="py-6">
              <h3 className="font-medium mb-2">How it works:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>List your garage on MeriGarage (your listing goes live immediately)</li>
                <li>Click "Claim This Garage" on your garage's listing page</li>
                <li>Upload proof of ownership (GST certificate, business card, etc.)</li>
                <li>Our team will verify and call you to complete subscription</li>
                <li>Once approved, you'll get full access to your Garage Dashboard</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
