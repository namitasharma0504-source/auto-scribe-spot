import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Building2,
  FileText,
  BadgeCheck,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  last_login: string | null;
  pan_number: string | null;
  pan_document: string | null;
  aadhaar_number: string | null;
  aadhaar_document: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  account_holder_name: string | null;
  profile_photo: string | null;
}

interface PartnerListing {
  id: string;
  partner_id: string;
  listing_id: string | null;
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
  partner_id: string;
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
  processed_at: string | null;
  created_at: string | null;
}

interface PartnerDetails extends Partner {
  listings: PartnerListing[];
  payouts: Payout[];
  total_earnings: number;
  pending_payout: number;
}

export function PartnerManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutTransactionId, setPayoutTransactionId] = useState("");
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  
  // Listing approval states
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error: any) {
      console.error("Error fetching partners:", error);
      toast({
        title: "Error",
        description: "Failed to load partners",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPartnerDetails = async (partner: Partner) => {
    setIsLoadingDetails(true);
    try {
      // Fetch listings with garage info
      const { data: listings, error: listingsError } = await supabase
        .from("partner_listings")
        .select(`
          *,
          garages:listing_id (name, city)
        `)
        .eq("partner_id", partner.id)
        .order("submitted_at", { ascending: false });

      if (listingsError) throw listingsError;

      // Fetch payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from("payouts")
        .select("*")
        .eq("partner_id", partner.id)
        .order("payout_date", { ascending: false });

      if (payoutsError) throw payoutsError;

      // Calculate totals
      const totalEarnings = (listings || []).reduce((sum, l) => sum + (l.total_earning || 0), 0);
      const paidOut = (payouts || []).filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
      const pendingPayout = totalEarnings - paidOut;

      setSelectedPartner({
        ...partner,
        listings: listings || [],
        payouts: payouts || [],
        total_earnings: totalEarnings,
        pending_payout: pendingPayout > 0 ? pendingPayout : 0,
      });
      setIsDetailsOpen(true);
    } catch (error: any) {
      console.error("Error fetching partner details:", error);
      toast({
        title: "Error",
        description: "Failed to load partner details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const updateKycStatus = async (partnerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ kyc_status: newStatus })
        .eq("id", partnerId);

      if (error) throw error;

      toast({
        title: "KYC Status Updated",
        description: `Partner KYC status changed to ${newStatus}`,
      });

      fetchPartners();
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(prev => prev ? { ...prev, kyc_status: newStatus } : null);
      }
    } catch (error: any) {
      console.error("Error updating KYC status:", error);
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive",
      });
    }
  };

  const updatePartnerStatus = async (partnerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ status: newStatus })
        .eq("id", partnerId);

      if (error) throw error;

      toast({
        title: "Partner Status Updated",
        description: `Partner status changed to ${newStatus}`,
      });

      fetchPartners();
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error: any) {
      console.error("Error updating partner status:", error);
      toast({
        title: "Error",
        description: "Failed to update partner status",
        variant: "destructive",
      });
    }
  };

  const updateBankVerification = async (partnerId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ bank_verified: verified })
        .eq("id", partnerId);

      if (error) throw error;

      toast({
        title: "Bank Verification Updated",
        description: verified ? "Bank details verified" : "Bank verification removed",
      });

      fetchPartners();
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(prev => prev ? { ...prev, bank_verified: verified } : null);
      }
    } catch (error: any) {
      console.error("Error updating bank verification:", error);
      toast({
        title: "Error",
        description: "Failed to update bank verification",
        variant: "destructive",
      });
    }
  };

  const processPayout = async () => {
    if (!selectedPartner || !payoutAmount) return;
    
    setIsProcessingPayout(true);
    try {
      const { error } = await supabase
        .from("payouts")
        .insert({
          partner_id: selectedPartner.id,
          payout_date: new Date().toISOString().split('T')[0],
          amount: parseFloat(payoutAmount),
          transaction_id: payoutTransactionId || null,
          status: "completed",
          processed_at: new Date().toISOString(),
          data_collection_count: selectedPartner.listings.filter(l => l.status === "approved").length,
          data_collection_earnings: selectedPartner.listings.reduce((sum, l) => sum + (l.base_earning || 0), 0),
          reputation_sales_count: selectedPartner.listings.filter(l => l.reputation_upsell).length,
          reputation_earnings: selectedPartner.listings.reduce((sum, l) => sum + (l.reputation_earning || 0), 0),
          gms_sales_count: selectedPartner.listings.filter(l => l.gms_upsell).length,
          gms_earnings: selectedPartner.listings.reduce((sum, l) => sum + (l.gms_earning || 0), 0),
        });

      if (error) throw error;

      // Update listings payout status
      const approvedListingIds = selectedPartner.listings
        .filter(l => l.status === "approved" && l.payout_status === "pending")
        .map(l => l.id);

      if (approvedListingIds.length > 0) {
        await supabase
          .from("partner_listings")
          .update({ payout_status: "paid", payout_date: new Date().toISOString().split('T')[0] })
          .in("id", approvedListingIds);
      }

      toast({
        title: "Payout Processed",
        description: `₹${payoutAmount} paid to ${selectedPartner.full_name}`,
      });

      setIsPayoutDialogOpen(false);
      setPayoutAmount("");
      setPayoutTransactionId("");
      fetchPartnerDetails(selectedPartner);
    } catch (error: any) {
      console.error("Error processing payout:", error);
      toast({
        title: "Error",
        description: "Failed to process payout",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Approve partner listing
  const handleApproveListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("partner_listings")
        .update({ 
          status: "approved", 
          approved_at: new Date().toISOString(),
          rejection_reason: null 
        })
        .eq("id", listingId);

      if (error) throw error;

      toast({
        title: "Listing Approved",
        description: "The partner will earn ₹20 for this listing.",
      });

      // Refresh partner details
      if (selectedPartner) {
        fetchPartnerDetails(selectedPartner);
      }
    } catch (error: any) {
      console.error("Error approving listing:", error);
      toast({
        title: "Error",
        description: "Failed to approve listing",
        variant: "destructive",
      });
    }
  };

  // Reject partner listing
  const handleRejectListing = async () => {
    if (!rejectingListingId) return;
    
    try {
      const { error } = await supabase
        .from("partner_listings")
        .update({ 
          status: "rejected", 
          rejection_reason: rejectionReason || "Listing does not meet quality standards",
          base_earning: 0,
          total_earning: 0,
        })
        .eq("id", rejectingListingId);

      if (error) throw error;

      toast({
        title: "Listing Rejected",
        description: "The partner has been notified of the rejection.",
      });

      setIsRejectDialogOpen(false);
      setRejectingListingId(null);
      setRejectionReason("");

      // Refresh partner details
      if (selectedPartner) {
        fetchPartnerDetails(selectedPartner);
      }
    } catch (error: any) {
      console.error("Error rejecting listing:", error);
      toast({
        title: "Error",
        description: "Failed to reject listing",
        variant: "destructive",
      });
    }
  };

  const getKycStatusBadge = (status: string | null) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Verified</Badge>;
      case "submitted":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Submitted</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/30">Inactive</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/30">Unknown</Badge>;
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.phone.includes(searchQuery);
    
    const matchesKyc = kycFilter === "all" || partner.kyc_status === kycFilter;
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    
    return matchesSearch && matchesKyc && matchesStatus;
  });

  // Calculate stats
  const activePartners = partners.filter(p => p.status === "active").length;
  const kycVerified = partners.filter(p => p.kyc_status === "verified").length;
  const kycPending = partners.filter(p => p.kyc_status === "pending" || !p.kyc_status).length;
  const bankVerified = partners.filter(p => p.bank_verified).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, username, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchPartners} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KYC Pending Approvals Alert */}
      {partners.filter(p => p.kyc_status === "submitted").length > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800">KYC Approvals Pending</h3>
                  <p className="text-sm text-blue-700">
                    {partners.filter(p => p.kyc_status === "submitted").length} partner(s) have submitted KYC documents for verification
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-500 text-blue-700 hover:bg-blue-50"
                onClick={() => setKycFilter("submitted")}
              >
                View Pending ({partners.filter(p => p.kyc_status === "submitted").length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Partners</p>
                <p className="text-2xl font-bold">{partners.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Partners</p>
                <p className="text-2xl font-bold">{activePartners}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setKycFilter("verified")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KYC Verified</p>
                <p className="text-2xl font-bold">{kycVerified}</p>
              </div>
              <BadgeCheck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setKycFilter("submitted")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KYC Submitted</p>
                <p className="text-2xl font-bold">{partners.filter(p => p.kyc_status === "submitted").length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Partners ({filteredPartners.length})</CardTitle>
          <CardDescription>Manage partner accounts, KYC verification, and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading partners...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No partners found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-mono text-sm">{partner.id}</TableCell>
                      <TableCell className="font-medium">{partner.full_name}</TableCell>
                      <TableCell>{partner.phone}</TableCell>
                      <TableCell>{getKycStatusBadge(partner.kyc_status)}</TableCell>
                      <TableCell>
                        {partner.bank_verified ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Verified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell>
                        {partner.created_at ? new Date(partner.created_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchPartnerDetails(partner)}
                          disabled={isLoadingDetails}
                        >
                          <Eye className={`w-4 h-4 ${isLoadingDetails ? "animate-spin" : ""}`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Partner Details - {selectedPartner?.full_name}
            </DialogTitle>
            <DialogDescription>
              Partner ID: {selectedPartner?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="kyc">KYC & Bank</TabsTrigger>
                <TabsTrigger value="listings">Listings ({selectedPartner.listings.length})</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{selectedPartner.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{selectedPartner.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedPartner.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedPartner.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Select 
                      value={selectedPartner.status || "active"} 
                      onValueChange={(val) => updatePartnerStatus(selectedPartner.id, val)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-medium">
                      {selectedPartner.last_login 
                        ? new Date(selectedPartner.last_login).toLocaleString() 
                        : "Never"}
                    </p>
                  </div>
                </div>

                {/* Earnings Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 p-4 rounded-lg border bg-muted/30">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Listings</p>
                    <p className="text-2xl font-bold text-primary">{selectedPartner.listings.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-600">₹{selectedPartner.total_earnings.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pending Payout</p>
                    <p className="text-2xl font-bold text-orange-600">₹{selectedPartner.pending_payout.toFixed(2)}</p>
                  </div>
                </div>

                {selectedPartner.pending_payout > 0 && selectedPartner.bank_verified && (
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => {
                      setPayoutAmount(selectedPartner.pending_payout.toFixed(2));
                      setIsPayoutDialogOpen(true);
                    }}
                  >
                    <Wallet className="w-4 h-4" />
                    Process Payout (₹{selectedPartner.pending_payout.toFixed(2)})
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="kyc" className="space-y-6 mt-4">
                {/* KYC Section */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    KYC Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">PAN Number</p>
                      <p className="font-medium font-mono">{selectedPartner.pan_number || "Not provided"}</p>
                      {selectedPartner.pan_document && (
                        <a 
                          href={selectedPartner.pan_document} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Document
                        </a>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aadhaar Number</p>
                      <p className="font-medium font-mono">
                        {selectedPartner.aadhaar_number 
                          ? `XXXX-XXXX-${selectedPartner.aadhaar_number.slice(-4)}` 
                          : "Not provided"}
                      </p>
                      {selectedPartner.aadhaar_document && (
                        <a 
                          href={selectedPartner.aadhaar_document} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Document
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">KYC Status:</p>
                    <Select 
                      value={selectedPartner.kyc_status || "pending"} 
                      onValueChange={(val) => updateKycStatus(selectedPartner.id, val)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Bank Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{selectedPartner.bank_name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Holder</p>
                      <p className="font-medium">{selectedPartner.account_holder_name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium font-mono">
                        {selectedPartner.account_number 
                          ? `XXXXXX${selectedPartner.account_number.slice(-4)}` 
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">IFSC Code</p>
                      <p className="font-medium font-mono">{selectedPartner.ifsc_code || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">Bank Verified:</p>
                    <Button
                      size="sm"
                      variant={selectedPartner.bank_verified ? "default" : "outline"}
                      onClick={() => updateBankVerification(selectedPartner.id, !selectedPartner.bank_verified)}
                      className="gap-1"
                    >
                      {selectedPartner.bank_verified ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Not Verified
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="listings" className="mt-4">
                {/* Listing Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
                    <p className="text-lg font-bold text-yellow-600">
                      {selectedPartner.listings.filter(l => l.status === "pending" || !l.status).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 text-center">
                    <p className="text-lg font-bold text-green-600">
                      {selectedPartner.listings.filter(l => l.status === "approved").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 text-center">
                    <p className="text-lg font-bold text-red-600">
                      {selectedPartner.listings.filter(l => l.status === "rejected").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                    <p className="text-lg font-bold text-emerald-600">
                      ₹{selectedPartner.listings.reduce((sum, l) => sum + (l.total_earning || 0), 0).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                  </div>
                </div>
                
                {selectedPartner.listings.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No listings submitted yet</p>
                  </div>
                ) : (
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
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPartner.listings.map((listing) => (
                          <TableRow key={listing.id}>
                            <TableCell className="font-mono text-sm">{listing.gin || "-"}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{listing.garages?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{listing.garages?.city || "-"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  listing.status === "approved" 
                                    ? "bg-green-500/10 text-green-600" 
                                    : listing.status === "rejected"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }
                              >
                                {listing.status || "pending"}
                              </Badge>
                              {listing.rejection_reason && (
                                <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={listing.rejection_reason}>
                                  {listing.rejection_reason}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {listing.reputation_upsell && (
                                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">Rep ₹450</Badge>
                                )}
                                {listing.gms_upsell && (
                                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">GMS ₹1.8K</Badge>
                                )}
                                {!listing.reputation_upsell && !listing.gms_upsell && "-"}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              ₹{(listing.total_earning || 0).toFixed(0)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  listing.payout_status === "paid" 
                                    ? "bg-green-500/10 text-green-600" 
                                    : "bg-yellow-500/10 text-yellow-600"
                                }
                              >
                                {listing.payout_status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {listing.submitted_at 
                                ? new Date(listing.submitted_at).toLocaleDateString() 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {(listing.status === "pending" || !listing.status) && (
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                    onClick={() => handleApproveListing(listing.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                    onClick={() => {
                                      setRejectingListingId(listing.id);
                                      setIsRejectDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              {listing.status === "rejected" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                  onClick={() => handleApproveListing(listing.id)}
                                  title="Re-approve this listing"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payouts" className="mt-4">
                {selectedPartner.payouts.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payouts processed yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPartner.payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell>{new Date(payout.payout_date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium text-green-600">₹{payout.amount.toFixed(2)}</TableCell>
                            <TableCell className="font-mono text-sm">{payout.transaction_id || "-"}</TableCell>
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
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Process Payout
            </DialogTitle>
            <DialogDescription>
              Paying {selectedPartner?.full_name} ({selectedPartner?.id})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Transaction ID (Optional)</label>
              <Input
                value={payoutTransactionId}
                onChange={(e) => setPayoutTransactionId(e.target.value)}
                placeholder="e.g., UPI/IMPS reference number"
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">Bank Details:</p>
              <p className="font-medium">{selectedPartner?.bank_name}</p>
              <p className="font-mono text-xs">
                A/C: {selectedPartner?.account_number ? `XXXXXX${selectedPartner.account_number.slice(-4)}` : "-"} | 
                IFSC: {selectedPartner?.ifsc_code || "-"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processPayout} 
              disabled={isProcessingPayout || !payoutAmount}
              className="gap-2"
            >
              {isProcessingPayout ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Listing Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Reject Listing
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this listing. The partner will see this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Incomplete information, duplicate listing, invalid location..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false);
              setRejectingListingId(null);
              setRejectionReason("");
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectListing}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
