import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Building2, IndianRupee, TrendingUp, Clock, CheckCircle, XCircle,
  LogOut, Home, Plus, Wallet, Eye, FileText, AlertTriangle,
  RefreshCw, ChevronRight, Users, Award
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Partner {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  email: string | null;
  kyc_status: string | null;
  bank_verified: boolean | null;
  status: string | null;
  created_at: string | null;
  pan_number: string | null;
  aadhaar_number: string | null;
}

interface PartnerListing {
  id: string;
  gin: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  status: string | null;
  rejection_reason: string | null;
  base_earning: number | null;
  reputation_upsell: boolean | null;
  reputation_earning: number | null;
  gms_upsell: boolean | null;
  gms_earning: number | null;
  total_earning: number | null;
  payout_status: string | null;
  garages?: { name: string; city: string | null } | null;
}

interface Payout {
  id: string;
  payout_date: string;
  amount: number;
  data_collection_count: number | null;
  reputation_sales_count: number | null;
  gms_sales_count: number | null;
  transaction_id: string | null;
  status: string | null;
  created_at: string | null;
}

type StatDialogType = "earnings" | "listings" | "pending" | "paid" | null;

export default function PartnerDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [listings, setListings] = useState<PartnerListing[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statDialog, setStatDialog] = useState<StatDialogType>(null);
  const [selectedListing, setSelectedListing] = useState<PartnerListing | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/partner-login");
      return;
    }

    if (user) {
      checkPartnerAndFetchData();
    }
  }, [user, authLoading, navigate]);

  const checkPartnerAndFetchData = async () => {
    if (!user) return;

    try {
      // Check if user has partner role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner")
        .maybeSingle();

      if (!roleData) {
        navigate("/partner-login");
        return;
      }

      // Get partner profile
      const { data: partnerData, error: partnerError } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (partnerError) throw partnerError;

      if (!partnerData) {
        // Partner role exists but no partner profile - edge case
        console.log("Partner role exists but no profile found");
        setIsLoading(false);
        return;
      }

      setPartner(partnerData);

      // Fetch partner listings
      const { data: listingsData, error: listingsError } = await supabase
        .from("partner_listings")
        .select(`
          *,
          garages:listing_id (name, city)
        `)
        .eq("partner_id", partnerData.id)
        .order("submitted_at", { ascending: false });

      if (listingsError) throw listingsError;
      setListings(listingsData || []);

      // Fetch payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from("payouts")
        .select("*")
        .eq("partner_id", partnerData.id)
        .order("payout_date", { ascending: false });

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

    } catch (error) {
      console.error("Error fetching partner data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Partner Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Your partner account is being set up. Please contact admin.
          </p>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </main>
      </div>
    );
  }

  // Calculate stats
  const totalEarnings = listings.reduce((sum, l) => sum + (l.total_earning || 0), 0);
  const paidEarnings = payouts.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const pendingEarnings = totalEarnings - paidEarnings;
  const approvedListings = listings.filter(l => l.status === "approved").length;
  const pendingListings = listings.filter(l => l.status === "pending").length;
  const rejectedListings = listings.filter(l => l.status === "rejected").length;

  // KYC progress
  const kycProgress = partner.kyc_status === "verified" ? 100 
    : partner.kyc_status === "submitted" ? 75 
    : partner.pan_number || partner.aadhaar_number ? 50 : 25;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      case "under_review":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Under Review</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getPayoutStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Paid</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Processing</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getStatDialogContent = () => {
    switch (statDialog) {
      case "earnings":
        return {
          title: "Total Earnings",
          description: "Your complete earnings breakdown",
          content: (
            <div className="space-y-6">
              <div className="text-center p-6 bg-emerald-500/10 rounded-lg">
                <IndianRupee className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
                <p className="text-4xl font-bold text-emerald-600">₹{totalEarnings.toFixed(2)}</p>
                <p className="text-muted-foreground">Total Earnings</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Data Collection</span>
                  <span className="font-semibold">₹{listings.reduce((s, l) => s + (l.base_earning || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Reputation Upsells</span>
                  <span className="font-semibold">₹{listings.reduce((s, l) => s + (l.reputation_earning || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>GMS Software Sales</span>
                  <span className="font-semibold">₹{listings.reduce((s, l) => s + (l.gms_earning || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        };
      case "listings":
        return {
          title: "Total Listings",
          description: "Garages you've submitted",
          content: (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{approvedListings}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{pendingListings}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{rejectedListings}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Earning Potential</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Data Collection: ₹20 per approved listing</p>
                  <p>• Reputation Upsell: Up to ₹500 per sale</p>
                  <p>• GMS Software Sale: Up to ₹2,000 per sale</p>
                </div>
              </div>
              <Link to="/list-garage">
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4" /> Add New Listing
                </Button>
              </Link>
            </div>
          )
        };
      case "pending":
        return {
          title: "Pending Payout",
          description: "Earnings awaiting payout",
          content: (
            <div className="space-y-6">
              <div className="text-center p-6 bg-orange-500/10 rounded-lg">
                <Clock className="w-12 h-12 mx-auto mb-2 text-orange-600" />
                <p className="text-4xl font-bold text-orange-600">₹{pendingEarnings.toFixed(2)}</p>
                <p className="text-muted-foreground">Awaiting Payout</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Payout Information</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Payouts are processed weekly</li>
                  <li>• Minimum payout threshold: ₹100</li>
                  <li>• Bank details must be verified</li>
                  <li>• KYC must be completed</li>
                </ul>
              </div>
              {!partner.bank_verified && (
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-sm text-yellow-700">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Complete bank verification to receive payouts
                </div>
              )}
            </div>
          )
        };
      case "paid":
        return {
          title: "Total Paid",
          description: "Earnings already paid out",
          content: (
            <div className="space-y-6">
              <div className="text-center p-6 bg-green-500/10 rounded-lg">
                <Wallet className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="text-4xl font-bold text-green-600">₹{paidEarnings.toFixed(2)}</p>
                <p className="text-muted-foreground">Total Received</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Recent Payouts</h4>
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payouts yet</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {payouts.filter(p => p.status === "completed").slice(0, 5).map(payout => (
                      <div key={payout.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">₹{payout.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payout.payout_date), "dd MMM yyyy")}
                          </p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600">Completed</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        };
      default:
        return null;
    }
  };

  const dialogContent = getStatDialogContent();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                Partner ID: {partner.id}
              </Badge>
              {partner.kyc_status === "verified" && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> KYC Verified
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {partner.full_name}!
            </h1>
            <p className="text-muted-foreground mt-1">Track your listings, earnings, and payouts</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Link to="/list-garage">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
                Add Listing
              </Button>
            </Link>
            <Link to="/partner-profile">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KYC Alert if not verified */}
        {partner.kyc_status !== "verified" && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">Complete Your KYC</h3>
                  <p className="text-sm text-yellow-700">
                    Submit your PAN and Aadhaar details to unlock full earning potential and payouts.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-700">KYC Progress</p>
                  <Progress value={kycProgress} className="w-24 h-2 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview - Clickable Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setStatDialog("earnings")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <IndianRupee className="w-8 h-8 mb-2 opacity-80" />
                <p className="text-white/80 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold">₹{totalEarnings.toFixed(0)}</p>
                <p className="text-white/60 text-xs mt-1">Click for breakdown</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setStatDialog("listings")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Building2 className="w-8 h-8 mb-2 text-emerald-600" />
                <p className="text-muted-foreground text-sm">Total Listings</p>
                <p className="text-3xl font-bold text-foreground">{listings.length}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">{approvedListings} approved</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setStatDialog("pending")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Clock className="w-8 h-8 mb-2 text-orange-500" />
                <p className="text-muted-foreground text-sm">Pending Payout</p>
                <p className="text-3xl font-bold text-foreground">₹{pendingEarnings.toFixed(0)}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Awaiting transfer</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setStatDialog("paid")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Wallet className="w-8 h-8 mb-2 text-green-500" />
                <p className="text-muted-foreground text-sm">Total Paid</p>
                <p className="text-3xl font-bold text-foreground">₹{paidEarnings.toFixed(0)}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">{payouts.filter(p => p.status === "completed").length} payouts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stat Detail Dialog */}
        <Dialog open={statDialog !== null} onOpenChange={(open) => !open && setStatDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogContent?.title}</DialogTitle>
              <DialogDescription>{dialogContent?.description}</DialogDescription>
            </DialogHeader>
            {dialogContent?.content}
          </DialogContent>
        </Dialog>

        {/* Tabs for Listings and Payouts */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="listings">My Listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="payouts">Payout History ({payouts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {listings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">Start adding garages to earn money!</p>
                  <Link to="/list-garage">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Garage Listings</span>
                    <Link to="/list-garage">
                      <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4" /> Add New
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>GIN</TableHead>
                          <TableHead>Garage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Upsells</TableHead>
                          <TableHead>Earnings</TableHead>
                          <TableHead>Payout</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((listing) => (
                          <TableRow key={listing.id}>
                            <TableCell className="font-mono text-sm">{listing.gin || "-"}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{listing.garages?.name || "Processing..."}</p>
                                <p className="text-xs text-muted-foreground">{listing.garages?.city || "-"}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(listing.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {listing.reputation_upsell && (
                                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">Rep</Badge>
                                )}
                                {listing.gms_upsell && (
                                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">GMS</Badge>
                                )}
                                {!listing.reputation_upsell && !listing.gms_upsell && (
                                  <span className="text-muted-foreground text-xs">Base only</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-emerald-600">
                              ₹{(listing.total_earning || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>{getPayoutStatusBadge(listing.payout_status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {listing.submitted_at 
                                ? format(new Date(listing.submitted_at), "dd MMM yyyy") 
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            {payouts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {pendingEarnings > 0 
                      ? `You have ₹${pendingEarnings.toFixed(2)} pending. Payouts are processed weekly.`
                      : "Start adding listings to earn money!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>All your past payouts and transaction details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Breakdown</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">
                              {format(new Date(payout.payout_date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="font-bold text-emerald-600">
                              ₹{payout.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payout.transaction_id || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  payout.status === "completed" 
                                    ? "bg-green-500/10 text-green-600" 
                                    : payout.status === "failed"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }
                              >
                                {payout.status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              DC: {payout.data_collection_count || 0} | 
                              Rep: {payout.reputation_sales_count || 0} | 
                              GMS: {payout.gms_sales_count || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Tips to Maximize Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Quality Listings
                </h4>
                <p className="text-sm text-muted-foreground">
                  Submit complete and accurate garage information for faster approvals.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Reputation Upsells
                </h4>
                <p className="text-sm text-muted-foreground">
                  Pitch reputation management services to earn up to ₹500 per sale.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  GMS Software
                </h4>
                <p className="text-sm text-muted-foreground">
                  Recommend our Garage Management Software for up to ₹2,000 per sale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
