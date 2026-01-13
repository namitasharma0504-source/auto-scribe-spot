import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  ExternalLink,
  User,
  Building2,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Dispute {
  id: string;
  partner_id: string;
  listing_id: string | null;
  gin: string | null;
  reason: string;
  supporting_evidence: string[] | null;
  status: string | null;
  admin_response: string | null;
  outcome: string | null;
  resolution_date: string | null;
  created_at: string | null;
  partner?: {
    full_name: string;
    username: string;
    phone: string;
  };
  listing?: {
    rejection_reason: string | null;
    base_earning: number | null;
    total_earning: number | null;
  } | null;
  garage?: {
    name: string;
    city: string | null;
  } | null;
}

export function PartnerDisputesManagement() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = {
    total: disputes.length,
    pending: disputes.filter((d) => d.status === "pending").length,
    approved: disputes.filter((d) => d.outcome === "approved").length,
    rejected: disputes.filter((d) => d.outcome === "rejected").length,
  };

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const { data: disputesData, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data for each dispute
      const enrichedDisputes = await Promise.all(
        (disputesData || []).map(async (dispute) => {
          // Fetch partner info
          const { data: partner } = await supabase
            .from("partners")
            .select("full_name, username, phone")
            .eq("id", dispute.partner_id)
            .maybeSingle();

          // Fetch listing and garage info if available
          let listing = null;
          let garage = null;
          if (dispute.listing_id) {
            const { data: listingData } = await supabase
              .from("partner_listings")
              .select("rejection_reason, base_earning, total_earning, listing_id")
              .eq("id", dispute.listing_id)
              .maybeSingle();

            listing = listingData;

            if (listingData?.listing_id) {
              const { data: garageData } = await supabase
                .from("garages")
                .select("name, city")
                .eq("id", listingData.listing_id)
                .maybeSingle();
              garage = garageData;
            }
          }

          return {
            ...dispute,
            partner,
            listing,
            garage,
          };
        })
      );

      setDisputes(enrichedDisputes);
    } catch (error: any) {
      console.error("Error fetching disputes:", error);
      toast.error("Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (outcome: "approved" | "rejected") => {
    if (!selectedDispute) return;

    setIsSubmitting(true);
    try {
      // Update dispute
      const { error: disputeError } = await supabase
        .from("disputes")
        .update({
          status: "resolved",
          outcome,
          admin_response: adminResponse.trim() || null,
          resolution_date: new Date().toISOString(),
        })
        .eq("id", selectedDispute.id);

      if (disputeError) throw disputeError;

      // If approved, update the listing status to approved and mark for payout
      if (outcome === "approved" && selectedDispute.listing_id) {
        const { error: listingError } = await supabase
          .from("partner_listings")
          .update({
            status: "approved",
            approved_at: new Date().toISOString(),
            rejection_reason: null,
            payout_status: "pending",
          })
          .eq("id", selectedDispute.listing_id);

        if (listingError) {
          console.error("Error updating listing:", listingError);
        }
      }

      toast.success(
        outcome === "approved"
          ? "Dispute approved - listing reinstated for payout"
          : "Dispute rejected"
      );

      setResolveDialogOpen(false);
      setAdminResponse("");
      setSelectedDispute(null);
      fetchDisputes();
    } catch (error: any) {
      console.error("Error resolving dispute:", error);
      toast.error("Failed to resolve dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResolveDialog = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAdminResponse(dispute.admin_response || "");
    setResolveDialogOpen(true);
  };

  const openDetailsDialog = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (dispute: Dispute) => {
    if (dispute.status === "pending") {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (dispute.outcome === "approved") {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  };

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.gin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.partner?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.garage?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && dispute.status === "pending") ||
      (statusFilter === "approved" && dispute.outcome === "approved") ||
      (statusFilter === "rejected" && dispute.outcome === "rejected");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-muted">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Disputes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Partner Disputes
          </CardTitle>
          <CardDescription>
            Review and resolve partner disputes on rejected listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by GIN, partner name, garage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disputes</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDisputes} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading disputes...</p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No disputes found</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GIN</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Garage</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {dispute.gin || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {dispute.partner?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{dispute.partner?.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {dispute.garage?.name || "Unknown Garage"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dispute.garage?.city || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2 max-w-[200px]">
                          {dispute.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        {dispute.supporting_evidence && dispute.supporting_evidence.length > 0 ? (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="w-3 h-3" />
                            {dispute.supporting_evidence.length} file(s)
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(dispute)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {dispute.created_at
                            ? format(new Date(dispute.created_at), "MMM d, yyyy")
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailsDialog(dispute)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {dispute.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResolveDialog(dispute)}
                            >
                              Resolve
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
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Dispute Details
            </DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className="font-mono">
                {selectedDispute?.gin || "N/A"}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6 pt-4">
              {/* Partner Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Partner Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {selectedDispute.partner?.full_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Username:</span>{" "}
                    @{selectedDispute.partner?.username}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {selectedDispute.partner?.phone}
                  </div>
                </div>
              </div>

              {/* Garage & Listing Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Garage & Listing
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Garage:</span>{" "}
                    {selectedDispute.garage?.name || "Unknown"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">City:</span>{" "}
                    {selectedDispute.garage?.city || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base Earning:</span>{" "}
                    ₹{selectedDispute.listing?.base_earning || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Earning:</span>{" "}
                    ₹{selectedDispute.listing?.total_earning || 0}
                  </div>
                </div>
                {selectedDispute.listing?.rejection_reason && (
                  <div className="mt-3 p-2 bg-red-500/10 rounded border border-red-500/30">
                    <p className="text-sm font-medium text-red-700">Original Rejection Reason:</p>
                    <p className="text-sm text-red-600">
                      {selectedDispute.listing.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Dispute Reason */}
              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-700">
                  <MessageSquare className="w-4 h-4" />
                  Dispute Reason
                </h4>
                <p className="text-sm">{selectedDispute.reason}</p>
              </div>

              {/* Supporting Evidence */}
              {selectedDispute.supporting_evidence &&
                selectedDispute.supporting_evidence.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Supporting Evidence
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDispute.supporting_evidence.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-background rounded border hover:bg-muted transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Evidence {index + 1}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* Resolution (if resolved) */}
              {selectedDispute.status === "resolved" && (
                <div
                  className={`p-4 rounded-lg border ${
                    selectedDispute.outcome === "approved"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {selectedDispute.outcome === "approved" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    Resolution
                  </h4>
                  <p className="text-sm mb-2">
                    <span className="text-muted-foreground">Outcome:</span>{" "}
                    <span className="font-medium capitalize">{selectedDispute.outcome}</span>
                  </p>
                  {selectedDispute.admin_response && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Admin Response:</span>{" "}
                      {selectedDispute.admin_response}
                    </p>
                  )}
                  {selectedDispute.resolution_date && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Resolved on{" "}
                      {format(new Date(selectedDispute.resolution_date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Resolve Dispute
            </DialogTitle>
            <DialogDescription>
              Review the dispute for{" "}
              <Badge variant="outline" className="font-mono">
                {selectedDispute?.gin || "N/A"}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium">{selectedDispute.garage?.name || "Unknown Garage"}</p>
                <p className="text-muted-foreground">
                  Partner: {selectedDispute.partner?.full_name}
                </p>
                <p className="text-muted-foreground">
                  Earning at stake: ₹{selectedDispute.listing?.total_earning || 0}
                </p>
              </div>

              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <p className="text-sm font-medium text-orange-700">Dispute Reason:</p>
                <p className="text-sm mt-1">{selectedDispute.reason}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-response">Admin Response (optional)</Label>
                <Textarea
                  id="admin-response"
                  placeholder="Add a note about your decision..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResolve("rejected")}
              disabled={isSubmitting}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject Dispute
            </Button>
            <Button
              onClick={() => handleResolve("approved")}
              disabled={isSubmitting}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Approve & Reinstate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
