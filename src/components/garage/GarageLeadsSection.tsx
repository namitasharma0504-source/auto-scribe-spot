import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Car, 
  Wrench,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  vehicle_details: string | null;
  service_required: string;
  status: string;
  created_at: string;
  contacted_at: string | null;
}

interface GarageLeadsSectionProps {
  garageId: string;
}

export function GarageLeadsSection({ garageId }: GarageLeadsSectionProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!garageId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("garage_leads")
        .select("*")
        .eq("garage_id", garageId)
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
  }, [garageId]);

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

  const newLeads = leads.filter(l => l.status === "new");

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
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!garageId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Leads</CardTitle>
          <CardDescription>Quote requests from potential customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please save your garage profile first to receive leads.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Customer Leads
              {newLeads.length > 0 && (
                <Badge className="bg-blue-500">{newLeads.length} New</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Quote requests from customers. Contact them to convert into business!
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No leads yet. Share your garage profile to get more inquiries!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <Card key={lead.id} className={lead.status === "new" ? "border-blue-500/30 bg-blue-500/5" : ""}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <h3 className="font-semibold text-lg">{lead.customer_name}</h3>
                        {getStatusBadge(lead.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${lead.customer_phone}`} className="text-primary hover:underline font-medium">
                            {lead.customer_phone}
                          </a>
                        </div>
                        {lead.customer_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${lead.customer_email}`} className="text-primary hover:underline">
                              {lead.customer_email}
                            </a>
                          </div>
                        )}
                        {lead.vehicle_details && (
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span>{lead.vehicle_details}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          Service Required:
                        </p>
                        <p className="text-sm">{lead.service_required}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Received: {formatDate(lead.created_at)}
                        </span>
                        {lead.contacted_at && (
                          <span className="flex items-center gap-1">
                            <PhoneCall className="w-3 h-3" />
                            Contacted: {formatDate(lead.contacted_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 lg:flex-col">
                      <Select
                        value={lead.status}
                        onValueChange={(value) => updateLeadStatus(lead.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
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
                        variant="default"
                        className="gap-1"
                        asChild
                      >
                        <a href={`tel:${lead.customer_phone}`}>
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
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
  );
}
