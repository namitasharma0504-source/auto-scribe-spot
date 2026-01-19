import { useState, useEffect } from "react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  MessageSquare,
  Calendar,
  Eye,
  Video,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface PartnerApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  state: string;
  city: string | null;
  education: string;
  occupation: string | null;
  why_join: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  webinar_slot: string | null;
  webinar_booked_at: string | null;
  attendance: boolean | null;
  approved_partner: boolean | null;
}

const WEBINAR_SLOTS = [
  { id: "2026-01-24", label: "Saturday, 24th January 2026, 4-5 PM" },
  { id: "2026-01-25", label: "Sunday, 25th January 2026, 4-5 PM" },
];

export const PartnerApplicationsManagement = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingWebinar, setIsEditingWebinar] = useState(false);
  const [editWebinarSlot, setEditWebinarSlot] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load partner applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: "approved" | "rejected") => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: newStatus === "approved" ? "Application Approved" : "Application Rejected",
        description: `The partner application has been ${newStatus}.`,
      });

      setSelectedApplication(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckboxUpdate = async (
    id: string, 
    field: "attendance" | "approved_partner", 
    value: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, [field]: value } : app
        )
      );

      toast({
        title: "Updated",
        description: `${field === "attendance" ? "Attendance" : "Approved Partner"} status updated.`,
      });
    } catch (error: any) {
      console.error("Error updating checkbox:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleWebinarUpdate = async (id: string, newSlot: string | null) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({ 
          webinar_slot: newSlot,
          webinar_booked_at: newSlot ? new Date().toISOString() : null
        })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { 
            ...app, 
            webinar_slot: newSlot,
            webinar_booked_at: newSlot ? new Date().toISOString() : null
          } : app
        )
      );

      // Update selected application
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication({
          ...selectedApplication,
          webinar_slot: newSlot,
          webinar_booked_at: newSlot ? new Date().toISOString() : null
        });
      }

      setIsEditingWebinar(false);
      setEditWebinarSlot(null);

      toast({
        title: "Webinar Updated",
        description: newSlot 
          ? `Webinar date updated to ${WEBINAR_SLOTS.find(s => s.id === newSlot)?.label || newSlot}`
          : "Webinar booking removed",
      });
    } catch (error: any) {
      console.error("Error updating webinar:", error);
      toast({
        title: "Error",
        description: "Failed to update webinar date",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const filteredApplications = applications.filter(app =>
    app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.phone.includes(searchQuery) ||
    app.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingApplications = filteredApplications.filter(a => a.status === "pending");
  const approvedApplications = filteredApplications.filter(a => a.status === "approved");
  const rejectedApplications = filteredApplications.filter(a => a.status === "rejected");

  // Pagination for each tab
  const pendingPagination = usePagination({ data: pendingApplications, itemsPerPage: 10 });
  const approvedPagination = usePagination({ data: approvedApplications, itemsPerPage: 10 });
  const rejectedPagination = usePagination({ data: rejectedApplications, itemsPerPage: 10 });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  const ApplicationCard = ({ application }: { application: PartnerApplication }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{application.full_name}</h3>
              {getStatusBadge(application.status)}
            </div>
            
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{application.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{application.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{application.city ? `${application.city}, ${application.state}` : application.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(application.created_at), "dd MMM yyyy, h:mm a")}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <GraduationCap className="w-3 h-3" />
                {application.education}
              </Badge>
              {application.occupation && (
                <Badge variant="outline" className="gap-1">
                  <Briefcase className="w-3 h-3" />
                  {application.occupation}
                </Badge>
              )}
              {application.webinar_slot ? (
                <Badge className="gap-1 bg-purple-500/10 text-purple-600 border-purple-500/30">
                  <Video className="w-3 h-3" />
                  Webinar: {application.webinar_slot === "2026-01-24" ? "24 Jan" : "25 Jan"}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Video className="w-3 h-3" />
                  No webinar booked
                </Badge>
              )}
            </div>

            {/* Admin Checkboxes */}
            <div className="flex flex-wrap gap-6 pt-2 border-t mt-2">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  id={`attendance-${application.id}`}
                  checked={application.attendance || false}
                  onCheckedChange={(checked) => 
                    handleCheckboxUpdate(application.id, "attendance", checked as boolean)
                  }
                />
                <label 
                  htmlFor={`attendance-${application.id}`}
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Attendance
                </label>
              </div>
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  id={`approved-partner-${application.id}`}
                  checked={application.approved_partner || false}
                  onCheckedChange={(checked) => 
                    handleCheckboxUpdate(application.id, "approved_partner", checked as boolean)
                  }
                />
                <label 
                  htmlFor={`approved-partner-${application.id}`}
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Approved Partner
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedApplication(application);
                setAdminNotes(application.admin_notes || "");
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            {application.status === "pending" && (
              <>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setSelectedApplication(application);
                    setAdminNotes(application.admin_notes || "");
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Review
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchApplications} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : pendingApplications.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPagination.paginatedData.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
              <PaginationControls
                currentPage={pendingPagination.currentPage}
                totalPages={pendingPagination.totalPages}
                startIndex={pendingPagination.startIndex}
                endIndex={pendingPagination.endIndex}
                totalItems={pendingPagination.totalItems}
                itemsPerPage={pendingPagination.itemsPerPage}
                onPageChange={pendingPagination.goToPage}
                onItemsPerPageChange={pendingPagination.setItemsPerPage}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedApplications.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedPagination.paginatedData.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
              <PaginationControls
                currentPage={approvedPagination.currentPage}
                totalPages={approvedPagination.totalPages}
                startIndex={approvedPagination.startIndex}
                endIndex={approvedPagination.endIndex}
                totalItems={approvedPagination.totalItems}
                itemsPerPage={approvedPagination.itemsPerPage}
                onPageChange={approvedPagination.goToPage}
                onItemsPerPageChange={approvedPagination.setItemsPerPage}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedApplications.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedPagination.paginatedData.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
              <PaginationControls
                currentPage={rejectedPagination.currentPage}
                totalPages={rejectedPagination.totalPages}
                startIndex={rejectedPagination.startIndex}
                endIndex={rejectedPagination.endIndex}
                totalItems={rejectedPagination.totalItems}
                itemsPerPage={rejectedPagination.itemsPerPage}
                onPageChange={rejectedPagination.goToPage}
                onItemsPerPageChange={rejectedPagination.setItemsPerPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Partner Application
            </DialogTitle>
            <DialogDescription>
              Review application details and take action
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              {/* Applicant Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{selectedApplication.full_name}</h3>
                  {getStatusBadge(selectedApplication.status)}
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedApplication.email}`} className="text-primary hover:underline">
                      {selectedApplication.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedApplication.phone}`} className="text-primary hover:underline">
                      {selectedApplication.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedApplication.city ? `${selectedApplication.city}, ${selectedApplication.state}` : selectedApplication.state}</span>
                  </div>
                </div>
              </div>

              {/* Education & Occupation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <GraduationCap className="w-3 h-3" />
                    Education
                  </p>
                  <p className="font-medium text-sm">{selectedApplication.education}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Briefcase className="w-3 h-3" />
                    Occupation
                  </p>
                  <p className="font-medium text-sm">{selectedApplication.occupation || "Not specified"}</p>
                </div>
              </div>

              {/* Why Join */}
              <div className="p-3 bg-accent/30 rounded-lg">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3 h-3" />
                  Why they want to join
                </p>
                <p className="text-sm">{selectedApplication.why_join}</p>
              </div>

              {/* Webinar Booking */}
              <div className={`p-3 rounded-lg ${selectedApplication.webinar_slot ? "bg-purple-500/10 border border-purple-500/30" : "bg-muted/50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Webinar Booking
                  </p>
                  {selectedApplication.status === "approved" && !isEditingWebinar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setIsEditingWebinar(true);
                        setEditWebinarSlot(selectedApplication.webinar_slot);
                      }}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                
                {isEditingWebinar && selectedApplication.status === "approved" ? (
                  <div className="space-y-2">
                    <Select
                      value={editWebinarSlot || "none"}
                      onValueChange={(value) => setEditWebinarSlot(value === "none" ? null : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select webinar date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No webinar</SelectItem>
                        {WEBINAR_SLOTS.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleWebinarUpdate(selectedApplication.id, editWebinarSlot)}
                        disabled={isProcessing}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingWebinar(false);
                          setEditWebinarSlot(null);
                        }}
                        disabled={isProcessing}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : selectedApplication.webinar_slot ? (
                  <div>
                    <p className="font-medium text-sm text-purple-600">
                      {WEBINAR_SLOTS.find(s => s.id === selectedApplication.webinar_slot)?.label || selectedApplication.webinar_slot}
                    </p>
                    {selectedApplication.webinar_booked_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Booked on {format(new Date(selectedApplication.webinar_booked_at), "dd MMM yyyy, h:mm a")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not booked yet</p>
                )}
              </div>

              {/* Application Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Applied on {format(new Date(selectedApplication.created_at), "dd MMM yyyy, h:mm a")}
              </div>

              {/* Admin Checkboxes in Dialog */}
              <div className="p-3 bg-muted/30 rounded-lg border">
                <p className="text-sm font-medium mb-3">Admin Tracking</p>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`dialog-attendance-${selectedApplication.id}`}
                      checked={selectedApplication.attendance || false}
                      onCheckedChange={(checked) => {
                        handleCheckboxUpdate(selectedApplication.id, "attendance", checked as boolean);
                        setSelectedApplication({
                          ...selectedApplication,
                          attendance: checked as boolean
                        });
                      }}
                    />
                    <label 
                      htmlFor={`dialog-attendance-${selectedApplication.id}`}
                      className="text-sm font-medium cursor-pointer select-none"
                    >
                      Attendance
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`dialog-approved-partner-${selectedApplication.id}`}
                      checked={selectedApplication.approved_partner || false}
                      onCheckedChange={(checked) => {
                        handleCheckboxUpdate(selectedApplication.id, "approved_partner", checked as boolean);
                        setSelectedApplication({
                          ...selectedApplication,
                          approved_partner: checked as boolean
                        });
                      }}
                    />
                    <label 
                      htmlFor={`dialog-approved-partner-${selectedApplication.id}`}
                      className="text-sm font-medium cursor-pointer select-none"
                    >
                      Approved Partner
                    </label>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder="Add internal notes about this application..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              {selectedApplication.status === "pending" && (
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                    onClick={() => handleStatusUpdate(selectedApplication.id, "rejected")}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate(selectedApplication.id, "approved")}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </DialogFooter>
              )}

              {selectedApplication.status !== "pending" && selectedApplication.reviewed_at && (
                <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                  Reviewed on {format(new Date(selectedApplication.reviewed_at), "dd MMM yyyy, h:mm a")}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
