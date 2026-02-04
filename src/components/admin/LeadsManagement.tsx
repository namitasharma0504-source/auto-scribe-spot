import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Car, 
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Building2,
  PhoneCall,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Lead {
  id: string;
  garage_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  vehicle_details: string | null;
  service_required: string;
  status: string;
  admin_notes: string | null;
  contacted_at: string | null;
  created_at: string;
  garage?: {
    id: string;
    name: string;
    phone: string | null;
    city: string | null;
    address: string | null;
    owner_id: string | null;
  };
}

export function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("garage_leads")
        .select(`
          *,
          garage:garages(id, name, phone, city, address, owner_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "contacted") {
        updateData.contacted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("garage_leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Lead marked as ${newStatus}`,
      });

      fetchLeads();
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedLead) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("garage_leads")
        .update({ admin_notes: adminNotes })
        .eq("id", selectedLead.id);

      if (error) throw error;

      toast({
        title: "Notes Saved",
        description: "Admin notes have been updated",
      });

      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const newLeads = leads.filter(l => l.status === "new");
  const contactedLeads = leads.filter(l => l.status === "contacted");
  const convertedLeads = leads.filter(l => l.status === "converted");
  const closedLeads = leads.filter(l => l.status === "closed");

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.customer_phone.includes(searchQuery) ||
      lead.garage?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.service_required.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Separate unclaimed and claimed garage leads
  const unclaimedLeads = filteredLeads.filter(l => !l.garage?.owner_id);
  const claimedLeads = filteredLeads.filter(l => l.garage?.owner_id);

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
      case "new":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><AlertCircle className="w-3 h-3 mr-1" />New</Badge>;
      case "contacted":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><PhoneCall className="w-3 h-3 mr-1" />Contacted</Badge>;
      case "converted":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Converted</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activateGMS = async (lead: Lead) => {
    if (!lead.garage?.id) return;
    
    try {
      // Activate GMS for the garage
      const { error: gmsError } = await supabase
        .from("garages")
        .update({ gms_enabled: true })
        .eq("id", lead.garage.id);

      if (gmsError) throw gmsError;

      // Update lead status to converted
      const { error: leadError } = await supabase
        .from("garage_leads")
        .update({ status: "converted" })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      toast({
        title: "GMS Activated",
        description: `GMS features enabled for ${lead.garage.name}. Lead marked as converted.`,
      });

      fetchLeads();
    } catch (error: any) {
      console.error("Error activating GMS:", error);
      toast({
        title: "Error",
        description: "Failed to activate GMS",
        variant: "destructive",
      });
    }
  };

  const isGMSDemoRequest = (lead: Lead) => 
    lead.service_required?.toLowerCase().includes("gms demo");

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <Card className={lead.status === "new" ? "border-blue-500/30" : ""}>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {getStatusBadge(lead.status)}
                {!lead.garage?.owner_id && (
                  <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">
                    Unclaimed Garage
                  </Badge>
                )}
                {isGMSDemoRequest(lead) && (
                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                    GMS Demo
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(lead.created_at)}
              </span>
            </div>

            {/* Two Column Layout: Customer & Garage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Details */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Customer Details
                </h4>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{lead.customer_name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${lead.customer_phone}`} className="text-primary hover:underline font-medium">
                      {lead.customer_phone}
                    </a>
                  </div>
                  {lead.customer_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${lead.customer_email}`} className="text-primary hover:underline">
                        {lead.customer_email}
                      </a>
                    </div>
                  )}
                  {lead.vehicle_details && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span>{lead.vehicle_details}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Garage Details */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Garage Details
                </h4>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{lead.garage?.name || "Unknown Garage"}</p>
                  {lead.garage?.city && (
                    <p className="text-sm text-muted-foreground">{lead.garage.city}</p>
                  )}
                  {lead.garage?.address && (
                    <p className="text-xs text-muted-foreground">{lead.garage.address}</p>
                  )}
                  {lead.garage?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${lead.garage.phone}`} className="text-primary hover:underline font-medium">
                        {lead.garage.phone}
                      </a>
                    </div>
                  )}
                  {lead.garage?.id && (
                    <a 
                      href={`/garage/${lead.garage.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View Garage Page →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Service Required */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                Service Required:
              </p>
              <p className="text-sm font-medium">{lead.service_required}</p>
            </div>

            {/* Admin Notes */}
            {lead.admin_notes && (
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Admin Notes:</p>
                <p className="text-sm">{lead.admin_notes}</p>
              </div>
            )}

            {/* Timestamps */}
            {lead.contacted_at && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <PhoneCall className="w-3 h-3" />
                Contacted: {formatDate(lead.contacted_at)}
              </div>
            )}
          </div>

          <div className="flex gap-2 lg:flex-col lg:min-w-[140px]">
            {/* GMS Activation Button - Only for GMS Demo requests that aren't converted */}
            {isGMSDemoRequest(lead) && lead.status !== "converted" && lead.garage?.id && (
              <Button
                size="sm"
                variant="default"
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => activateGMS(lead)}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Activate GMS
              </Button>
            )}
            <Select
              value={lead.status}
              onValueChange={(value) => updateLeadStatus(lead.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedLead(lead);
                setAdminNotes(lead.admin_notes || "");
              }}
            >
              Add Notes
            </Button>
            <Button
              size="sm"
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              asChild
            >
              <a href={`tel:${lead.customer_phone}`}>
                <Phone className="w-4 h-4 mr-1" />
                Call
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-3xl font-bold text-blue-600">{newLeads.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-3xl font-bold text-yellow-600">{contactedLeads.length}</p>
              </div>
              <PhoneCall className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-3xl font-bold text-green-600">{convertedLeads.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-500/30 bg-gray-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-3xl font-bold text-gray-600">{closedLeads.length}</p>
              </div>
              <XCircle className="w-10 h-10 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unclaimed Garages Alert */}
      {unclaimedLeads.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-700">Action Required: Unclaimed Garage Leads</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {unclaimedLeads.length} lead(s) are for unclaimed garages. You need to contact these garages manually to pass on the customer details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, garage, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLeads} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-2">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No leads found</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))
        )}
      </div>

      {/* Admin Notes Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add internal notes about this lead from {selectedLead?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter notes about this lead..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Cancel
              </Button>
              <Button onClick={saveAdminNotes} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Notes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
