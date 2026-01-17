import { useState, useEffect, useRef, useMemo } from "react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import {
  Building2, 
  Search, 
  RefreshCw,
  Upload,
  Download,
  Eye,
  Trash2,
  MapPin,
  Phone,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  User,
  Store,
  Users,
  Settings,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { GarageAllReviews } from "./GarageAllReviews";
import { GarageManagementSheet } from "./GarageManagementSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Garage {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
  is_certified: boolean | null;
  is_recommended: boolean | null;
  is_approved: boolean | null;
  has_discounts: boolean | null;
  walk_in_welcome: boolean | null;
  response_time: string | null;
  services: string[] | null;
  location_link: string | null;
  photo_url: string | null;
  submitted_by: string | null;
  listing_type: string | null;
  partner_id: string | null;
  slug: string | null;
  created_at: string;
  submitter_email?: string | null;
  owner_id?: string | null;
  gin?: string | null;
}

type SortField = "name" | "created_at" | "city" | "rating";
type SortDirection = "asc" | "desc";

interface Partner {
  id: string;
  full_name: string;
  username: string;
}

interface GarageOwner {
  id: string;
  user_id: string;
  garage_id: string | null;
  business_name: string | null;
  contact_phone: string | null;
  subscription_active: boolean;
  signup_date: string | null;
  listing_date: string | null;
  subscription_date: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function GarageManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [garageOwners, setGarageOwners] = useState<GarageOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Subscription dialog state
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [subscriptionOwner, setSubscriptionOwner] = useState<GarageOwner | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date | undefined>(undefined);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | undefined>(undefined);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);

  useEffect(() => {
    fetchGarages();
    fetchPartners();
    fetchGarageOwners();
  }, []);

  const fetchGarageOwners = async () => {
    try {
      const { data, error } = await supabase
        .from("garage_owners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGarageOwners(data || []);
    } catch (error: any) {
      console.error("Error fetching garage owners:", error);
    }
  };

  const getOwnerForGarage = (garageId: string): GarageOwner | null => {
    return garageOwners.find(o => o.garage_id === garageId) || null;
  };

  const handleOpenSubscriptionDialog = (owner: GarageOwner, isActivating: boolean) => {
    setSubscriptionOwner(owner);
    if (isActivating) {
      // Default to today and 1 year from now
      const today = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      setSubscriptionStartDate(today);
      setSubscriptionEndDate(oneYearLater);
    } else {
      // For deactivation, use existing dates if available
      setSubscriptionStartDate(owner.subscription_date ? new Date(owner.subscription_date) : undefined);
      setSubscriptionEndDate(owner.subscription_end_date ? new Date(owner.subscription_end_date) : undefined);
    }
    setIsSubscriptionDialogOpen(true);
  };

  const handleSubscriptionUpdate = async (activate: boolean) => {
    if (!subscriptionOwner) return;
    
    setIsUpdatingSubscription(true);
    try {
      const updateData: any = {
        subscription_active: activate,
        updated_at: new Date().toISOString(),
      };

      if (activate && subscriptionStartDate && subscriptionEndDate) {
        updateData.subscription_date = subscriptionStartDate.toISOString();
        updateData.subscription_end_date = subscriptionEndDate.toISOString();
      }

      const { error } = await supabase
        .from("garage_owners")
        .update(updateData)
        .eq("id", subscriptionOwner.id);

      if (error) throw error;

      toast({
        title: activate ? "Subscription Activated" : "Subscription Deactivated",
        description: activate 
          ? `Dashboard access granted until ${format(subscriptionEndDate!, "dd MMM yyyy")}` 
          : "Owner dashboard access revoked",
      });

      fetchGarageOwners();
      setIsSubscriptionDialogOpen(false);
      setSubscriptionOwner(null);
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  const handleQuickDeactivate = async (owner: GarageOwner) => {
    try {
      const { error } = await supabase
        .from("garage_owners")
        .update({
          subscription_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", owner.id);

      if (error) throw error;

      toast({
        title: "Subscription Deactivated",
        description: "Owner dashboard access revoked",
      });

      fetchGarageOwners();
    } catch (error: any) {
      console.error("Error deactivating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    }
  };

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("id, full_name, username")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error: any) {
      console.error("Error fetching partners:", error);
    }
  };

  const fetchGarages = async () => {
    setIsLoading(true);
    try {
      // Fetch garages
      const { data: garagesData, error: garagesError } = await supabase
        .from("garages")
        .select("*")
        .order("name", { ascending: true });

      if (garagesError) throw garagesError;

      // Fetch submitter names for garages with submitted_by
      const submitterIds = (garagesData || [])
        .filter(g => g.submitted_by)
        .map(g => g.submitted_by);
      
      let nameMap = new Map<string, string>();
      if (submitterIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", submitterIds);
        
        (profiles || []).forEach(p => {
          if (p.full_name) nameMap.set(p.user_id, p.full_name);
        });
      }

      // Fetch all garage photos to get the first photo for each garage
      const { data: photosData } = await supabase
        .from("garage_photos")
        .select("garage_id, photo_url, display_order")
        .order("display_order", { ascending: true });

      // Create a map of garage_id to first photo
      const photoMap = new Map<string, string>();
      (photosData || []).forEach((photo) => {
        if (!photoMap.has(photo.garage_id)) {
          photoMap.set(photo.garage_id, photo.photo_url);
        }
      });

      // Fetch GINs from partner_listings for each garage
      const garageIds = (garagesData || []).map(g => g.id);
      const { data: listingsData } = await supabase
        .from("partner_listings")
        .select("listing_id, gin")
        .in("listing_id", garageIds);

      // Create a map of garage_id to GIN
      const ginMap = new Map<string, string>();
      (listingsData || []).forEach((listing) => {
        if (listing.listing_id && listing.gin) {
          ginMap.set(listing.listing_id, listing.gin);
        }
      });

      // Merge photos, submitter names, and GINs with garages
      const enrichedGarages = (garagesData || []).map((garage) => ({
        ...garage,
        photo_url: photoMap.get(garage.id) || garage.photo_url,
        submitter_email: garage.submitted_by 
          ? (nameMap.get(garage.submitted_by) || garage.submitted_by.slice(0, 8))
          : null,
        gin: ginMap.get(garage.id) || null,
      }));

      setGarages(enrichedGarages);
    } catch (error: any) {
      console.error("Error fetching garages:", error);
      toast({
        title: "Error",
        description: "Failed to load garages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGarage = async (garageId: string) => {
    if (!confirm("Are you sure you want to delete this garage?")) return;

    try {
      const { error } = await supabase
        .from("garages")
        .delete()
        .eq("id", garageId);

      if (error) throw error;

      toast({
        title: "Garage Deleted",
        description: "The garage has been removed",
      });

      fetchGarages();
    } catch (error: any) {
      console.error("Error deleting garage:", error);
      toast({
        title: "Error",
        description: "Failed to delete garage. It may have associated reviews.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Garage Name,Phone,Address,State,City,Country,Location Link,Photo URL,Services Offered\nExample Garage,+91 9876543210,123 Main Street,Delhi,New Delhi,India,https://maps.google.com/...,https://example.com/photo.jpg,\"Oil Change,Tire Service,AC Repair\"";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "garage_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());

        // Fetch existing garages to check for duplicates
        const { data: existingGarages, error: fetchError } = await supabase
          .from("garages")
          .select("name, phone");
        
        if (fetchError) throw fetchError;

        // Create a Set of existing name+phone combinations for quick lookup
        const existingKeys = new Set(
          (existingGarages || []).map(g => `${(g.name || '').toLowerCase().trim()}|${(g.phone || '').toLowerCase().trim()}`)
        );

        const garagesToInsert: any[] = [];
        let skippedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 2) continue;

          const name = values[0]?.trim() || "";
          const phone = values[1]?.trim() || null;

          if (!name) continue;

          // Check for duplicate by name + phone
          const key = `${name.toLowerCase()}|${(phone || '').toLowerCase()}`;
          if (existingKeys.has(key)) {
            skippedCount++;
            continue;
          }

          // Add to set to avoid duplicates within the CSV itself
          existingKeys.add(key);

          const garage: any = {
            name,
            phone,
            address: values[2]?.trim() || null,
            state: values[3]?.trim() || null,
            city: values[4]?.trim() || null,
            country: values[5]?.trim() || "India",
            location_link: values[6]?.trim() || null,
            photo_url: values[7]?.trim() || null,
            services: values[8] ? values[8].split(",").map(s => s.trim()) : null,
            rating: 5.0,
            review_count: 0,
            is_verified: false,
          };

          garagesToInsert.push(garage);
        }

        if (garagesToInsert.length === 0) {
          toast({
            title: "No New Garages",
            description: skippedCount > 0 
              ? `All ${skippedCount} garages already exist in the database`
              : "No valid garages found in the file",
          });
          return;
        }

        const { error } = await supabase.from("garages").insert(garagesToInsert);

        if (error) throw error;

        toast({
          title: "Import Successful",
          description: `${garagesToInsert.length} new garages imported${skippedCount > 0 ? `, ${skippedCount} duplicates skipped` : ''}`,
        });

        fetchGarages();
      } catch (error: any) {
        console.error("Error importing garages:", error);
        toast({
          title: "Import Failed",
          description: error.message || "Failed to import garages",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleSyncAllPhotos = async () => {
    if (!confirm("This will update all garage photo_urls from garage_photos table. Continue?")) return;
    
    setIsSyncing(true);
    try {
      // Fetch all garage photos
      const { data: allPhotos, error: photosError } = await supabase
        .from("garage_photos")
        .select("garage_id, photo_url, display_order")
        .order("display_order", { ascending: true });
      
      if (photosError) throw photosError;

      // Create a map of garage_id to first photo
      const photoMap = new Map<string, string>();
      (allPhotos || []).forEach((photo) => {
        if (!photoMap.has(photo.garage_id)) {
          photoMap.set(photo.garage_id, photo.photo_url);
        }
      });

      // Update garages that have photos in garage_photos
      let updatedCount = 0;
      for (const [garageId, photoUrl] of photoMap.entries()) {
        const { error } = await supabase
          .from("garages")
          .update({ photo_url: photoUrl })
          .eq("id", garageId);
        
        if (!error) updatedCount++;
      }

      toast({
        title: "Sync Complete",
        description: `Updated photo URLs for ${updatedCount} garages`,
      });

      fetchGarages();
    } catch (error: any) {
      console.error("Error syncing photos:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync photos",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenManagement = (garage: Garage) => {
    setSelectedGarage(garage);
    setIsManagementOpen(true);
  };

  const handleRefreshAll = () => {
    fetchGarages();
    fetchGarageOwners();
    fetchPartners();
  };

  const filteredGarages = useMemo(() => {
    const filtered = garages.filter(garage => {
      const matchesSearch = garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (garage.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (garage.state || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (garage.gin || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesListingType = listingTypeFilter === "all" || 
        (listingTypeFilter === "admin" && (!garage.listing_type || garage.listing_type === "admin")) ||
        garage.listing_type === listingTypeFilter;

      const matchesPartner = partnerFilter === "all" || garage.partner_id === partnerFilter;
      
      return matchesSearch && matchesListingType && matchesPartner;
    });

    // Sort the results
    return filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case "created_at": aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
        case "city": aVal = (a.city || "").toLowerCase(); bVal = (b.city || "").toLowerCase(); break;
        case "rating": aVal = a.rating || 0; bVal = b.rating || 0; break;
        default: aVal = a.name; bVal = b.name;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [garages, searchQuery, listingTypeFilter, partnerFilter, sortField, sortDirection]);

  // Pagination
  const pagination = usePagination({ data: filteredGarages, itemsPerPage: 20 });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Count garages per partner for the filter dropdown
  const partnerGarageCounts = partners.reduce((acc, partner) => {
    acc[partner.id] = garages.filter(g => g.partner_id === partner.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="garages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="garages" className="gap-2">
            <Building2 className="w-4 h-4" />
            Garages
          </TabsTrigger>
          <TabsTrigger value="all-reviews" className="gap-2">
            <Star className="w-4 h-4" />
            All Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="garages" className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search garages by name, city, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={listingTypeFilter} onValueChange={(val) => {
                setListingTypeFilter(val);
                if (val !== "partner") {
                  setPartnerFilter("all");
                }
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="owner">OID - Owners</SelectItem>
                  <SelectItem value="customer">CID - Customers</SelectItem>
                  <SelectItem value="partner">PID - Partners</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-[200px]">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{partner.full_name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {partnerGarageCounts[partner.id] || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleRefreshAll} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="w-4 h-4" />
                Template
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="gap-2"
                disabled={isUploading}
              >
                <Upload className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`} />
                {isUploading ? "Importing..." : "Import CSV"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSyncAllPhotos} 
                className="gap-2"
                disabled={isSyncing}
              >
                <ImageIcon className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Photos"}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Garages</p>
                    <p className="text-2xl font-bold">{garages.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600">Pending Approval</p>
                    <p className="text-2xl font-bold text-yellow-600">{garages.filter(g => g.is_approved === false).length}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="text-2xl font-bold">{garages.filter(g => g.is_verified).length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">With Reviews</p>
                    <p className="text-2xl font-bold">{garages.filter(g => (g.review_count || 0) > 0).length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Garages Section */}
          {garages.filter(g => g.is_approved === false).length > 0 && (
            <Card className="border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <XCircle className="w-5 h-5" />
                  Pending Approval ({garages.filter(g => g.is_approved === false).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {garages.filter(g => g.is_approved === false).map((garage) => (
                    <div key={garage.id} className="flex items-center justify-between p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center gap-4">
                        {garage.photo_url ? (
                          <img src={garage.photo_url} alt={garage.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{garage.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {[garage.city, garage.state, garage.country].filter(Boolean).join(", ") || "Location not specified"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Phone: {garage.phone || "N/A"} | Services: {garage.services?.length || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenManagement(garage)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            const { error } = await supabase
                              .from("garages")
                              .update({ is_approved: true })
                              .eq("id", garage.id);
                            if (error) {
                              toast({ title: "Error", description: "Failed to approve garage", variant: "destructive" });
                            } else {
                              toast({ title: "Approved", description: `${garage.name} is now live!` });
                              fetchGarages();
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(`Delete "${garage.name}"? This cannot be undone.`)) return;
                            await handleDeleteGarage(garage.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Garages Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Garages ({filteredGarages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading garages...</p>
                </div>
              ) : filteredGarages.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No garages found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo</TableHead>
                        <TableHead>GIN</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Name
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort("city")}
                        >
                          <div className="flex items-center gap-1">
                            Location
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Listed By</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort("created_at")}
                        >
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Listed On
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort("rating")}
                        >
                          <div className="flex items-center gap-1">
                            Rating
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.paginatedData.map((garage) => (
                        <TableRow 
                          key={garage.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenManagement(garage)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {garage.photo_url ? (
                              <img 
                                src={garage.photo_url} 
                                alt={garage.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {garage.gin || "-"}
                          </TableCell>
                          <TableCell className="font-medium">{garage.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {garage.city || garage.state || garage.country || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {garage.phone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3" />
                                {garage.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs w-fit font-mono font-semibold",
                                garage.listing_type === "owner" && "bg-green-500/10 text-green-600 border-green-500/30",
                                garage.listing_type === "partner" && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                                garage.listing_type === "customer" && "bg-orange-500/10 text-orange-600 border-orange-500/30",
                                (!garage.listing_type || garage.listing_type === "admin") && "bg-purple-500/10 text-purple-600 border-purple-500/30"
                              )}
                            >
                              {garage.listing_type === "owner" && <Store className="w-3 h-3 mr-1" />}
                              {garage.listing_type === "partner" && <Users className="w-3 h-3 mr-1" />}
                              {garage.listing_type === "customer" && <User className="w-3 h-3 mr-1" />}
                              {(!garage.listing_type || garage.listing_type === "admin") && <Building2 className="w-3 h-3 mr-1" />}
                              {garage.listing_type === "owner" ? "OID" : 
                               garage.listing_type === "partner" ? "PID" : 
                               garage.listing_type === "customer" ? "CID" : "Admin"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(garage.created_at), "dd MMM yyyy")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span>{(garage.rating || 5).toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {garage.is_approved === false ? (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                  Pending
                                </Badge>
                              ) : garage.is_verified ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const owner = getOwnerForGarage(garage.id);
                              if (!owner) {
                                return (
                                  <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs">
                                    Unclaimed
                                  </Badge>
                                );
                              }
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "h-7 px-3 text-xs font-medium",
                                    owner.subscription_active 
                                      ? "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20" 
                                      : "bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20"
                                  )}
                                  onClick={() => {
                                    if (owner.subscription_active) {
                                      // Direct deactivation
                                      handleQuickDeactivate(owner);
                                    } else {
                                      // Open dialog to set dates
                                      handleOpenSubscriptionDialog(owner, true);
                                    }
                                  }}
                                >
                                  {owner.subscription_active ? "Active" : "Inactive"}
                                </Button>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedGarage(garage);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenManagement(garage)}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteGarage(garage.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    startIndex={pagination.startIndex}
                    endIndex={pagination.endIndex}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                    onPageChange={pagination.goToPage}
                    onItemsPerPageChange={pagination.setItemsPerPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-reviews">
          <GarageAllReviews />
        </TabsContent>
      </Tabs>

      {/* Garage Details Dialog (Quick View) */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Garage Details</DialogTitle>
            <DialogDescription>
              Quick view of garage information
            </DialogDescription>
          </DialogHeader>
          {selectedGarage && (
            <div className="space-y-4">
              {selectedGarage.photo_url && (
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img 
                    src={selectedGarage.photo_url} 
                    alt={selectedGarage.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedGarage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedGarage.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedGarage.address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{selectedGarage.city || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{selectedGarage.state || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{selectedGarage.country || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{(selectedGarage.rating || 5).toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                  <p className="font-medium">{selectedGarage.review_count || 0}</p>
                </div>
              </div>
              {selectedGarage.services && selectedGarage.services.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGarage.services.map((service, i) => (
                      <Badge key={i} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button onClick={() => {
                  setIsDetailsOpen(false);
                  handleOpenManagement(selectedGarage);
                }} className="flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Open Full Management
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Garage Management Sheet */}
      <GarageManagementSheet
        garage={selectedGarage}
        isOpen={isManagementOpen}
        onClose={() => {
          setIsManagementOpen(false);
          setSelectedGarage(null);
        }}
        onRefresh={handleRefreshAll}
        garageOwners={garageOwners}
      />

      {/* Subscription Activation Dialog */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate Subscription</DialogTitle>
            <DialogDescription>
              Set the subscription period for this garage owner. Dashboard access will be granted for the selected dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subscription Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !subscriptionStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {subscriptionStartDate ? format(subscriptionStartDate, "PPP") : <span>Pick a start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={subscriptionStartDate}
                    onSelect={setSubscriptionStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Subscription End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !subscriptionEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {subscriptionEndDate ? format(subscriptionEndDate, "PPP") : <span>Pick an end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={subscriptionEndDate}
                    onSelect={setSubscriptionEndDate}
                    disabled={(date) => subscriptionStartDate ? date < subscriptionStartDate : false}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {subscriptionStartDate && subscriptionEndDate && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium">Subscription Summary</p>
                <p className="text-muted-foreground mt-1">
                  Duration: {Math.ceil((subscriptionEndDate.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubscriptionDialogOpen(false);
                setSubscriptionOwner(null);
              }}
              disabled={isUpdatingSubscription}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubscriptionUpdate(true)}
              disabled={!subscriptionStartDate || !subscriptionEndDate || isUpdatingSubscription}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdatingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
