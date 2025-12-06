import { useState, useEffect } from "react";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  Search, 
  RefreshCw,
  UserPlus,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "customer" | "garage_owner";
  email?: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
}

export function UserManagement() {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "customer" | "garage_owner">("admin");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch profiles for names
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      if (profilesError) throw profilesError;

      setUserRoles(rolesData || []);
      setProfiles(profilesData || []);
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

  const handleAddRole = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a user email",
        variant: "destructive",
      });
      return;
    }

    try {
      // Note: In a real app, you'd need to look up the user by email
      // For now, we'll show a message about this limitation
      toast({
        title: "Manual Assignment Required",
        description: `To assign ${newUserRole} role to ${newUserEmail}, use the backend database directly. User ID is required.`,
      });
      setIsAddDialogOpen(false);
      setNewUserEmail("");
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
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

  const roleColors = {
    admin: "bg-red-500/10 text-red-600 border-red-500/30",
    customer: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    garage_owner: "bg-green-500/10 text-green-600 border-green-500/30",
  };

  const roleIcons = {
    admin: ShieldCheck,
    customer: Users,
    garage_owner: Shield,
  };

  const filteredRoles = userRoles.filter(role => {
    const userName = getUserName(role.user_id).toLowerCase();
    return userName.includes(searchQuery.toLowerCase()) || 
           role.role.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign User Role</DialogTitle>
                <DialogDescription>
                  Enter the user's email and select a role to assign.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
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
                <Button onClick={handleAddRole}>Assign Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-sm text-muted-foreground">Customers with Roles</p>
                <p className="text-2xl font-bold">{userRoles.filter(r => r.role === "customer").length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
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
            <div className="space-y-3">
              {filteredRoles.map((role) => {
                const Icon = roleIcons[role.role];
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{getUserName(role.user_id)}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          ID: {role.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={roleColors[role.role]}>
                        {role.role.replace("_", " ")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">How to Assign Admin Role</h3>
          <p className="text-sm text-muted-foreground mb-4">
            To make a user an admin, you need to add their user ID to the user_roles table:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
            <li>Go to the backend database (click "View Backend" below)</li>
            <li>Navigate to the <strong>user_roles</strong> table</li>
            <li>Add a new row with the user's <strong>user_id</strong> and set role to <strong>admin</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
