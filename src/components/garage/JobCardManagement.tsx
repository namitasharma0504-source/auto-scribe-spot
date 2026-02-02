import { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, FileText, Clock, CheckCircle2, Truck, XCircle, 
  Filter, Eye, Edit2, Printer, Phone, Car, User, Calendar,
  Wrench, IndianRupee, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type JobCardStatus = "pending" | "in_progress" | "waiting_parts" | "completed" | "delivered" | "cancelled";

interface JobCard {
  id: string;
  job_card_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
  vehicle_number: string;
  vehicle_color: string | null;
  odometer_reading: number | null;
  fuel_level: string | null;
  service_type: string;
  service_description: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  labor_cost: number | null;
  parts_cost: number | null;
  status: JobCardStatus;
  estimated_completion: string | null;
  actual_completion: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  is_paid: boolean;
  payment_method: string | null;
  created_at: string;
  assigned_mechanic?: { id: string; name: string } | null;
}

interface SparePart {
  id: string;
  part_name: string;
  part_number: string | null;
  quantity: number;
  selling_price: number;
}

interface JobCardPart {
  id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  spare_parts_inventory: {
    part_name: string;
    part_number: string | null;
  };
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

interface JobCardManagementProps {
  garageId: string;
  garageName: string;
}

const SERVICE_TYPES = [
  "General Service",
  "Oil Change",
  "Brake Service",
  "Engine Repair",
  "AC Service",
  "Electrical Repair",
  "Body Work",
  "Wheel Alignment",
  "Tyre Change",
  "Battery Replacement",
  "Clutch Repair",
  "Suspension Repair",
  "Other",
];

const STATUS_CONFIG: Record<JobCardStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Wrench },
  waiting_parts: { label: "Waiting Parts", color: "bg-orange-100 text-orange-800 border-orange-300", icon: Package },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  delivered: { label: "Delivered", color: "bg-purple-100 text-purple-800 border-purple-300", icon: Truck },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
};

