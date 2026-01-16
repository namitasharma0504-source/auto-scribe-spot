import { useState, useEffect } from "react";
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Search,
  Phone,
  Mail,
  FileText,
  User,
  ArrowRight,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClaimRequest {
  id: string;
  garage_id: string;
  claimant_user_id: string;
  claimant_name: string;
  claimant_phone: string;
  claimant_email: string;
  business_proof: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  garage?: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
  };
}

// Component to display proof documents
function ClaimProofSection({ businessProof, claimantUserId }: { businessProof: string; claimantUserId: string }) {
  const [documentUrls, setDocumentUrls] = useState<{ url: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Try to parse the proof as JSON to get documents
  let proofData: { description?: string; documents?: string[] } | null = null;
  try {
    proofData = JSON.parse(businessProof);
  } catch {
    // It's plain text
  }

  useEffect(() => {
    const fetchDocumentUrls = async () => {
      if (!proofData?.documents?.length) return;
      
      setLoading(true);
      const urls: { url: string; name: string }[] = [];
      
      for (const docPath of proofData.documents) {
        const { data } = await supabase.storage
          .from('claim-documents')
          .createSignedUrl(docPath, 3600); // 1 hour expiry
        
        if (data?.signedUrl) {
          const fileName = docPath.split('/').pop() || 'Document';
          urls.push({ url: data.signedUrl, name: fileName });
        }
      }
      
      setDocumentUrls(urls);
      setLoading(false);
    };

    fetchDocumentUrls();
  }, [businessProof]);

  const isImage = (name: string) => {
    return /\.(jpg|jpeg|png|webp)$/i.test(name);
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <FileText className="w-3 h-3" />
        Ownership Proof:
      </p>
      
      {/* Text description */}
      {proofData?.description && (
        <p className="text-sm">{proofData.description}</p>
      )}
      
      {/* Plain text (if not JSON) */}
      {!proofData && businessProof && (
        <p className="text-sm">{businessProof}</p>
      )}
      
      {/* Documents */}
      {loading && (
        <p className="text-xs text-muted-foreground">Loading documents...</p>
      )}
      
      {documentUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {documentUrls.map((doc, index) => (
            <a
              key={index}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs bg-background border rounded px-2 py-1 hover:bg-accent transition-colors"
            >
              {isImage(doc.name) ? (
                <ImageIcon className="w-3 h-3 text-primary" />
              ) : (
                <FileText className="w-3 h-3 text-primary" />
              )}
              <span className="truncate max-w-[100px]">{doc.name}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClaimManagement() {
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<ClaimRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionDialog, setActionDialog] = useState<{ claim: ClaimRequest; action: "approve" | "reject" } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingClaim, setEditingClaim] = useState<ClaimRequest | null>(null);
  const [editForm, setEditForm] = useState({
    claimant_name: "",
    claimant_phone: "",
    claimant_email: "",
  });
  const { toast } = useToast();

  const handleOpenEdit = (claim: ClaimRequest) => {
    setEditForm({
      claimant_name: claim.claimant_name,
      claimant_phone: claim.claimant_phone,
      claimant_email: claim.claimant_email,
    });
    setEditingClaim(claim);
  };

  const handleSaveEdit = async () => {
    if (!editingClaim) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("garage_claim_requests")
        .update({
          claimant_name: editForm.claimant_name,
          claimant_phone: editForm.claimant_phone,
          claimant_email: editForm.claimant_email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingClaim.id);

      if (error) throw error;

      toast({
        title: "Claim Updated",
        description: "The claim details have been updated successfully.",
      });

      setEditingClaim(null);
      fetchClaims();
    } catch (error: any) {
      console.error("Error updating claim:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update claim",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("garage_claim_requests")
        .select(`
          *,
          garage:garages(id, name, address, city, state)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error: any) {
      console.error("Error fetching claims:", error);
      toast({
        title: "Error",
        description: "Failed to load claim requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleApprove = async (claim: ClaimRequest) => {
    setIsProcessing(true);
    try {
      // Update claim status
      const { error: claimError } = await supabase
        .from("garage_claim_requests")
        .update({ 
          status: "approved", 
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", claim.id);

      if (claimError) throw claimError;

      // Update garage owner_id
      const { error: garageError } = await supabase
        .from("garages")
        .update({ owner_id: claim.claimant_user_id })
        .eq("id", claim.garage_id);

      if (garageError) throw garageError;

      // Add garage_owner role to user if not exists
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ 
          user_id: claim.claimant_user_id, 
          role: "garage_owner" 
        }, { 
          onConflict: "user_id,role" 
        });

      // Check if garage_owner record exists and update/insert accordingly
      const { data: existingOwner } = await supabase
        .from("garage_owners")
        .select("id")
        .eq("user_id", claim.claimant_user_id)
        .maybeSingle();

      if (existingOwner) {
        // Update existing record with the claimed garage
        const { error: updateError } = await supabase
          .from("garage_owners")
          .update({
            garage_id: claim.garage_id,
            business_name: claim.garage?.name || claim.claimant_name,
            contact_phone: claim.claimant_phone,
          })
          .eq("user_id", claim.claimant_user_id);
        
        if (updateError) {
          console.error("Failed to update garage_owners:", updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("garage_owners")
          .insert({
            user_id: claim.claimant_user_id,
            garage_id: claim.garage_id,
            business_name: claim.garage?.name || claim.claimant_name,
            contact_phone: claim.claimant_phone,
            subscription_active: false, // Admin must enable after payment
          });
        
        if (insertError) {
          console.error("Failed to insert garage_owners:", insertError);
        }
      }

      // Send email notification to claimant
      try {
        const { data: session } = await supabase.auth.getSession();
        await supabase.functions.invoke("send-review-notification", {
          body: {
            type: "claim_approved",
            reviewData: {
              claimantEmail: claim.claimant_email,
              claimantName: claim.claimant_name,
              garageName: claim.garage?.name,
              garageLocation: [claim.garage?.address, claim.garage?.city, claim.garage?.state].filter(Boolean).join(", "),
              adminNotes: adminNotes || null,
            },
          },
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        });
        console.log("Claim approval email sent to:", claim.claimant_email);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the approval if email fails
      }

      toast({
        title: "Claim Approved!",
        description: `${claim.claimant_name} is now the owner of ${claim.garage?.name}. Enable subscription in "Garage Owners" tab to grant dashboard access.`,
      });

      setActionDialog(null);
      setAdminNotes("");
      fetchClaims();
    } catch (error: any) {
      console.error("Error approving claim:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve claim",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (claim: ClaimRequest) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("garage_claim_requests")
        .update({ 
          status: "rejected", 
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", claim.id);

      if (error) throw error;

      // Send email notification to claimant
      try {
        const { data: session } = await supabase.auth.getSession();
        await supabase.functions.invoke("send-review-notification", {
          body: {
            type: "claim_rejected",
            reviewData: {
              claimantEmail: claim.claimant_email,
              claimantName: claim.claimant_name,
              garageName: claim.garage?.name,
              garageLocation: [claim.garage?.address, claim.garage?.city, claim.garage?.state].filter(Boolean).join(", "),
              adminNotes: adminNotes || null,
            },
          },
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        });
        console.log("Claim rejection email sent to:", claim.claimant_email);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // Don't fail the rejection if email fails
      }

      toast({
        title: "Claim Rejected",
        description: "The claim request has been rejected.",
      });

      setActionDialog(null);
      setAdminNotes("");
      fetchClaims();
    } catch (error: any) {
      console.error("Error rejecting claim:", error);
      toast({
        title: "Error",
        description: "Failed to reject claim",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingClaims = claims.filter(c => c.status === "pending");
  const approvedClaims = claims.filter(c => c.status === "approved");
  const rejectedClaims = claims.filter(c => c.status === "rejected");

  const filteredClaims = claims.filter(claim =>
    claim.claimant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.claimant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.garage?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Claims</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingClaims.length}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Claims</p>
                <p className="text-3xl font-bold text-green-600">{approvedClaims.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected Claims</p>
                <p className="text-3xl font-bold text-red-600">{rejectedClaims.length}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Refresh */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or garage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchClaims} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-2">Loading claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No claim requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredClaims.map((claim) => (
            <Card key={claim.id} className={claim.status === "pending" ? "border-yellow-500/30" : ""}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          {claim.garage?.name || "Unknown Garage"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {[claim.garage?.address, claim.garage?.city, claim.garage?.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{claim.claimant_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{claim.claimant_phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{claim.claimant_email}</span>
                      </div>
                    </div>

                    {claim.business_proof && (
                      <ClaimProofSection businessProof={claim.business_proof} claimantUserId={claim.claimant_user_id} />
                    )}

                    {claim.admin_notes && (
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Admin Notes:</p>
                        <p className="text-sm">{claim.admin_notes}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Submitted: {formatDate(claim.created_at)}
                    </p>
                  </div>

                  {claim.status === "pending" && (
                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleOpenEdit(claim)}
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => setActionDialog({ claim, action: "approve" })}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => setActionDialog({ claim, action: "reject" })}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.action === "approve" ? "Approve Claim" : "Reject Claim"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.action === "approve" ? (
                <>
                  This will make <strong>{actionDialog.claim.claimant_name}</strong> the owner of{" "}
                  <strong>{actionDialog.claim.garage?.name}</strong>. They will be able to login and manage this garage.
                </>
              ) : (
                <>
                  This will reject the claim from <strong>{actionDialog?.claim.claimant_name}</strong> for{" "}
                  <strong>{actionDialog?.claim.garage?.name}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Notes (Optional)</label>
            <Textarea
              placeholder="Add any notes about this decision..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isProcessing}
              className={actionDialog?.action === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
              onClick={() => {
                if (actionDialog?.action === "approve") {
                  handleApprove(actionDialog.claim);
                } else if (actionDialog?.action === "reject") {
                  handleReject(actionDialog!.claim);
                }
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionDialog?.action === "approve" ? (
                "Approve & Assign Ownership"
              ) : (
                "Reject Claim"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Claim Dialog */}
      <Dialog open={!!editingClaim} onOpenChange={() => setEditingClaim(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Claim Details</DialogTitle>
            <DialogDescription>
              Update the claimant information for {editingClaim?.garage?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Claimant Name</label>
              <Input
                value={editForm.claimant_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, claimant_name: e.target.value }))}
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={editForm.claimant_phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, claimant_phone: e.target.value }))}
                placeholder="Phone Number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={editForm.claimant_email}
                onChange={(e) => setEditForm(prev => ({ ...prev, claimant_email: e.target.value }))}
                placeholder="Email Address"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingClaim(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
