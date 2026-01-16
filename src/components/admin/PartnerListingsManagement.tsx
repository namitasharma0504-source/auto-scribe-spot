import { useState, useEffect } from "react";
import { 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  IndianRupee,
  Eye,
  Filter,
  Wallet,
  CreditCard,
  ArrowRight,
  FileText,
  Phone,
  MapPin,
  Image,
  ChevronLeft,
  ChevronRight,
  Wrench
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GaragePhoto {
  id: string;
  photo_url: string;
  display_order: number | null;
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
  payment_proof_url: string | null;
  partners?: { id: string; full_name: string; username: string } | null;
  garages?: { 
    name: string; 
    city: string | null; 
    phone: string | null;
    address: string | null;
    state: string | null;
    services: string[] | null;
    photo_url: string | null;
    location_link: string | null;
  } | null;
}

export function PartnerListingsManagement() {
  const { toast } = useToast();
  const [listings, setListings] = useState<PartnerListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payoutFilter, setPayoutFilter] = useState<string>("all");
  
  // Rejection dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Details dialog
  const [selectedListing, setSelectedListing] = useState<PartnerListing | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Photo preview states
  const [listingPhotos, setListingPhotos] = useState<GaragePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Payment proof state
  const [paymentProofSignedUrl, setPaymentProofSignedUrl] = useState<string | null>(null);
  const [isLoadingPaymentProof, setIsLoadingPaymentProof] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_listings")
        .select(`
          *,
          partners:partner_id (id, full_name, username),
          garages:listing_id (name, city, phone, address, state, services, photo_url, location_link)
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to load partner listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch photos for a listing
  const fetchListingPhotos = async (listingId: string | null) => {
    if (!listingId) {
      setListingPhotos([]);
      return;
    }
    
    setIsLoadingPhotos(true);
    setCurrentPhotoIndex(0);
    try {
      const { data, error } = await supabase
        .from("garage_photos")
        .select("id, photo_url, display_order")
        .eq("garage_id", listingId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setListingPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setListingPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Fetch payment proof signed URL
  const fetchPaymentProof = async (paymentProofPath: string | null) => {
    if (!paymentProofPath) {
      setPaymentProofSignedUrl(null);
      return;
    }
    
    setIsLoadingPaymentProof(true);
    try {
      const { data, error } = await supabase.storage
        .from('partner-documents')
        .createSignedUrl(paymentProofPath, 3600); // 1 hour expiry

      if (error) throw error;
      setPaymentProofSignedUrl(data?.signedUrl || null);
    } catch (error) {
      console.error("Error fetching payment proof:", error);
      setPaymentProofSignedUrl(null);
    } finally {
      setIsLoadingPaymentProof(false);
    }
  };

  // Open listing details with photos
  const openListingDetails = (listing: PartnerListing) => {
    setSelectedListing(listing);
    setIsDetailsOpen(true);
    fetchListingPhotos(listing.listing_id);
    fetchPaymentProof(listing.payment_proof_url);
  };

  const handleApprove = async (listingId: string, garageId: string | null) => {
    try {
      // Update partner_listings status
      const { error } = await supabase
        .from("partner_listings")
        .update({ 
          status: "approved", 
          approved_at: new Date().toISOString(),
          rejection_reason: null 
        })
        .eq("id", listingId);

      if (error) throw error;

      // Also set the garage as approved so it appears in All Garages
      if (garageId) {
        await supabase
          .from("garages")
          .update({ is_approved: true })
          .eq("id", garageId);
      }

      toast({
        title: "Listing Approved",
        description: "The garage is now live and the partner will earn ₹20.",
      });

      fetchListings();
      setIsDetailsOpen(false);
    } catch (error: any) {
      console.error("Error approving listing:", error);
      toast({
        title: "Error",
        description: "Failed to approve listing",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
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
        description: "The partner has been notified.",
      });

      setIsRejectDialogOpen(false);
      setRejectingListingId(null);
      setRejectionReason("");
      fetchListings();
    } catch (error: any) {
      console.error("Error rejecting listing:", error);
      toast({
        title: "Error",
        description: "Failed to reject listing",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePayoutStatus = async (listingId: string, newStatus: string) => {
    try {
      const updates: Record<string, any> = { payout_status: newStatus };
      
      // If marking as paid, set payout date
      if (newStatus === "paid") {
        updates.payout_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("partner_listings")
        .update(updates)
        .eq("id", listingId);

      if (error) throw error;

      toast({
        title: "Payout Updated",
        description: `Payout status changed to "${newStatus}"`,
      });

      fetchListings();
      
      // Update selectedListing if it's the same one
      if (selectedListing?.id === listingId) {
        setSelectedListing(prev => prev ? { ...prev, payout_status: newStatus } : null);
      }
    } catch (error: any) {
      console.error("Error updating payout:", error);
      toast({
        title: "Error",
        description: "Failed to update payout status",
        variant: "destructive",
      });
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      (listing.gin || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.garages?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.partners?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.partners?.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter || 
      (statusFilter === "pending" && !listing.status);
    const matchesPayout = payoutFilter === "all" || listing.payout_status === payoutFilter ||
      (payoutFilter === "pending" && !listing.payout_status);
    
    return matchesSearch && matchesStatus && matchesPayout;
  });

  // Stats
  const pendingCount = listings.filter(l => !l.status || l.status === "pending").length;
  const approvedCount = listings.filter(l => l.status === "approved").length;
  const rejectedCount = listings.filter(l => l.status === "rejected").length;
  const totalEarnings = listings.reduce((sum, l) => sum + (l.total_earning || 0), 0);
  const pendingPayout = listings.filter(l => l.status === "approved" && l.payout_status !== "paid")
    .reduce((sum, l) => sum + (l.total_earning || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-emerald-600">₹{totalEarnings}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payout</p>
                <p className="text-2xl font-bold text-orange-600">₹{pendingPayout}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by GIN, garage, partner name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={payoutFilter} onValueChange={setPayoutFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Payout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payouts</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchListings} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Listings ({filteredListings.length})</CardTitle>
          <CardDescription>Review and approve garage listings submitted by partners</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No listings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GIN</TableHead>
                    <TableHead>Garage</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upsells</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow 
                      key={listing.id} 
                      className="cursor-pointer hover:bg-purple-500/5"
                      onClick={() => openListingDetails(listing)}
                    >
                      <TableCell className="font-mono text-sm">{listing.gin || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{listing.garages?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{listing.garages?.city || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{listing.partners?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{listing.partners?.id || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            listing.status === "approved" 
                              ? "bg-green-500/10 text-green-600" 
                              : listing.status === "rejected"
                              ? "bg-red-500/10 text-red-600"
                              : listing.status === "under_review"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          }
                        >
                          {listing.status === "under_review" ? "Under Review" : (listing.status || "pending")}
                        </Badge>
                        {listing.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[120px] truncate" title={listing.rejection_reason}>
                            {listing.rejection_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {listing.reputation_upsell && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 w-fit">Rep ₹450</Badge>
                          )}
                          {listing.gms_upsell && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 w-fit">GMS ₹1.8K</Badge>
                          )}
                          {!listing.reputation_upsell && !listing.gms_upsell && (
                            <span className="text-xs text-muted-foreground">Base only</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600">
                        ₹{(listing.total_earning || 0).toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            listing.payout_status === "paid" 
                              ? "bg-green-500/10 text-green-600" 
                              : listing.payout_status === "processing"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          }
                        >
                          {listing.payout_status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {listing.submitted_at 
                          ? new Date(listing.submitted_at).toLocaleDateString() 
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => {
                              setSelectedListing(listing);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(!listing.status || listing.status === "pending" || listing.status === "under_review") && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                onClick={() => handleApprove(listing.id, listing.listing_id)}
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
                            </>
                          )}
                          {listing.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                              onClick={() => handleApprove(listing.id, listing.listing_id)}
                              title="Re-approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog with Actions */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Listing Details
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 flex-wrap">
              <span className="font-mono bg-muted px-2 py-0.5 rounded">{selectedListing?.gin || "GIN Pending"}</span>
              {selectedListing && (
                <>
                  <Badge 
                    className={
                      selectedListing.status === "approved" 
                        ? "bg-green-500/10 text-green-600" 
                        : selectedListing.status === "rejected"
                        ? "bg-red-500/10 text-red-600"
                        : selectedListing.status === "under_review"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }
                  >
                    {selectedListing.status === "under_review" ? "Under Review" : (selectedListing.status || "pending")}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    <Badge 
                      className={
                        selectedListing.payout_status === "paid" 
                          ? "bg-green-500/10 text-green-600" 
                          : selectedListing.payout_status === "processing"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }
                    >
                      Payout: {selectedListing.payout_status || "pending"}
                    </Badge>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedListing && (
            <div className="space-y-6">
              {/* Garage & Partner Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                    <Building2 className="w-4 h-4" /> Garage Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Garage Name</p>
                        <p className="font-medium">{selectedListing.garages?.name || "Unknown"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p>{[selectedListing.garages?.address, selectedListing.garages?.city, selectedListing.garages?.state].filter(Boolean).join(", ") || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p>{selectedListing.garages?.phone || "Not provided"}</p>
                      </div>
                    </div>
                    {selectedListing.garages?.services && selectedListing.garages.services.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Services</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedListing.garages.services.map((service, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{service}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedListing.garages?.location_link && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={selectedListing.garages.location_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-violet-700">
                    <Eye className="w-4 h-4" /> Partner Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedListing.partners?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Partner ID</p>
                      <p className="font-mono text-xs">{selectedListing.partners?.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Preview Section */}
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                  <Image className="w-4 h-4" /> Uploaded Photos
                </h4>
                {isLoadingPhotos ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : listingPhotos.length > 0 ? (
                  <div className="space-y-3">
                    {/* Main Photo Display */}
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={listingPhotos[currentPhotoIndex]?.photo_url}
                        alt={`Garage photo ${currentPhotoIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {listingPhotos.length > 1 && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setCurrentPhotoIndex(prev => 
                              prev === 0 ? listingPhotos.length - 1 : prev - 1
                            )}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setCurrentPhotoIndex(prev => 
                              prev === listingPhotos.length - 1 ? 0 : prev + 1
                            )}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                        {currentPhotoIndex + 1} / {listingPhotos.length}
                      </div>
                    </div>
                    {/* Thumbnail Strip */}
                    {listingPhotos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {listingPhotos.map((photo, index) => (
                          <button
                            key={photo.id}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-colors ${
                              index === currentPhotoIndex 
                                ? 'border-blue-500' 
                                : 'border-transparent hover:border-muted-foreground/50'
                            }`}
                          >
                            <img
                              src={photo.photo_url}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : selectedListing.garages?.photo_url ? (
                  <div className="space-y-2">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={selectedListing.garages.photo_url}
                        alt="Garage"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Main listing photo only</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Image className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No photos uploaded</p>
                  </div>
                )}
              </div>

              {/* Categories/Services */}
              <div className="p-4 rounded-lg bg-muted/30 border">
                <h4 className="font-semibold mb-3">Earning Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                    Data Collection (₹20)
                  </Badge>
                  {selectedListing.reputation_upsell && (
                    <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/30">
                      Reputation Management (₹450 commission)
                    </Badge>
                  )}
                  {selectedListing.gms_upsell && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                      GMS Software (₹1,800 commission)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700">
                  <IndianRupee className="w-4 h-4" /> Earnings Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Data Collection (Base)</span>
                    <span className="font-medium">₹{selectedListing.base_earning || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reputation Upsell</span>
                    <span className="font-medium">₹{selectedListing.reputation_earning || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GMS Software Sale</span>
                    <span className="font-medium">₹{selectedListing.gms_earning || 0}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total Earnings</span>
                    <span className="text-emerald-600">₹{selectedListing.total_earning || 0}</span>
                  </div>
                </div>
              </div>

              {/* Payment Proof Section (for upsells) */}
              {(selectedListing.reputation_upsell || selectedListing.gms_upsell) && (
                <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                    <FileText className="w-4 h-4" /> Payment Proof
                  </h4>
                  {isLoadingPaymentProof ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentProofSignedUrl ? (
                    <div className="space-y-2">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={paymentProofSignedUrl}
                          alt="Payment Proof"
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => window.open(paymentProofSignedUrl, '_blank')}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Click image to view full size. Partner uploaded this as proof of payment.
                      </p>
                    </div>
                  ) : selectedListing.payment_proof_url ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Payment proof file exists but could not be loaded.</p>
                      <p className="text-xs text-muted-foreground mt-1">Path: {selectedListing.payment_proof_url}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                      <Image className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No payment proof uploaded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Reason (if any) */}
              {selectedListing.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{selectedListing.rejection_reason}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="text-xs text-muted-foreground border-t pt-3">
                <div className="flex flex-wrap gap-4">
                  <span>Submitted: {selectedListing.submitted_at ? new Date(selectedListing.submitted_at).toLocaleString() : "-"}</span>
                  {selectedListing.approved_at && (
                    <span>Approved: {new Date(selectedListing.approved_at).toLocaleString()}</span>
                  )}
                </div>
              </div>

              {/* Approval Actions */}
              {(!selectedListing.status || selectedListing.status === "pending" || selectedListing.status === "under_review") && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-700">
                    <Clock className="w-4 h-4" /> Pending Approval
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review the listing details above and approve or reject this submission.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedListing.id, selectedListing.listing_id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Listing
                    </Button>
                    <Button 
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        setRejectingListingId(selectedListing.id);
                        setIsRejectDialogOpen(true);
                        setIsDetailsOpen(false);
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Listing
                    </Button>
                  </div>
                </div>
              )}

              {/* Payout Management (only for approved listings) */}
              {selectedListing.status === "approved" && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                    <Wallet className="w-4 h-4" /> Payout Management
                  </h4>
                  
                  {/* Payout Status Timeline */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => handleUpdatePayoutStatus(selectedListing.id, "pending")}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${
                        !selectedListing.payout_status || selectedListing.payout_status === "pending"
                          ? "bg-yellow-500 text-white ring-2 ring-yellow-500/50"
                          : "bg-muted text-muted-foreground hover:bg-yellow-500/20"
                      }`}
                    >
                      <Clock className="w-3 h-3" /> Pending
                    </button>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <button
                      onClick={() => handleUpdatePayoutStatus(selectedListing.id, "processing")}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${
                        selectedListing.payout_status === "processing"
                          ? "bg-blue-500 text-white ring-2 ring-blue-500/50"
                          : selectedListing.payout_status === "paid"
                          ? "bg-muted text-muted-foreground hover:bg-blue-500/20"
                          : "bg-muted/50 text-muted-foreground hover:bg-blue-500/20"
                      }`}
                    >
                      <CreditCard className="w-3 h-3" /> Processing
                    </button>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <button
                      onClick={() => handleUpdatePayoutStatus(selectedListing.id, "paid")}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${
                        selectedListing.payout_status === "paid"
                          ? "bg-green-500 text-white ring-2 ring-green-500/50"
                          : "bg-muted/50 text-muted-foreground hover:bg-green-500/20"
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" /> Paid
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Click on any status to update the payout status. Changes will reflect in the partner's dashboard.
                  </p>
                </div>
              )}

              {/* Rejected - Option to Re-approve */}
              {selectedListing.status === "rejected" && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                    <XCircle className="w-4 h-4" /> Listing Rejected
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                  </p>
                  <Button 
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedListing.id, selectedListing.listing_id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Re-approve Listing
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
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
                placeholder="e.g., Incomplete information, duplicate listing, invalid data..."
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
              onClick={handleReject}
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
