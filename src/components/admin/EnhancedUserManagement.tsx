import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  Search, 
  RefreshCw,
  UserPlus,
  Trash2,
  Key,
  Mail,
  Eye,
  EyeOff,
  Phone,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  Calendar,
  TrendingUp,
  Edit,
  Power,
  PowerOff,
  MapPin,
  Building,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { indiaStates } from "@/data/indiaLocations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

type SortField = "name" | "email" | "role" | "status" | "state" | "date";
type SortDirection = "asc" | "desc";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "customer" | "garage_owner" | "partner";
}

interface Profile {
  user_id: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
  state: string | null;
}

interface UserEmail {
  user_id: string;
  email: string;
}

interface UserPhone {
  user_id: string;
  phone: string;
}

interface PartnerAccount {
  id: string;
  user_id: string | null;
  username: string;
  full_name: string;
  email: string | null;
  phone: string;
  status: string | null;
  kyc_status: string | null;
  created_at: string | null;
}

interface PartnerEarnings {
  partner_id: string;
  total_earned: number;
  pending_payout: number;
}

export function EnhancedUserManagement() {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userEmails, setUserEmails] = useState<UserEmail[]>([]);
  const [userPhones, setUserPhones] = useState<UserPhone[]>([]);
  const [partners, setPartners] = useState<PartnerAccount[]>([]);
  const [partnerEarnings, setPartnerEarnings] = useState<PartnerEarnings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Edit user dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ userId: string; name: string; email: string | null } | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // New user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserState, setNewUserState] = useState("");
  const [newUserCity, setNewUserCity] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "customer" | "garage_owner" | "partner">("admin");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [rolesResult, profilesResult, partnersResult, listingsResult, garageOwnersResult] = await Promise.all([
        supabase.from("user_roles").select("*"),
        supabase.from("profiles").select("user_id, full_name, created_at, is_active, state"),
        supabase.from("partners").select("id, user_id, username, full_name, email, phone, status, kyc_status, created_at").order("created_at", { ascending: false }),
        supabase.from("partner_listings").select("partner_id, total_earning, payout_status, status"),
        supabase.from("garage_owners").select("user_id, contact_phone")
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (partnersResult.error) throw partnersResult.error;
      if (listingsResult.error) throw listingsResult.error;
      if (garageOwnersResult.error) throw garageOwnersResult.error;

      // Build phone map from multiple sources
      const phoneMap = new Map<string, string>();
      
      // From garage_owners
      (garageOwnersResult.data || []).forEach((owner) => {
        if (owner.user_id && owner.contact_phone) {
          phoneMap.set(owner.user_id, owner.contact_phone);
        }
      });
      
      // From partners (user_id based)
      (partnersResult.data || []).forEach((partner) => {
        if (partner.user_id && partner.phone) {
          phoneMap.set(partner.user_id, partner.phone);
        }
      });
      
      setUserPhones(Array.from(phoneMap.entries()).map(([user_id, phone]) => ({ user_id, phone })));

      setUserRoles(rolesResult.data || []);
      setProfiles(profilesResult.data || []);
      setPartners(partnersResult.data || []);
      
      // Fetch emails from auth.users via edge function (most reliable source)
      const userIds = (rolesResult.data || []).map(r => r.user_id);
      
      try {
        const { data: authData, error: authError } = await supabase.functions.invoke("get-user-emails", {
          body: { user_ids: userIds },
        });
        
        if (!authError && authData?.users) {
          // Use auth.users emails as primary source
          const authEmails: UserEmail[] = authData.users.map((u: { user_id: string; email: string }) => ({
            user_id: u.user_id,
            email: u.email,
          }));
          setUserEmails(authEmails);
        } else {
          // Fallback: Try to get emails from garage_claim_requests and partners
          console.log("Falling back to claim/partner emails");
          const { data: claimsData } = await supabase
            .from("garage_claim_requests")
            .select("claimant_user_id, claimant_email")
            .in("claimant_user_id", userIds);
          
          const partnersData = partnersResult.data || [];
          const partnerEmails: UserEmail[] = partnersData
            .filter(p => p.user_id && p.email)
            .map(p => ({ user_id: p.user_id!, email: p.email! }));
          
          const claimEmails: UserEmail[] = (claimsData || [])
            .filter(c => c.claimant_email)
            .map(c => ({ user_id: c.claimant_user_id, email: c.claimant_email }));
          
          const emailMap = new Map<string, string>();
          partnerEmails.forEach(e => emailMap.set(e.user_id, e.email));
          claimEmails.forEach(e => emailMap.set(e.user_id, e.email));
          
          setUserEmails(Array.from(emailMap.entries()).map(([user_id, email]) => ({ user_id, email })));
        }
      } catch (emailFetchError) {
        console.error("Error fetching emails:", emailFetchError);
      }

      // Calculate earnings per partner
      const earningsMap = new Map<string, { total: number; pending: number }>();
      (listingsResult.data || []).forEach((listing) => {
        if (!listing.partner_id) return;
        const current = earningsMap.get(listing.partner_id) || { total: 0, pending: 0 };
        const earning = listing.total_earning || 0;
        
        // Count approved listings for total earned
        if (listing.status === "approved") {
          current.total += earning;
          // Pending payout = approved but not yet paid
          if (listing.payout_status !== "paid") {
            current.pending += earning;
          }
        }
        earningsMap.set(listing.partner_id, current);
      });

      const earnings: PartnerEarnings[] = Array.from(earningsMap.entries()).map(([partner_id, data]) => ({
        partner_id,
        total_earned: data.total,
        pending_payout: data.pending,
      }));
      setPartnerEarnings(earnings);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getUserName = (userId: string): string => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.full_name || "Unknown User";
  };

  const getUserEmail = (userId: string): string | null => {
    const emailEntry = userEmails.find(e => e.user_id === userId);
    return emailEntry?.email || null;
  };

  const getUserCreatedAt = (userId: string): string | null => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.created_at || null;
  };

  const getUserIsActive = (userId: string): boolean => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.is_active ?? true;
  };

  const getUserState = (userId: string): string | null => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.state || null;
  };

  const getUserPhone = (userId: string): string | null => {
    const phoneEntry = userPhones.find(p => p.user_id === userId);
    return phoneEntry?.phone || null;
  };

  // Generate role-based unique ID
  const getRoleBasedId = (userId: string, role: string): string => {
    // Take first 6 chars of UUID and make alphanumeric uppercase
    const shortId = userId.replace(/-/g, "").substring(0, 6).toUpperCase();
    
    switch (role) {
      case "garage_owner":
        return `GID-${shortId}`;
      case "customer":
        return `CID-${shortId}`;
      case "partner":
        return `PID-${shortId}`;
      case "admin":
        return `AID-${shortId}`;
      default:
        return `UID-${shortId}`;
    }
  };

  const handleToggleAccess = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Access Disabled" : "Access Enabled",
        description: currentStatus 
          ? "User can no longer access the platform" 
          : "User can now access the platform",
      });

      // Update local state
      setProfiles(prev => prev.map(p => 
        p.user_id === userId ? { ...p, is_active: !currentStatus } : p
      ));
    } catch (error: any) {
      console.error("Error toggling access:", error);
      toast({
        title: "Error",
        description: "Failed to update access status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (userId: string) => {
    const name = getUserName(userId);
    const email = getUserEmail(userId);
    setEditingUser({ userId, name, email });
    setEditName(name === "Unknown User" ? "" : name);
    setIsEditDialogOpen(true);
  };

  const handleSaveUserDetails = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName.trim() || null })
        .eq("user_id", editingUser.userId);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: "User details have been saved",
      });

      // Update local state
      setProfiles(prev => prev.map(p => 
        p.user_id === editingUser.userId ? { ...p, full_name: editName.trim() || null } : p
      ));
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setEditName("");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast({
        title: "Missing Fields",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Call the edge function to create user
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          fullName: newUserName || null,
          state: newUserState || null,
          role: newUserRole,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User Created",
        description: `User ${newUserEmail} has been created with ${newUserRole} role`,
      });

      setIsAddDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserState("");
      setNewUserCity("");
      setNewUserRole("admin");
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, userId: string) => {
    if (!confirm("Are you sure you want to completely delete this user? This will remove their account and allow the email to be used for new signups.")) return;

    try {
      // Call edge function to completely delete user (including from auth.users)
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: userId },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User Deleted",
        description: data?.message || "User has been completely removed. Email can be used again.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (roleId: string, userId: string, newRole: "admin" | "customer" | "garage_owner" | "partner") => {
    try {
      // Delete existing role and create new one
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: "Role Updated",
        description: `User role has been changed to ${newRole}`,
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: "Failed to change role",
        variant: "destructive",
      });
    }
  };

  const roleColors = {
    admin: "bg-red-500/10 text-red-600 border-red-500/30",
    customer: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    garage_owner: "bg-green-500/10 text-green-600 border-green-500/30",
    partner: "bg-purple-100 text-purple-600 border-purple-300",
  };

  const roleIcons = {
    admin: ShieldCheck,
    customer: Users,
    garage_owner: Shield,
    partner: Users,
  };

  // Helper function to toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // Filter and sort roles
  const sortedAndFilteredRoles = useMemo(() => {
    // First filter
    const filtered = userRoles.filter(role => {
      const userName = getUserName(role.user_id).toLowerCase();
      const email = (getUserEmail(role.user_id) || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return userName.includes(query) || 
             role.role.includes(query) ||
             email.includes(query);
    });

    // Then sort
    return [...filtered].sort((a, b) => {
      let aValue: string | number | boolean = "";
      let bValue: string | number | boolean = "";

      switch (sortField) {
        case "name":
          aValue = getUserName(a.user_id).toLowerCase();
          bValue = getUserName(b.user_id).toLowerCase();
          break;
        case "email":
          aValue = (getUserEmail(a.user_id) || "").toLowerCase();
          bValue = (getUserEmail(b.user_id) || "").toLowerCase();
          break;
        case "role":
          aValue = a.role;
          bValue = b.role;
          break;
        case "status":
          aValue = getUserIsActive(a.user_id) ? "active" : "disabled";
          bValue = getUserIsActive(b.user_id) ? "active" : "disabled";
          break;
        case "state":
          aValue = (getUserState(a.user_id) || "").toLowerCase();
          bValue = (getUserState(b.user_id) || "").toLowerCase();
          break;
        case "date":
          aValue = getUserCreatedAt(a.user_id) || "";
          bValue = getUserCreatedAt(b.user_id) || "";
          break;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [userRoles, searchQuery, sortField, sortDirection, profiles, userEmails]);

  // Pagination for roles
  const rolesPagination = usePagination({ data: sortedAndFilteredRoles, itemsPerPage: 10 });

  const filteredPartners = partners.filter(partner => {
    const query = partnerSearchQuery.toLowerCase();
    return partner.full_name.toLowerCase().includes(query) ||
           partner.username.toLowerCase().includes(query) ||
           (partner.email || "").toLowerCase().includes(query) ||
           partner.id.toLowerCase().includes(query);
  });

  const kycStatusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    submitted: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    verified: "bg-green-500/10 text-green-600 border-green-500/30",
    rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-500/30",
    inactive: "bg-gray-500/10 text-gray-600 border-gray-500/30",
    suspended: "bg-red-500/10 text-red-600 border-red-500/30",
  };

  const getPartnerEarnings = (partnerId: string): PartnerEarnings => {
    return partnerEarnings.find((e) => e.partner_id === partnerId) || {
      partner_id: partnerId,
      total_earned: 0,
      pending_payout: 0,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Admins</p>
                <p className="text-2xl font-bold">{userRoles.filter(r => r.role === "admin").length}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partners</p>
                <p className="text-2xl font-bold text-purple-600">{partners.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Garage Owners</p>
                <p className="text-2xl font-bold">{userRoles.filter(r => r.role === "garage_owner").length}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold">{userRoles.filter(r => r.role === "customer").length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="roles" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              User Roles
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Partner Accounts ({partners.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUsers} size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with a specific role
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name (Optional)</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select value={newUserState} onValueChange={setNewUserState}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Select State" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {indiaStates.map((state) => (
                            <SelectItem key={state.value} value={state.label}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="city"
                          placeholder="Enter city"
                          value={newUserCity}
                          onChange={(e) => setNewUserCity(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="garage_owner">Garage Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User Details</DialogTitle>
                  <DialogDescription>
                    Update the user's name and other details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="edit-name"
                        placeholder="Enter full name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {editingUser?.email && (
                    <div className="space-y-2">
                      <Label>Email (Read-only)</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{editingUser.email}</span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUserDetails} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* User Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Roles ({sortedAndFilteredRoles.length})</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {rolesPagination.startIndex}–{rolesPagination.endIndex} of {rolesPagination.totalItems}</span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              ) : sortedAndFilteredRoles.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No user roles found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 -ml-3 font-medium hover:bg-muted"
                              onClick={() => toggleSort("name")}
                            >
                              User
                              {getSortIcon("name")}
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 -ml-3 font-medium hover:bg-muted"
                              onClick={() => toggleSort("email")}
                            >
                              Email ID
                              {getSortIcon("email")}
                            </Button>
                          </TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 -ml-3 font-medium hover:bg-muted"
                              onClick={() => toggleSort("role")}
                            >
                              Current Role
                              {getSortIcon("role")}
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 -ml-3 font-medium hover:bg-muted"
                              onClick={() => toggleSort("state")}
                            >
                              State
                              {getSortIcon("state")}
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 -ml-3 font-medium hover:bg-muted"
                              onClick={() => toggleSort("status")}
                            >
                              Status
                              {getSortIcon("status")}
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 -ml-3 font-medium hover:bg-muted"
                              onClick={() => toggleSort("date")}
                            >
                              Created
                              {getSortIcon("date")}
                            </Button>
                          </TableHead>
                          <TableHead>Change Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rolesPagination.paginatedData.map((role) => {
                          const Icon = roleIcons[role.role];
                          const email = getUserEmail(role.user_id);
                          const createdAt = getUserCreatedAt(role.user_id);
                          const isActive = getUserIsActive(role.user_id);
                          const userState = getUserState(role.user_id);
                          return (
                            <TableRow key={role.id} className={!isActive ? "opacity-60 bg-muted/30" : ""}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <span className="font-medium">{getUserName(role.user_id)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {email ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                    <span className="truncate max-w-[160px]">{email}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {getUserPhone(role.user_id) ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    <span>{getUserPhone(role.user_id)}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <code className={cn(
                                  "text-xs px-2 py-1 rounded font-mono",
                                  role.role === "garage_owner" && "bg-green-100 text-green-700",
                                  role.role === "customer" && "bg-blue-100 text-blue-700",
                                  role.role === "partner" && "bg-purple-100 text-purple-700",
                                  role.role === "admin" && "bg-red-100 text-red-700"
                                )}>
                                  {getRoleBasedId(role.user_id, role.role)}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={roleColors[role.role]}>
                                  {role.role.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {userState ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <span className="truncate max-w-[100px]">{userState}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={isActive 
                                    ? "bg-green-500/10 text-green-600 border-green-500/30" 
                                    : "bg-red-500/10 text-red-600 border-red-500/30"
                                  }
                                >
                                  {isActive ? "Active" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {createdAt ? (
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(createdAt), "dd MMM yyyy")}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={role.role}
                                  onValueChange={(newRole) => handleChangeRole(role.id, role.user_id, newRole as any)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="partner">Partner</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="garage_owner">Garage Owner</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => openEditDialog(role.user_id)}
                                    title="Edit user details"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={isActive 
                                      ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                                      : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                    }
                                    onClick={() => handleToggleAccess(role.user_id, isActive)}
                                    title={isActive ? "Disable access" : "Enable access"}
                                  >
                                    {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteRole(role.id, role.user_id)}
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {rolesPagination.totalPages > 1 && (
                    <PaginationControls
                      currentPage={rolesPagination.currentPage}
                      totalPages={rolesPagination.totalPages}
                      startIndex={rolesPagination.startIndex}
                      endIndex={rolesPagination.endIndex}
                      totalItems={rolesPagination.totalItems}
                      itemsPerPage={rolesPagination.itemsPerPage}
                      onPageChange={rolesPagination.goToPage}
                      onItemsPerPageChange={rolesPagination.setItemsPerPage}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partner Accounts Tab */}
        <TabsContent value="partners" className="space-y-4">
          {/* Platform-Wide Earnings Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Partners</p>
                    <p className="text-2xl font-bold text-purple-600">{partners.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Platform-Wide Earnings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(partnerEarnings.reduce((sum, e) => sum + e.total_earned, 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payouts</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(partnerEarnings.reduce((sum, e) => sum + e.pending_payout, 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search partners by name, email, ID..."
              value={partnerSearchQuery}
              onChange={(e) => setPartnerSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-500" />
                Partner Accounts ({filteredPartners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading partners...</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No partner accounts found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create a user with "Partner" role to add partner accounts
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Total Earned
                          </div>
                        </TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </div>
                        </TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => {
                        const earnings = getPartnerEarnings(partner.id);
                        return (
                          <TableRow key={partner.id}>
                            <TableCell>
                              <code className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded font-mono">
                                {partner.id}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{partner.full_name}</p>
                                <p className="text-xs text-muted-foreground">@{partner.username}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {partner.email && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                    <span className="truncate max-w-[120px]">{partner.email}</span>
                                  </div>
                                )}
                                {partner.phone && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    {partner.phone}
                                  </div>
                                )}
                                {!partner.email && !partner.phone && (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={statusColors[partner.status || "inactive"]}
                              >
                                {partner.status === "active" && <CheckCircle className="w-3 h-3 mr-1" />}
                                {partner.status === "inactive" && <XCircle className="w-3 h-3 mr-1" />}
                                {partner.status || "inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={kycStatusColors[partner.kyc_status || "pending"]}
                              >
                                {partner.kyc_status === "verified" && <CheckCircle className="w-3 h-3 mr-1" />}
                                {partner.kyc_status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                {partner.kyc_status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <IndianRupee className="w-3 h-3 text-purple-500" />
                                <span className={`font-semibold ${earnings.total_earned > 0 ? "text-purple-600" : "text-muted-foreground"}`}>
                                  {earnings.total_earned > 0 
                                    ? formatCurrency(earnings.total_earned).replace("₹", "")
                                    : "0"
                                  }
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {earnings.pending_payout > 0 ? (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                  <IndianRupee className="w-3 h-3 mr-0.5" />
                                  {formatCurrency(earnings.pending_payout).replace("₹", "")}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {partner.created_at 
                                ? format(new Date(partner.created_at), "dd MMM yyyy")
                                : "-"
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
