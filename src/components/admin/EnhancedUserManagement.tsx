import { useState, useEffect } from "react";
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
  Clock
} from "lucide-react";
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

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "customer" | "garage_owner" | "partner";
}

interface Profile {
  user_id: string;
  full_name: string | null;
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

export function EnhancedUserManagement() {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [partners, setPartners] = useState<PartnerAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "customer" | "garage_owner" | "partner">("admin");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [rolesResult, profilesResult, partnersResult] = await Promise.all([
        supabase.from("user_roles").select("*"),
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("partners").select("id, user_id, username, full_name, email, phone, status, kyc_status, created_at").order("created_at", { ascending: false })
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (partnersResult.error) throw partnersResult.error;

      setUserRoles(rolesResult.data || []);
      setProfiles(profilesResult.data || []);
      setPartners(partnersResult.data || []);
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

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to remove this role?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: "User role has been removed",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
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
    partner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  };

  const roleIcons = {
    admin: ShieldCheck,
    customer: Users,
    garage_owner: Shield,
    partner: Users,
  };

  const filteredRoles = userRoles.filter(role => {
    const userName = getUserName(role.user_id).toLowerCase();
    return userName.includes(searchQuery.toLowerCase()) || 
           role.role.includes(searchQuery.toLowerCase());
  });

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
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partners</p>
                <p className="text-2xl font-bold text-emerald-600">{partners.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-emerald-500" />
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
            <CardHeader>
              <CardTitle>User Roles ({filteredRoles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No user roles found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Change Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.map((role) => {
                        const Icon = roleIcons[role.role];
                        return (
                          <TableRow key={role.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <span className="font-medium">{getUserName(role.user_id)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {role.user_id.slice(0, 8)}...
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={roleColors[role.role]}>
                                {role.role.replace("_", " ")}
                              </Badge>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

        {/* Partner Accounts Tab */}
        <TabsContent value="partners" className="space-y-4">
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
                <Briefcase className="w-5 h-5 text-emerald-500" />
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
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <code className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-mono">
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
                            {partner.email ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{partner.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {partner.phone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                {partner.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
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
                          <TableCell className="text-sm text-muted-foreground">
                            {partner.created_at 
                              ? format(new Date(partner.created_at), "dd MMM yyyy")
                              : "-"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
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