export function JobCardManagement({ garageId, garageName }: JobCardManagementProps) {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [inventory, setInventory] = useState<SparePart[]>([]);
  const [jobCardParts, setJobCardParts] = useState<JobCardPart[]>([]);
  const [addPartDialogOpen, setAddPartDialogOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQuantity, setPartQuantity] = useState(1);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: "",
    vehicle_number: "",
    vehicle_color: "",
    odometer_reading: "",
    fuel_level: "Half",
    service_type: "",
    service_description: "",
    estimated_cost: "",
    labor_cost: "",
    estimated_completion: "",
    customer_notes: "",
    internal_notes: "",
    assigned_mechanic_id: "",
  });

  useEffect(() => {
    fetchJobCards();
    fetchStaff();
    fetchInventory();
  }, [garageId]);

  const fetchJobCards = async () => {
    try {
      const { data, error } = await supabase
        .from("job_cards")
        .select(`
          *,
          assigned_mechanic:garage_staff!job_cards_assigned_mechanic_id_fkey(id, name)
        `)
        .eq("garage_id", garageId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobCards((data || []) as JobCard[]);
    } catch (error) {
      console.error("Error fetching job cards:", error);
      toast({
        title: "Error",
        description: "Failed to load job cards.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await supabase
        .from("garage_staff")
        .select("id, name, role")
        .eq("garage_id", garageId)
        .eq("is_active", true)
        .in("role", ["mechanic", "manager"]);
      
      setStaff((data || []) as StaffMember[]);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const { data } = await supabase
        .from("spare_parts_inventory")
        .select("id, part_name, part_number, quantity, selling_price")
        .eq("garage_id", garageId)
        .gt("quantity", 0)
        .order("part_name");
      
      setInventory((data || []) as SparePart[]);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const fetchJobCardParts = async (jobCardId: string) => {
    try {
      const { data, error } = await supabase
        .from("job_card_parts")
        .select(`
          *,
          spare_parts_inventory(part_name, part_number)
        `)
        .eq("job_card_id", jobCardId);

      if (error) throw error;
      setJobCardParts((data || []) as JobCardPart[]);
    } catch (error) {
      console.error("Error fetching job card parts:", error);
    }
  };

  const filteredJobCards = useMemo(() => {
    return jobCards.filter((card) => {
      const matchesSearch =
        card.job_card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.customer_phone.includes(searchTerm) ||
        card.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || card.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobCards, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    pending: jobCards.filter((c) => c.status === "pending").length,
    in_progress: jobCards.filter((c) => c.status === "in_progress").length,
    completed: jobCards.filter((c) => c.status === "completed").length,
    delivered: jobCards.filter((c) => c.status === "delivered").length,
  }), [jobCards]);

  const handleCreateJobCard = () => {
    setSelectedJobCard(null);
    setFormData({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_year: "",
      vehicle_number: "",
      vehicle_color: "",
      odometer_reading: "",
      fuel_level: "Half",
      service_type: "",
      service_description: "",
      estimated_cost: "",
      labor_cost: "",
      estimated_completion: "",
      customer_notes: "",
      internal_notes: "",
      assigned_mechanic_id: "",
    });
    setDialogOpen(true);
  };

  const handleViewJobCard = async (card: JobCard) => {
    setSelectedJobCard(card);
    await fetchJobCardParts(card.id);
    setDetailSheetOpen(true);
  };

  const handleEditJobCard = (card: JobCard) => {
    setSelectedJobCard(card);
    setFormData({
      customer_name: card.customer_name,
      customer_phone: card.customer_phone,
      customer_email: card.customer_email || "",
      customer_address: card.customer_address || "",
      vehicle_make: card.vehicle_make,
      vehicle_model: card.vehicle_model,
      vehicle_year: card.vehicle_year?.toString() || "",
      vehicle_number: card.vehicle_number,
      vehicle_color: card.vehicle_color || "",
      odometer_reading: card.odometer_reading?.toString() || "",
      fuel_level: card.fuel_level || "Half",
      service_type: card.service_type,
      service_description: card.service_description || "",
      estimated_cost: card.estimated_cost?.toString() || "",
      labor_cost: card.labor_cost?.toString() || "",
      estimated_completion: card.estimated_completion ? format(new Date(card.estimated_completion), "yyyy-MM-dd'T'HH:mm") : "",
      customer_notes: card.customer_notes || "",
      internal_notes: card.internal_notes || "",
      assigned_mechanic_id: card.assigned_mechanic?.id || "",
    });
    setDialogOpen(true);
  };

  const handleSaveJobCard = async () => {
    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      toast({
        title: "Error",
        description: "Customer name and phone are required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.vehicle_make.trim() || !formData.vehicle_model.trim() || !formData.vehicle_number.trim()) {
      toast({
        title: "Error",
        description: "Vehicle make, model, and number are required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.service_type) {
      toast({
        title: "Error",
        description: "Service type is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const jobCardData = {
        garage_id: garageId,
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email.trim() || null,
        customer_address: formData.customer_address.trim() || null,
        vehicle_make: formData.vehicle_make.trim(),
        vehicle_model: formData.vehicle_model.trim(),
        vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : null,
        vehicle_number: formData.vehicle_number.trim().toUpperCase(),
        vehicle_color: formData.vehicle_color.trim() || null,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
        fuel_level: formData.fuel_level || null,
        service_type: formData.service_type,
        service_description: formData.service_description.trim() || null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        labor_cost: formData.labor_cost ? parseFloat(formData.labor_cost) : null,
        estimated_completion: formData.estimated_completion || null,
        customer_notes: formData.customer_notes.trim() || null,
        internal_notes: formData.internal_notes.trim() || null,
        assigned_mechanic_id: formData.assigned_mechanic_id || null,
      };

      if (selectedJobCard) {
        const { error } = await supabase
          .from("job_cards")
          .update(jobCardData)
          .eq("id", selectedJobCard.id);

        if (error) throw error;
        toast({ title: "Success", description: "Job card updated." });
      } else {
        const { error } = await supabase
          .from("job_cards")
          .insert({ ...jobCardData, job_card_number: "" });

        if (error) throw error;
        toast({ title: "Success", description: "Job card created." });
      }

      setDialogOpen(false);
      fetchJobCards();
    } catch (error: any) {
      console.error("Error saving job card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save job card.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (cardId: string, newStatus: JobCardStatus) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "completed" || newStatus === "delivered") {
        updates.actual_completion = new Date().toISOString();
      }

      const { error } = await supabase
        .from("job_cards")
        .update(updates)
        .eq("id", cardId);

      if (error) throw error;
      
      toast({ title: "Status Updated", description: `Job card status changed to ${STATUS_CONFIG[newStatus].label}.` });
      fetchJobCards();
      
      if (selectedJobCard?.id === cardId) {
        setSelectedJobCard({ ...selectedJobCard, status: newStatus });
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const handleAddPart = async () => {
    if (!selectedJobCard || !selectedPartId || partQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a part and quantity.",
        variant: "destructive",
      });
      return;
    }

    const part = inventory.find((p) => p.id === selectedPartId);
    if (!part) return;

    if (partQuantity > part.quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${part.quantity} units available.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("job_card_parts")
        .insert({
          job_card_id: selectedJobCard.id,
          part_id: selectedPartId,
          quantity: partQuantity,
          unit_price: part.selling_price,
          total_price: part.selling_price * partQuantity,
        });

      if (error) throw error;

      // Update parts cost on job card
      const newPartsCost = jobCardParts.reduce((sum, p) => sum + p.total_price, 0) + (part.selling_price * partQuantity);
      await supabase
        .from("job_cards")
        .update({ parts_cost: newPartsCost })
        .eq("id", selectedJobCard.id);

      toast({ title: "Success", description: "Part added to job card." });
      setAddPartDialogOpen(false);
      setSelectedPartId("");
      setPartQuantity(1);
      fetchJobCardParts(selectedJobCard.id);
      fetchInventory();
      fetchJobCards();
    } catch (error: any) {
      console.error("Error adding part:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add part.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePart = async (partId: string) => {
    if (!selectedJobCard) return;

    try {
      const { error } = await supabase
        .from("job_card_parts")
        .delete()
        .eq("id", partId);

      if (error) throw error;

      toast({ title: "Success", description: "Part removed from job card." });
      fetchJobCardParts(selectedJobCard.id);
      fetchInventory();
      fetchJobCards();
    } catch (error: any) {
      console.error("Error removing part:", error);
      toast({
        title: "Error",
        description: "Failed to remove part.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: JobCardStatus) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === "pending" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === "in_progress" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === "completed" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === "delivered" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setStatusFilter(statusFilter === "delivered" ? "all" : "delivered")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Job Cards</CardTitle>
              <CardDescription>Manage service jobs and track progress</CardDescription>
            </div>
            <Button onClick={handleCreateJobCard} className="gap-2">
              <Plus className="w-4 h-4" />
              New Job Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by job #, customer, phone, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredJobCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{jobCards.length === 0 ? "No job cards yet. Create your first job card!" : "No job cards match your filters."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobCards.map((card) => (
                    <TableRow key={card.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewJobCard(card)}>
                      <TableCell className="font-mono font-medium text-primary">
                        {card.job_card_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{card.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{card.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{card.vehicle_make} {card.vehicle_model}</p>
                          <p className="text-sm text-muted-foreground">{card.vehicle_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{card.service_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(card.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewJobCard(card)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditJobCard(card)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJobCard ? "Edit Job Card" : "Create New Job Card"}</DialogTitle>
            <DialogDescription>
              {selectedJobCard ? "Update the job card details." : "Enter customer and vehicle information to create a new job card."}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
            </TabsList>
            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="e.g., Rajesh Kumar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="e.g., 9876543210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="e.g., customer@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_address">Address</Label>
                  <Input
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    placeholder="e.g., 123 Main Street"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="vehicle" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_make">Make *</Label>
                  <Input
                    id="vehicle_make"
                    value={formData.vehicle_make}
                    onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                    placeholder="e.g., Maruti Suzuki"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Model *</Label>
                  <Input
                    id="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                    placeholder="e.g., Swift"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                  <Input
                    id="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                    placeholder="e.g., MH02AB1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_year">Year</Label>
                  <Input
                    id="vehicle_year"
                    type="number"
                    value={formData.vehicle_year}
                    onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                    placeholder="e.g., 2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_color">Color</Label>
                  <Input
                    id="vehicle_color"
                    value={formData.vehicle_color}
                    onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                    placeholder="e.g., White"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="odometer_reading">Odometer (km)</Label>
                  <Input
                    id="odometer_reading"
                    type="number"
                    value={formData.odometer_reading}
                    onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                    placeholder="e.g., 45000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel_level">Fuel Level</Label>
                  <Select
                    value={formData.fuel_level}
                    onValueChange={(value) => setFormData({ ...formData, fuel_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Empty">Empty</SelectItem>
                      <SelectItem value="Quarter">Quarter</SelectItem>
                      <SelectItem value="Half">Half</SelectItem>
                      <SelectItem value="Three Quarter">Three Quarter</SelectItem>
                      <SelectItem value="Full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="service" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_mechanic">Assign Mechanic</Label>
                  <Select
                    value={formData.assigned_mechanic_id}
                    onValueChange={(value) => setFormData({ ...formData, assigned_mechanic_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mechanic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_description">Service Description</Label>
                <Textarea
                  id="service_description"
                  value={formData.service_description}
                  onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                  placeholder="Describe the work to be done..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost">Estimated Cost (₹)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    placeholder="e.g., 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labor_cost">Labor Cost (₹)</Label>
                  <Input
                    id="labor_cost"
                    type="number"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                    placeholder="e.g., 2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_completion">Est. Completion</Label>
                  <Input
                    id="estimated_completion"
                    type="datetime-local"
                    value={formData.estimated_completion}
                    onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_notes">Customer Notes</Label>
                  <Textarea
                    id="customer_notes"
                    value={formData.customer_notes}
                    onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                    placeholder="Notes from customer..."
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internal_notes">Internal Notes</Label>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Internal notes for staff..."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveJobCard} disabled={isSaving}>
              {isSaving ? "Saving..." : selectedJobCard ? "Update Job Card" : "Create Job Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Card Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedJobCard && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="font-mono text-primary">{selectedJobCard.job_card_number}</SheetTitle>
                  {getStatusBadge(selectedJobCard.status)}
                </div>
                <SheetDescription>
                  Created on {format(new Date(selectedJobCard.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status Update */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        const isActive = selectedJobCard.status === key;
                        return (
                          <Button
                            key={key}
                            size="sm"
                            variant={isActive ? "default" : "outline"}
                            className={`gap-1 ${isActive ? "" : config.color}`}
                            onClick={() => handleUpdateStatus(selectedJobCard.id, key as JobCardStatus)}
                            disabled={isActive}
                          >
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedJobCard.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <a href={`tel:${selectedJobCard.customer_phone}`} className="font-medium text-primary flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedJobCard.customer_phone}
                        </a>
                      </div>
                      {selectedJobCard.customer_email && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedJobCard.customer_email}</p>
                        </div>
                      )}
                      {selectedJobCard.customer_address && (
                        <div>
                          <p className="text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedJobCard.customer_address}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Info */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehicle Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vehicle</p>
                        <p className="font-medium">{selectedJobCard.vehicle_make} {selectedJobCard.vehicle_model} {selectedJobCard.vehicle_year && `(${selectedJobCard.vehicle_year})`}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Registration</p>
                        <p className="font-medium font-mono">{selectedJobCard.vehicle_number}</p>
                      </div>
                      {selectedJobCard.vehicle_color && (
                        <div>
                          <p className="text-muted-foreground">Color</p>
                          <p className="font-medium">{selectedJobCard.vehicle_color}</p>
                        </div>
                      )}
                      {selectedJobCard.odometer_reading && (
                        <div>
                          <p className="text-muted-foreground">Odometer</p>
                          <p className="font-medium">{selectedJobCard.odometer_reading.toLocaleString()} km</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Service Info */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Service Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Service Type</span>
                        <Badge variant="secondary">{selectedJobCard.service_type}</Badge>
                      </div>
                      {selectedJobCard.assigned_mechanic && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Assigned To</span>
                          <span className="font-medium">{selectedJobCard.assigned_mechanic.name}</span>
                        </div>
                      )}
                      {selectedJobCard.service_description && (
                        <div>
                          <p className="text-muted-foreground mb-1">Description</p>
                          <p className="bg-muted/50 p-2 rounded">{selectedJobCard.service_description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Parts Used */}
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Parts Used
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setAddPartDialogOpen(true)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add Part
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {jobCardParts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No parts added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {jobCardParts.map((part) => (
                          <div key={part.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                            <div>
                              <p className="font-medium">{part.spare_parts_inventory.part_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {part.quantity} × ₹{part.unit_price}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">₹{part.total_price}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleRemovePart(part.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cost Summary */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      Cost Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Labor Cost</span>
                        <span>₹{(selectedJobCard.labor_cost || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parts Cost</span>
                        <span>₹{jobCardParts.reduce((sum, p) => sum + p.total_price, 0).toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="text-primary">
                          ₹{((selectedJobCard.labor_cost || 0) + jobCardParts.reduce((sum, p) => sum + p.total_price, 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => handleEditJobCard(selectedJobCard)}>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Printer className="w-4 h-4" />
                    Print Invoice
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Part Dialog */}
      <Dialog open={addPartDialogOpen} onOpenChange={setAddPartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Part to Job Card</DialogTitle>
            <DialogDescription>
              Select a part from inventory to add to this job card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Part</Label>
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a part..." />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.part_name} - ₹{part.selling_price} (Stock: {part.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={partQuantity}
                onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            {selectedPartId && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-lg font-bold">
                  ₹{((inventory.find(p => p.id === selectedPartId)?.selling_price || 0) * partQuantity).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPartDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPart}>
              Add Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
