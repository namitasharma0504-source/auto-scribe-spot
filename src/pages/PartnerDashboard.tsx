import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Building2, IndianRupee, TrendingUp, Clock, CheckCircle, XCircle,
  LogOut, Home, Plus, Wallet, Eye, FileText, AlertTriangle,
  RefreshCw, ChevronRight, Users, Award, Play, Star, Laptop,
  Database, Calendar as CalendarIcon, MessageSquare, Flag, Search, X
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { StartTaskModal } from "@/components/partner/StartTaskModal";
import { UpsellModal } from "@/components/partner/UpsellModal";
import { EarningsCalendar } from "@/components/partner/EarningsCalendar";
import { DisputeModal } from "@/components/partner/DisputeModal";
import { PartnerFeedbackModal } from "@/components/partner/PartnerFeedbackModal";
import { MyListingsSection } from "@/components/partner/MyListingsSection";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  reputation_payment_id: string | null;
  gms_upsell: boolean | null;
  gms_earning: number | null;
  gms_payment_id: string | null;
  total_earning: number | null;
  payout_status: string | null;
  garages?: { name: string; city: string | null } | null;
}

interface Payout {
  id: string;
  payout_date: string;
  amount: number;
  data_collection_count: number | null;
  data_collection_earnings: number | null;
  reputation_sales_count: number | null;
  reputation_earnings: number | null;
  gms_sales_count: number | null;
  gms_earnings: number | null;
  transaction_id: string | null;
  status: string | null;
  created_at: string | null;
}

interface Dispute {
  id: string;
  gin: string | null;
  reason: string;
  status: string | null;
  admin_response: string | null;
  outcome: string | null;
  created_at: string | null;
}

type StatDialogType = "earnings" | "listings" | "pending" | "paid" | "day" | null;

interface DayEarning {
  date: string;
  dataCollection: number;
  reputationSales: number;
  gmsSales: number;
  listingsCount: number;
  reputationCount: number;
  gmsCount: number;
  isPaid: boolean;
}

