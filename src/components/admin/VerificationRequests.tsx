import { useState, useEffect } from "react";
import { BadgeCheck, CheckCircle, XCircle, Clock, Building2, Calendar, MessageSquare, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerificationRequest {
  id: string;
  garage_id: string;
  requested_by: string;
  status: string;
  request_message: string | null;
  admin_notes: string | null;
  created_at: string;
  garage?: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
  };
}

export function VerificationRequests() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("verification_requests")
        .select(`
          *,
          garage:garages(name, address, city, state, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data as VerificationRequest[]) || []);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = (request: VerificationRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
    setActionDialogOpen(true);
  };

  const processAction = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Update the verification request
      const { error: requestError } = await supabase
        .from("verification_requests")
        .update({
          status: actionType === "approve" ? "approved" : "rejected",
          admin_notes: adminNotes || null,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (requestError) throw requestError;

      // If approved, update the garage's is_verified status
      if (actionType === "approve") {
        const { error: garageError } = await supabase
          .from("garages")
          .update({ is_verified: true })
          .eq("id", selectedRequest.garage_id);

        if (garageError) throw garageError;
      }

      toast({
        title: actionType === "approve" ? "Garage Verified!" : "Request Rejected",
        description: actionType === "approve" 
          ? "The garage has been verified and the badge is now active."
          : "The verification request has been rejected.",
      });

      setActionDialogOpen(false);
      fetchRequests();
    } catch (error: any) {
      console.error("Error processing verification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {requests.filter(r => r.status === "approved").length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold text-red-600">
                  {requests.filter(r => r.status === "rejected").length}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              Pending Verification Requests
            </CardTitle>
            <CardDescription>Review and approve garage verification requests</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BadgeCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending verification requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-lg text-foreground">
                            {request.garage?.name || "Unknown Garage"}
                          </h3>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                            Pending
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          {request.garage?.address && (
                            <p>{request.garage.address}, {request.garage.city}, {request.garage.state}</p>
                          )}
                          {request.garage?.phone && <p>Phone: {request.garage.phone}</p>}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Requested on {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>

                        {request.request_message && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Additional Info:
                            </p>
                            <p className="text-sm text-foreground">{request.request_message}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(request, "approve")}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleAction(request, "reject")}
                          variant="destructive"
                          className="gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
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

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Requests</CardTitle>
            <CardDescription>History of approved and rejected requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.slice(0, 10).map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{request.garage?.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), "MMM d, yyyy")}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={
                        request.status === "approved" 
                          ? "bg-green-500/10 text-green-600 border-green-500/30"
                          : "bg-red-500/10 text-red-600 border-red-500/30"
                      }
                    >
                      {request.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Approve Verification
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  Reject Verification
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" 
                ? `Approve verification for "${selectedRequest?.garage?.name}". This will add the Verified badge to their listing.`
                : `Reject the verification request for "${selectedRequest?.garage?.name}".`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">
                {actionType === "approve" ? "Notes (Optional)" : "Rejection Reason"}
              </Label>
              <Textarea
                id="admin-notes"
                placeholder={
                  actionType === "approve" 
                    ? "Add any internal notes..."
                    : "Explain why the request was rejected (will be shown to garage owner)..."
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processAction}
              disabled={isProcessing || (actionType === "reject" && !adminNotes.trim())}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {isProcessing ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}