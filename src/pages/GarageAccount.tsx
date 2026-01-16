import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  LogOut,
  ArrowRight
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export default function GarageAccount() {
  const [garageOwner, setGarageOwner] = useState<any>(null);
  const [garage, setGarage] = useState<any>(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has an approved claim (garage_id exists), show dashboard access
  const hasApprovedClaim = garageOwner?.garage_id && garage;

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

          {/* Dashboard Access Card (if approved) */}
          {hasApprovedClaim && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Dashboard Access Granted
                    </CardTitle>
                    <CardDescription className="text-green-600">
                      Your garage claim has been approved! You can now manage your garage.
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
                  <Button onClick={() => navigate("/garage-dashboard")} className="gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Approved Claim - Show Instructions */}
          {!hasApprovedClaim && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Claim Your Garage to Access Dashboard
                </CardTitle>
                <CardDescription>
                  To manage your garage on MeriGarage, you need to claim ownership of your garage listing. 
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
                    onClick={() => navigate("/list-garage")}
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

          {/* Claim Requests */}
          {claimRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Claim Requests</h2>
              <div className="space-y-3">
                {claimRequests.map((claim) => (
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
                <li>Search for your garage or list a new one on MeriGarage</li>
                <li>Click "Claim This Garage" on your garage's listing page</li>
                <li>Upload proof of ownership (GST certificate, business card, etc.)</li>
                <li>Our team will verify and approve your claim within 24-48 hours</li>
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