export default function PartnerDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [listings, setListings] = useState<PartnerListing[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statDialog, setStatDialog] = useState<StatDialogType>(null);
  const [selectedListing, setSelectedListing] = useState<PartnerListing | null>(null);
  
  // Modal states
  const [showStartTask, setShowStartTask] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{ date: Date; earning: DayEarning | undefined } | null>(null);
  const [activeTasks, setActiveTasks] = useState<string[]>([]);
  
  // Listings filter states
  const [listingSearch, setListingSearch] = useState("");
  const [listingDateFrom, setListingDateFrom] = useState<Date | undefined>(undefined);
  const [listingDateTo, setListingDateTo] = useState<Date | undefined>(undefined);

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

      // Fetch disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select("*")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });

      if (disputesError) throw disputesError;
      setDisputes(disputesData || []);

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

  const handleStartTask = (selectedTasks: string[]) => {
    setActiveTasks(selectedTasks);
    // Navigate to list garage page
    navigate("/list-garage", { state: { partnerTasks: selectedTasks } });
  };

  const handleUpsellConfirm = async (
    listingId: string,
    reputationSold: boolean,
    gmsSold: boolean,
    paymentIds: { reputation?: string; gms?: string },
    paymentProofUrl?: string
  ) => {
    try {
      const updates: Record<string, any> = {
        // Set status to pending verification when upsell is submitted
        status: 'under_review'
      };
      
      if (reputationSold) {
        updates.reputation_upsell = true;
        updates.reputation_earning = 450;
        updates.reputation_payment_id = paymentIds.reputation;
      }
      
      if (gmsSold) {
        updates.gms_upsell = true;
        updates.gms_earning = 1800;
        updates.gms_payment_id = paymentIds.gms;
      }

      // Store payment proof URL in dedicated column
      if (paymentProofUrl) {
        updates.payment_proof_url = paymentProofUrl;
      }
      
      // Calculate new total
      const listing = listings.find(l => l.id === listingId);
      if (listing) {
        const baseEarning = listing.base_earning || 0;
        const repEarning = reputationSold ? 450 : (listing.reputation_earning || 0);
        const gmsEarning = gmsSold ? 1800 : (listing.gms_earning || 0);
        updates.total_earning = baseEarning + repEarning + gmsEarning;
      }

      const { error } = await supabase
        .from("partner_listings")
        .update(updates)
        .eq("id", listingId);

      if (error) throw error;

      toast.success("Upsell submitted for verification! You'll earn commission once admin approves the payment.");
      checkPartnerAndFetchData();
    } catch (error: any) {
      console.error("Error recording upsell:", error);
      toast.error(error.message || "Failed to record upsell");
    }
  };

  // Calculate daily earnings for calendar
  const dailyEarnings = useMemo((): DayEarning[] => {
    const earningsMap = new Map<string, DayEarning>();

    listings.forEach((listing) => {
      if (!listing.approved_at) return;
      const dateKey = format(new Date(listing.approved_at), "yyyy-MM-dd");
      
      const existing = earningsMap.get(dateKey) || {
        date: dateKey,
        dataCollection: 0,
        reputationSales: 0,
        gmsSales: 0,
        listingsCount: 0,
        reputationCount: 0,
        gmsCount: 0,
        isPaid: false,
      };

      existing.dataCollection += listing.base_earning || 0;
      existing.listingsCount += 1;

      if (listing.reputation_upsell) {
        existing.reputationSales += listing.reputation_earning || 0;
        existing.reputationCount += 1;
      }

      if (listing.gms_upsell) {
        existing.gmsSales += listing.gms_earning || 0;
        existing.gmsCount += 1;
      }

      existing.isPaid = listing.payout_status === "paid";
      earningsMap.set(dateKey, existing);
    });

    return Array.from(earningsMap.values());
  }, [listings]);

  // Filter listings based on search and date range
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Search filter - check GIN, garage name, city
      const searchLower = listingSearch.toLowerCase();
      const matchesSearch = !listingSearch || 
        listing.gin?.toLowerCase().includes(searchLower) ||
        listing.garages?.name?.toLowerCase().includes(searchLower) ||
        listing.garages?.city?.toLowerCase().includes(searchLower);

      // Date range filter
      const submittedDate = listing.submitted_at ? new Date(listing.submitted_at) : null;
      const matchesDateFrom = !listingDateFrom || (submittedDate && submittedDate >= listingDateFrom);
      const matchesDateTo = !listingDateTo || (submittedDate && submittedDate <= new Date(listingDateTo.getTime() + 24 * 60 * 60 * 1000 - 1));

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [listings, listingSearch, listingDateFrom, listingDateTo]);

  const clearListingFilters = () => {
    setListingSearch("");
    setListingDateFrom(undefined);
    setListingDateTo(undefined);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
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

  // Today's stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayListings = listings.filter(l => l.submitted_at && format(new Date(l.submitted_at), "yyyy-MM-dd") === today);
  const todayEarning = todayListings.reduce((sum, l) => sum + (l.total_earning || 0), 0);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-purple-600 border-purple-400 bg-purple-50">
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
            <p className="text-muted-foreground mt-1">Earn money by listing garages and selling services</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
            <Button 
              onClick={() => setShowStartTask(true)}
              className="gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
            >
              <Play className="w-4 h-4" />
              Start Task
            </Button>
            <Link to="/partner-profile">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowFeedback(true)} className="gap-2">
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KYC Status Banner */}
        {partner.kyc_status === "verified" ? (
          <Card className="mb-6 border-green-500/50 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">KYC Verified</h3>
                  <p className="text-sm text-green-700">
                    Your KYC documents have been verified. You can now receive payouts.
                  </p>
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : partner.kyc_status === "submitted" ? (
          <Card className="mb-6 border-blue-500/50 bg-blue-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800">KYC Under Review</h3>
                  <p className="text-sm text-blue-700">
                    Your KYC documents are being reviewed by our team. This usually takes 1-2 business days.
                  </p>
                </div>
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                  <Clock className="w-3 h-3 mr-1" /> Under Review
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : partner.kyc_status === "rejected" ? (
          <Card className="mb-6 border-red-500/50 bg-red-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">KYC Rejected</h3>
                  <p className="text-sm text-red-700">
                    Your KYC documents were rejected. Please update your documents and resubmit.
                  </p>
                </div>
                <Link to="/partner-profile">
                  <Button size="sm" variant="outline" className="border-red-500 text-red-700 hover:bg-red-50">
                    Update Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                <Link to="/partner-profile">
                  <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                    Complete Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Quick Stats */}
        <Card className="mb-6 bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 text-white">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-purple-100 text-sm">Today's Earnings</p>
                <p className="text-4xl font-bold">₹{todayEarning}</p>
                <p className="text-purple-100 text-sm mt-1">
                  {todayListings.length} listings submitted today
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold">{listings.length}</p>
                  <p className="text-xs text-white/80">Total Listings</p>
                </div>
                <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold">{listings.filter(l => l.reputation_upsell).length}</p>
                  <p className="text-xs text-white/80">Rep Sales</p>
                </div>
                <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold">{listings.filter(l => l.gms_upsell).length}</p>
                  <p className="text-xs text-white/80">GMS Sales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatDialog("earnings")}>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <IndianRupee className="w-8 h-8 mb-2 text-purple-500" />
                <p className="text-muted-foreground text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-foreground">₹{totalEarnings.toFixed(0)}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">All time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatDialog("listings")}>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Building2 className="w-8 h-8 mb-2 text-purple-500" />
                <p className="text-muted-foreground text-sm">Total Listings</p>
                <p className="text-3xl font-bold text-foreground">{listings.length}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">{approvedListings} approved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatDialog("pending")}>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <Clock className="w-8 h-8 mb-2 text-orange-500" />
                <p className="text-muted-foreground text-sm">Pending Payout</p>
                <p className="text-3xl font-bold text-foreground">₹{pendingEarnings.toFixed(0)}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Awaiting transfer</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatDialog("paid")}>
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

        {/* Earnings Calendar */}
        <div className="mb-8">
          <EarningsCalendar 
            earnings={dailyEarnings} 
            onDayClick={(date, earning) => {
              setSelectedDayData({ date, earning });
              setStatDialog("day");
            }}
          />
        </div>

        {/* Stat Detail Dialog */}
        <Dialog open={statDialog !== null} onOpenChange={(open) => !open && setStatDialog(null)}>
          <DialogContent className="max-w-md">
            {statDialog === "day" && selectedDayData && (
              <>
                <DialogHeader>
                  <DialogTitle>{format(selectedDayData.date, "EEEE, d MMMM yyyy")}</DialogTitle>
                  <DialogDescription>Daily earnings breakdown</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {selectedDayData.earning ? (
                    <>
                      <div className="text-center p-4 bg-purple-100 rounded-lg">
                        <p className="text-3xl font-bold text-purple-600">
                          ₹{(selectedDayData.earning.dataCollection + selectedDayData.earning.reputationSales + selectedDayData.earning.gmsSales).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Earned</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-purple-500" />
                            Data Collection ({selectedDayData.earning.listingsCount})
                          </span>
                          <span className="font-semibold">₹{selectedDayData.earning.dataCollection}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-purple-600" />
                            Reputation Sales ({selectedDayData.earning.reputationCount})
                          </span>
                          <span className="font-semibold">₹{selectedDayData.earning.reputationSales}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-blue-600" />
                            GMS Sales ({selectedDayData.earning.gmsCount})
                          </span>
                          <span className="font-semibold">₹{selectedDayData.earning.gmsSales}</span>
                        </div>
                      </div>
                      {selectedDayData.earning.isPaid && (
                        <Badge className="w-full justify-center bg-green-500/10 text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" /> Paid
                        </Badge>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No earnings on this day</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {statDialog === "earnings" && (
              <>
                <DialogHeader>
                  <DialogTitle>Total Earnings</DialogTitle>
                  <DialogDescription>Your complete earnings breakdown</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg">
                    <IndianRupee className="w-12 h-12 mx-auto mb-2 text-purple-500" />
                    <p className="text-4xl font-bold text-purple-600">₹{totalEarnings.toFixed(2)}</p>
                    <p className="text-muted-foreground">Total Earnings</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Data Collection (₹20/listing)</span>
                      <span className="font-semibold">₹{listings.reduce((s, l) => s + (l.base_earning || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Reputation Sales (30% of ₹1,500)</span>
                      <span className="font-semibold">₹{listings.reduce((s, l) => s + (l.reputation_earning || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>GMS Software Sales (30% of ₹6,000)</span>
                      <span className="font-semibold">₹{listings.reduce((s, l) => s + (l.gms_earning || 0), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            {statDialog === "listings" && (
              <>
                <DialogHeader>
                  <DialogTitle>Total Listings</DialogTitle>
                  <DialogDescription>Garages you've submitted</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
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
                    <h4 className="font-semibold">Earning Structure</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Data Collection: ₹20 per approved listing</p>
                      <p>• Reputation Upsell: ₹450 per sale (30% of ₹1,500)</p>
                      <p>• GMS Software Sale: ₹1,800 per sale (30% of ₹6,000)</p>
                    </div>
                  </div>
                  <Button onClick={() => { setStatDialog(null); setShowStartTask(true); }} className="w-full gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                    <Plus className="w-4 h-4" /> Add New Listing
                  </Button>
                </div>
              </>
            )}
            {statDialog === "pending" && (
              <>
                <DialogHeader>
                  <DialogTitle>Pending Payout</DialogTitle>
                  <DialogDescription>Earnings awaiting payout</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="text-center p-6 bg-orange-500/10 rounded-lg">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-orange-600" />
                    <p className="text-4xl font-bold text-orange-600">₹{pendingEarnings.toFixed(2)}</p>
                    <p className="text-muted-foreground">Awaiting Payout</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm">
                    <h4 className="font-semibold mb-2">Payout Information</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Payouts are processed daily</li>
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
              </>
            )}
            {statDialog === "paid" && (
              <>
                <DialogHeader>
                  <DialogTitle>Total Paid</DialogTitle>
                  <DialogDescription>Earnings already paid out</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
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
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Tabs for Listings, Payouts, Disputes */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="payouts">Payouts ({payouts.length})</TabsTrigger>
            <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {listings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">Start adding garages to earn money!</p>
                  <Button onClick={() => setShowStartTask(true)} className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                    <Play className="w-4 h-4 mr-2" /> Start Your First Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle>Your Garage Listings</CardTitle>
                    <Button onClick={() => setShowStartTask(true)} size="sm" className="gap-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 w-fit">
                      <Plus className="w-4 h-4" /> Add New
                    </Button>
                  </div>
                  
                  {/* Search and Date Filters */}
                  <div className="flex flex-col md:flex-row gap-3 mt-4">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by GIN, garage name, or city..."
                        value={listingSearch}
                        onChange={(e) => setListingSearch(e.target.value)}
                        className="pl-9 pr-9"
                      />
                      {listingSearch && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                          onClick={() => setListingSearch("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Date From */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full md:w-[140px] justify-start text-left font-normal",
                            !listingDateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {listingDateFrom ? format(listingDateFrom, "dd MMM yy") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={listingDateFrom}
                          onSelect={setListingDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {/* Date To */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full md:w-[140px] justify-start text-left font-normal",
                            !listingDateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {listingDateTo ? format(listingDateTo, "dd MMM yy") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={listingDateTo}
                          onSelect={setListingDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {/* Clear Filters */}
                    {(listingSearch || listingDateFrom || listingDateTo) && (
                      <Button variant="ghost" size="sm" onClick={clearListingFilters} className="gap-1">
                        <X className="w-3 h-3" /> Clear
                      </Button>
                    )}
                  </div>
                  
                  {/* Filter Summary */}
                  {(listingSearch || listingDateFrom || listingDateTo) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing {filteredListings.length} of {listings.length} listings
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {filteredListings.length === 0 ? (
                    <div className="py-8 text-center">
                      <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No listings match your filters</p>
                      <Button variant="link" onClick={clearListingFilters} className="mt-2">
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>GIN</TableHead>
                          <TableHead>Garage</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Earnings</TableHead>
                          <TableHead>Payout</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredListings.map((listing) => {
                          // Determine category based on upsells
                          const getCategory = () => {
                            const categories = [];
                            categories.push({ type: 'Data Collection', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' });
                            if (listing.reputation_upsell) {
                              categories.push({ type: 'Reputation', color: 'bg-violet-500/10 text-violet-600 border-violet-500/30' });
                            }
                            if (listing.gms_upsell) {
                              categories.push({ type: 'GMS Software', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' });
                            }
                            return categories;
                          };

                          const categories = getCategory();
                          const canUpsell = listing.status === "approved" && (!listing.reputation_upsell || !listing.gms_upsell);

                          return (
                            <TableRow key={listing.id}>
                              <TableCell className="font-mono text-sm">{listing.gin || "-"}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{listing.garages?.name || "Processing..."}</p>
                                  <p className="text-xs text-muted-foreground">{listing.garages?.city || "-"}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {listing.submitted_at ? (
                                    <>
                                      <p className="font-medium">{format(new Date(listing.submitted_at), "dd MMM yyyy")}</p>
                                      <p className="text-xs text-muted-foreground">{format(new Date(listing.submitted_at), "hh:mm a")}</p>
                                    </>
                                  ) : "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {categories.map((cat, idx) => (
                                    <Badge key={idx} variant="outline" className={`text-xs ${cat.color}`}>
                                      {cat.type}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(listing.status)}</TableCell>
                              <TableCell className="font-medium text-purple-600">
                                ₹{(listing.total_earning || 0).toFixed(0)}
                              </TableCell>
                              <TableCell>{getPayoutStatusBadge(listing.payout_status)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {listing.status === "rejected" && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-orange-600 hover:text-orange-700 h-7 px-2"
                                      onClick={() => {
                                        setSelectedListing(listing);
                                        setShowDispute(true);
                                      }}
                                    >
                                      <Flag className="w-3 h-3 mr-1" />
                                      Dispute
                                    </Button>
                                  )}
                                  {canUpsell && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-purple-600 hover:text-purple-700 h-7 px-2 border-purple-300"
                                      onClick={() => {
                                        setSelectedListing(listing);
                                        setShowUpsell(true);
                                      }}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Upsell
                                    </Button>
                                  )}
                                </div>
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
                      ? `You have ₹${pendingEarnings.toFixed(2)} pending. Payouts are processed daily.`
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
                            <TableCell className="font-bold text-purple-600">
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
                              <div className="space-y-0.5">
                                <p>DC: {payout.data_collection_count || 0} (₹{payout.data_collection_earnings || 0})</p>
                                <p>Rep: {payout.reputation_sales_count || 0} (₹{payout.reputation_earnings || 0})</p>
                                <p>GMS: {payout.gms_sales_count || 0} (₹{payout.gms_earnings || 0})</p>
                              </div>
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

          <TabsContent value="disputes" className="space-y-4">
            {disputes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No disputes</h3>
                  <p className="text-muted-foreground">
                    You can dispute rejected listings if you believe they should be approved.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Your Disputes</CardTitle>
                  <CardDescription>Track the status of your disputed listings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>GIN</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Admin Response</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputes.map((dispute) => (
                          <TableRow key={dispute.id}>
                            <TableCell className="font-mono text-sm">{dispute.gin || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{dispute.reason}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  dispute.status === "resolved" 
                                    ? "bg-green-500/10 text-green-600" 
                                    : dispute.status === "rejected"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }
                              >
                                {dispute.status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {dispute.admin_response || "-"}
                            </TableCell>
                            <TableCell>
                              {dispute.outcome ? (
                                <Badge 
                                  className={
                                    dispute.outcome === "approved" 
                                      ? "bg-green-500/10 text-green-600" 
                                      : "bg-red-500/10 text-red-600"
                                  }
                                >
                                  {dispute.outcome}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {dispute.created_at 
                                ? format(new Date(dispute.created_at), "dd MMM yyyy") 
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
        </Tabs>

        {/* Quick Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              Tips to Maximize Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  Data Collection (₹20)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Collect visiting cards, upload photos & location. Get ₹20 per approved listing.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-600" />
                  Reputation Sales (₹450)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Pitch reputation management. ₹1,500/year subscription = ₹450 commission (30%).
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  GMS Software (₹1,800)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Demo & sell garage management software. ₹6,000/year = ₹1,800 commission (30%).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <StartTaskModal
        open={showStartTask}
        onOpenChange={setShowStartTask}
        onStartTask={handleStartTask}
      />

      {selectedListing && (
        <>
          <UpsellModal
            open={showUpsell}
            onOpenChange={setShowUpsell}
            listingId={selectedListing.id}
            garageName={selectedListing.garages?.name || "Unknown Garage"}
            garageGin={selectedListing.gin || ""}
            onUpsellConfirm={handleUpsellConfirm}
          />
          <DisputeModal
            open={showDispute}
            onOpenChange={setShowDispute}
            listingId={selectedListing.id}
            gin={selectedListing.gin || ""}
            garageName={selectedListing.garages?.name || "Unknown Garage"}
            partnerId={partner.id}
            rejectionReason={selectedListing.rejection_reason}
            onDisputeSubmitted={checkPartnerAndFetchData}
          />
        </>
      )}

      <PartnerFeedbackModal
        open={showFeedback}
        onOpenChange={setShowFeedback}
        partnerId={partner.id}
        onFeedbackSubmitted={() => toast.success("Thank you for your feedback!")}
      />
    </div>
  );
}
