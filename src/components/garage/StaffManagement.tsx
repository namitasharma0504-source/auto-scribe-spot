import { useState, useEffect } from "react";
import { Plus, Users, Edit2, Trash2, Shield, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: "owner" | "manager" | "mechanic" | "receptionist";
  is_active: boolean;
  pin_code: string | null;
  created_at: string;
}

interface StaffManagementProps {
  garageId: string;
}

const STAFF_ROLES = [
  { value: "manager", label: "Manager", color: "bg-purple-100 text-purple-800" },
  { value: "mechanic", label: "Mechanic", color: "bg-blue-100 text-blue-800" },
  { value: "receptionist", label: "Receptionist", color: "bg-green-100 text-green-800" },
];

export function StaffManagement({ garageId }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "mechanic" as "manager" | "mechanic" | "receptionist",
    pin_code: "",
    is_active: true,
  });

  useEffect(() => {
    fetchStaff();
  }, [garageId]);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("garage_staff")
        .select("*")
        .eq("garage_id", garageId)
        .order("role", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setStaff((data || []) as StaffMember[]);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeStaffCount = staff.filter((s) => s.is_active).length;
  const mechanicCount = staff.filter((s) => s.role === "mechanic" && s.is_active).length;

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      role: "mechanic",
      pin_code: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormData({
      name: member.name,
      phone: member.phone || "",
      email: member.email || "",
      role: member.role === "owner" ? "manager" : member.role,
      pin_code: member.pin_code || "",
      is_active: member.is_active,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (member: StaffMember) => {
    setSelectedStaff(member);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const { error } = await supabase
        .from("garage_staff")
        .update({ is_active: !member.is_active })
        .eq("id", member.id);

      if (error) throw error;
      
      toast({
        title: member.is_active ? "Staff Deactivated" : "Staff Activated",
        description: `${member.name} has been ${member.is_active ? "deactivated" : "activated"}.`,
      });
      fetchStaff();
    } catch (error: any) {
      console.error("Error toggling staff status:", error);
      toast({
        title: "Error",
        description: "Failed to update staff status.",
        variant: "destructive",
      });
    }
  };

  const handleSaveStaff = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Staff name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const staffData = {
        garage_id: garageId,
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        role: formData.role,
        pin_code: formData.pin_code.trim() || null,
        is_active: formData.is_active,
      };

      if (selectedStaff) {
        const { error } = await supabase
          .from("garage_staff")
          .update(staffData)
          .eq("id", selectedStaff.id);

        if (error) throw error;
        toast({ title: "Success", description: "Staff member updated." });
      } else {
        const { error } = await supabase
          .from("garage_staff")
          .insert(staffData);

        if (error) throw error;
        toast({ title: "Success", description: "Staff member added." });
      }

      setDialogOpen(false);
      fetchStaff();
    } catch (error: any) {
      console.error("Error saving staff:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      const { error } = await supabase
        .from("garage_staff")
        .delete()
        .eq("id", selectedStaff.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Staff member removed." });
      setDeleteDialogOpen(false);
      fetchStaff();
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = STAFF_ROLES.find((r) => r.value === role);
    if (role === "owner") {
      return <Badge className="bg-amber-100 text-amber-800">Owner</Badge>;
    }
    return roleConfig ? (
      <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
    ) : (
      <Badge variant="secondary">{role}</Badge>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold">{activeStaffCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mechanics</p>
                <p className="text-2xl font-bold">{mechanicCount}</p>
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
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Manage your garage team members and their access</CardDescription>
            </div>
            <Button onClick={handleAddStaff} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No staff members added yet. Add your first team member!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id} className={!member.is_active ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.phone || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={member.is_active}
                            onCheckedChange={() => handleToggleActive(member)}
                            disabled={member.role === "owner"}
                          />
                          <span className={member.is_active ? "text-green-600" : "text-muted-foreground"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {member.role !== "owner" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditStaff(member)}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(member)}
                                className="text-destructive hover:text-destructive"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
            <DialogDescription>
              {selectedStaff ? "Update the staff member details." : "Enter the details of the new team member."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff_name">Name *</Label>
              <Input
                id="staff_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ramesh Kumar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff_role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "manager" | "mechanic" | "receptionist") => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff_phone">Phone</Label>
                <Input
                  id="staff_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff_email">Email</Label>
                <Input
                  id="staff_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., staff@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff_pin">PIN Code (for quick access)</Label>
              <Input
                id="staff_pin"
                type="password"
                maxLength={6}
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                placeholder="4-6 digit PIN"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="staff_active">Active Status</Label>
              <Switch
                id="staff_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStaff} disabled={isSaving}>
              {isSaving ? "Saving..." : selectedStaff ? "Update" : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedStaff?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
