import { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  Key,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShieldX,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface GarageOwnerData {
  id: string;
  user_id: string;
  garage_id: string | null;
  business_name: string | null;
  contact_phone: string | null;
  subscription_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  user_email?: string;
  garage?: {
    id: string;
    name: string;
    slug: string | null;
    city: string | null;
    state: string | null;
    owner_id: string | null;
  } | null;
  claim_status?: string;
}

interface ClaimRequest {
  id: string;
  garage_id: string;
  claimant_user_id: string;
  claimant_name: string;
  claimant_phone: string;
  claimant_email: string;
  status: string;
  created_at: string;
  garage?: {
    name: string;
    city: string | null;
    state: string | null;
  };
}

export function GarageOwnerManagement() {
  const [owners, setOwners] = useState<GarageOwnerData[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<GarageOwnerData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ owner: GarageOwnerData; type: "credentials" | "garage" } | null>(null);
  const [editForm, setEditForm] = useState({
    business_name: "",
    contact_phone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all garage owners
      const { data: ownersData, error: ownersError } = await supabase
        .from("garage_owners")
        .select("*")
        .order("created_at", { ascending: false });

      if (ownersError) throw ownersError;

      // Fetch associated garages
      const garageIds = (ownersData || [])
        .filter(o => o.garage_id)
        .map(o => o.garage_id);

      let garageMap = new Map<string, any>();
      if (garageIds.length > 0) {
        const { data: garages } = await supabase
          .from("garages")
          .select("id, name, slug, city, state, owner_id")
          .in("id", garageIds);
        
        (garages || []).forEach(g => garageMap.set(g.id, g));
      }

      // Fetch claim requests to get claim status
      const { data: claimsData } = await supabase
        .from("garage_claim_requests")
        .select(`
          id, garage_id, claimant_user_id, claimant_name, claimant_phone, claimant_email, status, created_at,
          garage:garages(name, city, state)
        `)
        .order("created_at", { ascending: false });

      setClaims((claimsData || []) as ClaimRequest[]);

      // Create a map of user_id to latest claim status
      const claimStatusMap = new Map<string, string>();
      (claimsData || []).forEach((claim: any) => {
        if (!claimStatusMap.has(claim.claimant_user_id) || claim.status === "pending") {
          claimStatusMap.set(claim.claimant_user_id, claim.status);
        }
      });

      // Enrich owners with garage and claim data
      const enrichedOwners = (ownersData || []).map(owner => ({
        ...owner,
        garage: owner.garage_id ? garageMap.get(owner.garage_id) : null,
        claim_status: claimStatusMap.get(owner.user_id) || "not_claimed",
      }));

      setOwners(enrichedOwners);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load garage owner data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSubscription = async (owner: GarageOwnerData) => {
    try {
      const newStatus = !owner.subscription_active;
      
      const { error } = await supabase
        .from("garage_owners")
        .update({ 
          subscription_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", owner.id);

      if (error) throw error;

      toast({
        title: newStatus ? "Subscription Enabled" : "Subscription Disabled",
        description: newStatus 
          ? "Garage owner can now access the dashboard"
          : "Dashboard access has been revoked",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error toggling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    }
  };

  const handleEditOwner = (owner: GarageOwnerData) => {
    setSelectedOwner(owner);
    setEditForm({
      business_name: owner.business_name || "",
      contact_phone: owner.contact_phone || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOwner) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("garage_owners")
        .update({
          business_name: editForm.business_name || null,
          contact_phone: editForm.contact_phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOwner.id);

      if (error) throw error;

      toast({
        title: "Owner Updated",
        description: "Garage owner details have been saved",
      });

      setIsEditOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error updating owner:", error);
      toast({
        title: "Error",
        description: "Failed to update owner details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCredentials = async (owner: GarageOwnerData) => {
    try {
      // Delete from garage_owners table
      const { error: ownerError } = await supabase
        .from("garage_owners")
        .delete()
        .eq("id", owner.id);

      if (ownerError) throw ownerError;

      // Remove garage_owner role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", owner.user_id)
        .eq("role", "garage_owner");

      // Clear owner_id from garage if linked
      if (owner.garage_id) {
        await supabase
          .from("garages")
          .update({ owner_id: null })
          .eq("id", owner.garage_id);
      }

      toast({
        title: "Credentials Deleted",
        description: "Garage owner login has been removed. The garage listing remains.",
      });

      setDeleteDialog(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting credentials:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete credentials",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGarage = async (owner: GarageOwnerData) => {
    if (!owner.garage_id) return;

    try {
      // Delete the garage
      const { error } = await supabase
        .from("garages")
        .delete()
        .eq("id", owner.garage_id);

      if (error) throw error;

      // Update owner record to remove garage_id
      await supabase
        .from("garage_owners")
        .update({ garage_id: null, subscription_active: false })
        .eq("id", owner.id);

      toast({
        title: "Garage Deleted",
        description: "The garage listing has been completely removed.",
      });

      setDeleteDialog(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting garage:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete garage. It may have associated reviews.",
        variant: "destructive",
      });
    }
  };

  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Claimed & Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Claim Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Not Claimed
          </Badge>
        );
    }
  };

  const getSubscriptionBadge = (active: boolean) => {
    if (active) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
        <ShieldX className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const filteredOwners = owners.filter(owner =>
    (owner.business_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (owner.contact_phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (owner.garage?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalOwners = owners.length;
  const activeSubscriptions = owners.filter(o => o.subscription_active).length;
  const pendingClaims = claims.filter(c => c.status === "pending").length;
  const approvedClaims = owners.filter(o => o.claim_status === "approved").length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Owners</p>
                <p className="text-3xl font-bold">{totalOwners}</p>
              </div>
              <User className="w-10 h-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-3xl font-bold text-green-600">{activeSubscriptions}</p>
              </div>
              <CreditCard className="w-10 h-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Claims</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingClaims}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Claims</p>
                <p className="text-3xl font-bold text-blue-600">{approvedClaims}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Refresh */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by business name, phone, or garage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Garage Owners Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : filteredOwners.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No garage owners found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Garage</TableHead>
                    <TableHead>Claim Status</TableHead>
                    <TableHead className="text-center">Subscription</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{owner.business_name || "No Name"}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {owner.contact_phone || "No Phone"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {owner.garage ? (
                          <div>
                            <p className="font-medium">{owner.garage.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[owner.garage.city, owner.garage.state].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No Garage Linked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getClaimStatusBadge(owner.claim_status || "not_claimed")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getSubscriptionBadge(owner.subscription_active)}
                          <Switch
                            checked={owner.subscription_active}
                            onCheckedChange={() => handleToggleSubscription(owner)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(owner.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {owner.garage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`/garage/${owner.garage?.slug}`, "_blank")}
                              title="View Garage"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditOwner(owner)}
                            title="Edit Credentials"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({ owner, type: "credentials" })}
                            title="Delete Credentials"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          {owner.garage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({ owner, type: "garage" })}
                              title="Delete Garage Listing"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Edit Owner Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Garage Owner</DialogTitle>
            <DialogDescription>
              Update the garage owner's business details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={editForm.business_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter business name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={editForm.contact_phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            {selectedOwner?.garage && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Linked Garage:</p>
                <p className="font-medium">{selectedOwner.garage.name}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {deleteDialog?.type === "credentials" ? "Delete Login Credentials?" : "Delete Garage Listing?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === "credentials" ? (
                <>
                  This will remove the garage owner login for <strong>{deleteDialog.owner.business_name || "this user"}</strong>.
                  <br /><br />
                  <strong>The garage listing will remain</strong>, but the owner will no longer be able to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Log in as a garage owner</li>
                    <li>Access the garage dashboard</li>
                    <li>Manage reviews or leads</li>
                  </ul>
                </>
              ) : (
                <>
                  This will <strong>permanently delete</strong> the garage listing:
                  <br /><br />
                  <strong className="text-lg">{deleteDialog?.owner.garage?.name}</strong>
                  <br /><br />
                  This action cannot be undone. All associated data will be removed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog?.type === "credentials") {
                  handleDeleteCredentials(deleteDialog.owner);
                } else if (deleteDialog?.type === "garage") {
                  handleDeleteGarage(deleteDialog.owner);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteDialog?.type === "credentials" ? "Delete Credentials" : "Delete Garage"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
