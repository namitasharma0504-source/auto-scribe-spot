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
  Filter
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
  partners?: { id: string; full_name: string; username: string } | null;
  garages?: { name: string; city: string | null; phone: string | null } | null;
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
          garages:listing_id (name, city, phone)
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

  const handleApprove = async (listingId: string) => {
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

      fetchListings();
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
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={payoutFilter} onValueChange={setPayoutFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Payout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payouts</SelectItem>
            <SelectItem value="pending">Pending Payout</SelectItem>
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
                    <TableRow key={listing.id}>
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
                              : "bg-yellow-500/10 text-yellow-600"
                          }
                        >
                          {listing.status || "pending"}
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
                      <TableCell className="text-right">
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
                          {(!listing.status || listing.status === "pending") && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                onClick={() => handleApprove(listing.id)}
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
                              onClick={() => handleApprove(listing.id)}
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

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Listing Details
            </DialogTitle>
            <DialogDescription>
              GIN: {selectedListing?.gin || "Not assigned"}
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Garage Name</p>
                  <p className="font-medium">{selectedListing.garages?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{selectedListing.garages?.city || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partner</p>
                  <p className="font-medium">{selectedListing.partners?.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedListing.partners?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Garage Phone</p>
                  <p className="font-medium">{selectedListing.garages?.phone || "-"}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <h4 className="font-semibold mb-3">Earnings Breakdown</h4>
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
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-emerald-600">₹{selectedListing.total_earning || 0}</span>
                  </div>
                </div>
              </div>

              {selectedListing.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{selectedListing.rejection_reason}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Submitted: {selectedListing.submitted_at ? new Date(selectedListing.submitted_at).toLocaleString() : "-"}</p>
                {selectedListing.approved_at && (
                  <p>Approved: {new Date(selectedListing.approved_at).toLocaleString()}</p>
                )}
              </div>
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
