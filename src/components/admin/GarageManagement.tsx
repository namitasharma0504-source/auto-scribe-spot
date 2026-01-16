import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Search, 
  RefreshCw,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Save,
  X,
  Image as ImageIcon,
  Plus,
  Loader2,
  User,
  Store,
  Users,
  CalendarIcon,
  Key,
} from "lucide-react";
import { format } from "date-fns";
import { GarageRecentReviews } from "./GarageRecentReviews";
import { GarageAllReviews } from "./GarageAllReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";
import { cn } from "@/lib/utils";

// Predefined services list
const predefinedServices = [
  "General Service",
  "AC Repair",
  "Body Work",
  "Tyres",
  "Diagnostics",
  "EV-friendly",
  "Multi-brand",
  "Premium cars",
  "Oil Change",
  "Brake Service",
  "Engine Repair",
  "Transmission",
  "Electrical",
  "Suspension",
  "Wheel Alignment",
  "Car Wash",
  "Detailing",
  "Battery Service",
  "Clutch Repair",
  "Exhaust System"
];

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
  approval_notes: string | null;
  created_at: string;
  // Joined data
  submitter_email?: string | null;
}

interface GaragePhoto {
  id: string;
  garage_id: string;
  photo_url: string;
  display_order: number;
  created_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export function GarageManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [garagePhotos, setGaragePhotos] = useState<GaragePhoto[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [garageOwners, setGarageOwners] = useState<GarageOwner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<GarageOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Garage>>({});
  const [ownerForm, setOwnerForm] = useState<Partial<GarageOwner>>({});
  const [customService, setCustomService] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [newOwnerForm, setNewOwnerForm] = useState({
    business_name: "",
    contact_phone: "",
    enable_subscription: false,
  });
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);

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

  const handleSaveOwnerDates = async () => {
    if (!selectedOwner) return;

    setIsSavingOwner(true);
    try {
      const { error } = await supabase
        .from("garage_owners")
        .update({
          signup_date: ownerForm.signup_date || null,
          listing_date: ownerForm.listing_date || null,
          subscription_date: ownerForm.subscription_date || null,
          subscription_active: ownerForm.subscription_active || false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOwner.id);

      if (error) throw error;

      toast({
        title: "Owner Details Updated",
        description: "The owner dates and subscription status have been saved",
      });

      fetchGarageOwners();
    } catch (error: any) {
      console.error("Error updating owner:", error);
      toast({
        title: "Error",
        description: "Failed to update owner details",
        variant: "destructive",
      });
    } finally {
      setIsSavingOwner(false);
    }
  };

  const handleQuickSubscriptionToggle = async (ownerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("garage_owners")
        .update({
          subscription_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ownerId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Subscription Activated" : "Subscription Deactivated",
        description: !currentStatus 
          ? "Owner now has dashboard access" 
          : "Owner dashboard access revoked",
      });

      fetchGarageOwners();
    } catch (error: any) {
      console.error("Error toggling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    }
  };

  const handleCreateOwner = async (garageId: string) => {
    if (!newOwnerForm.business_name.trim()) {
      toast({
        title: "Business Name Required",
        description: "Please enter a business name for the owner",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOwner(true);
    try {
      const now = new Date().toISOString();
      
      // Create a new garage_owner record
      const { data: newOwner, error: ownerError } = await supabase
        .from("garage_owners")
        .insert({
          garage_id: garageId,
          user_id: crypto.randomUUID(), // Placeholder user_id since no actual user account
          business_name: newOwnerForm.business_name.trim(),
          contact_phone: newOwnerForm.contact_phone.trim() || null,
          signup_date: now,
          listing_date: now,
          subscription_active: newOwnerForm.enable_subscription,
          subscription_date: newOwnerForm.enable_subscription ? now : null,
        })
        .select()
        .single();

      if (ownerError) throw ownerError;

      // Update the garage with owner_id reference
      const { error: garageError } = await supabase
        .from("garages")
        .update({ owner_id: newOwner.id })
        .eq("id", garageId);

      if (garageError) throw garageError;

      toast({
        title: "Owner Created & Linked",
        description: newOwnerForm.enable_subscription 
          ? "Owner has been created with active dashboard access"
          : "Owner has been created. Enable subscription for dashboard access.",
      });

      // Reset form and refresh data
      setNewOwnerForm({
        business_name: "",
        contact_phone: "",
        enable_subscription: false,
      });
      
      fetchGarageOwners();
      fetchGarages();
      
      // Update selectedOwner to show the new owner in the form
      setSelectedOwner(newOwner);
      setOwnerForm({
        signup_date: newOwner.signup_date,
        listing_date: newOwner.listing_date,
        subscription_date: newOwner.subscription_date,
        subscription_active: newOwner.subscription_active,
      });
    } catch (error: any) {
      console.error("Error creating owner:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create owner",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOwner(false);
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

      // Merge photos and submitter names with garages
      const enrichedGarages = (garagesData || []).map((garage) => ({
        ...garage,
        photo_url: photoMap.get(garage.id) || garage.photo_url,
        submitter_email: garage.submitted_by 
          ? (nameMap.get(garage.submitted_by) || garage.submitted_by.slice(0, 8))
          : null,
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

  const fetchGaragePhotos = async (garageId: string) => {
    try {
      const { data, error } = await supabase
        .from("garage_photos")
        .select("*")
        .eq("garage_id", garageId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setGaragePhotos(data || []);
    } catch (error: any) {
      console.error("Error fetching garage photos:", error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedGarage) return;

    setIsUploadingPhoto(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedGarage.id}/${Date.now()}-${i}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('garage-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('garage-photos')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('garage_photos')
          .insert({
            garage_id: selectedGarage.id,
            photo_url: urlData.publicUrl,
            display_order: garagePhotos.length + i
          });

        if (dbError) throw dbError;

        // Update main photo_url if this is the first uploaded photo or if no photo_url exists
        if (i === 0 && (garagePhotos.length === 0 || !editForm.photo_url || editForm.photo_url.includes('drive.google.com'))) {
          await supabase
            .from('garages')
            .update({ photo_url: urlData.publicUrl })
            .eq('id', selectedGarage.id);
          
          setEditForm(prev => ({ ...prev, photo_url: urlData.publicUrl }));
        }
      }

      toast({
        title: "Photos Uploaded",
        description: `${files.length} photo(s) uploaded successfully`,
      });

      fetchGaragePhotos(selectedGarage.id);
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (photo: GaragePhoto) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      // Extract file path from URL
      const urlParts = photo.photo_url.split('/garage-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('garage-photos').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('garage_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      // Update main photo_url if needed
      const remainingPhotos = garagePhotos.filter(p => p.id !== photo.id);
      if (selectedGarage && photo.photo_url === editForm.photo_url) {
        const newMainPhoto = remainingPhotos[0]?.photo_url || null;
        await supabase
          .from('garages')
          .update({ photo_url: newMainPhoto })
          .eq('id', selectedGarage.id);
        setEditForm(prev => ({ ...prev, photo_url: newMainPhoto }));
      }

      toast({
        title: "Photo Deleted",
        description: "The photo has been removed",
      });

      setGaragePhotos(remainingPhotos);
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  const setAsMainPhoto = async (photo: GaragePhoto) => {
    if (!selectedGarage) return;

    try {
      // 1) Persist main photo URL for legacy/thumbnail usage
      const { error: garageError } = await supabase
        .from("garages")
        .update({ photo_url: photo.photo_url })
        .eq("id", selectedGarage.id);

      if (garageError) throw garageError;

      // 2) Reorder gallery photos so the selected one is always display_order = 0
      // Fetch fresh list from DB to avoid stale state ordering
      const { data: freshPhotos, error: photosError } = await supabase
        .from("garage_photos")
        .select("id, photo_url, display_order, created_at")
        .eq("garage_id", selectedGarage.id)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (photosError) throw photosError;

      const list = freshPhotos ?? [];
      const selected = list.find((p) => p.id === photo.id);
      if (!selected) {
        throw new Error("Selected photo not found for this garage");
      }

      const reordered = [selected, ...list.filter((p) => p.id !== photo.id)];

      const updates = reordered.map((p, index) =>
        supabase.from("garage_photos").update({ display_order: index }).eq("id", p.id)
      );

      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      setEditForm((prev) => ({ ...prev, photo_url: photo.photo_url }));
      await fetchGaragePhotos(selectedGarage.id);

      toast({
        title: "Main Photo Updated",
        description: "This photo is now the main display photo",
      });
    } catch (error: any) {
      console.error("Error setting main photo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update main photo",
        variant: "destructive",
      });
    }
  };

  const handleEditGarage = (garage: Garage) => {
    setSelectedGarage(garage);
    setEditForm({
      name: garage.name,
      address: garage.address,
      city: garage.city,
      state: garage.state,
      country: garage.country,
      phone: garage.phone,
      photo_url: garage.photo_url,
      location_link: garage.location_link,
      services: garage.services,
      is_verified: garage.is_verified,
      is_certified: garage.is_certified,
      is_recommended: garage.is_recommended,
      has_discounts: garage.has_discounts,
      walk_in_welcome: garage.walk_in_welcome,
      response_time: garage.response_time,
    });
    setCustomService("");
    setShowCustomInput(false);
    fetchGaragePhotos(garage.id);
    
    // Load owner data for this garage
    const owner = getOwnerForGarage(garage.id);
    setSelectedOwner(owner);
    if (owner) {
      setOwnerForm({
        signup_date: owner.signup_date,
        listing_date: owner.listing_date,
        subscription_date: owner.subscription_date,
        subscription_active: owner.subscription_active,
      });
    } else {
      setOwnerForm({});
    }
    
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedGarage) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("garages")
        .update({
          name: editForm.name,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          country: editForm.country,
          phone: editForm.phone,
          photo_url: editForm.photo_url,
          location_link: editForm.location_link,
          services: editForm.services,
          is_verified: editForm.is_verified,
          is_certified: editForm.is_certified,
          is_recommended: editForm.is_recommended,
          has_discounts: editForm.has_discounts,
          walk_in_welcome: editForm.walk_in_welcome,
          response_time: editForm.response_time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedGarage.id);

      if (error) throw error;

      toast({
        title: "Garage Updated",
        description: "The garage details have been saved",
      });

      setIsEditOpen(false);
      fetchGarages();
    } catch (error: any) {
      console.error("Error updating garage:", error);
      toast({
        title: "Error",
        description: "Failed to update garage",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

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

  // Helper to get user code based on listing type
  const getUserCode = (listingType: string | null, submittedBy: string | null) => {
    if (!listingType || listingType === "admin" || !submittedBy) return "Admin";
    const shortId = submittedBy.slice(0, 6).toUpperCase();
    switch (listingType) {
      case "owner": return `OID-${shortId}`;
      case "customer": return `CID-${shortId}`;
      case "partner": return `PID-${shortId}`;
      default: return "Admin";
    }
  };

  const filteredGarages = garages.filter(garage => {
    const matchesSearch = garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (garage.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (garage.state || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesListingType = listingTypeFilter === "all" || 
      (listingTypeFilter === "admin" && (!garage.listing_type || garage.listing_type === "admin")) ||
      garage.listing_type === listingTypeFilter;

    const matchesPartner = partnerFilter === "all" || garage.partner_id === partnerFilter;
    
    return matchesSearch && matchesListingType && matchesPartner;
  });

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
            // Reset partner filter if not filtering by partners
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
          
          {/* Partner Filter - Show when filtering by partners or always for convenience */}
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
          
          <Button variant="outline" onClick={fetchGarages} className="gap-2">
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
                      onClick={() => {
                        setSelectedGarage(garage);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
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
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Listed By</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGarages.map((garage) => (
                    <TableRow key={garage.id}>
                      <TableCell>
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
                        {/* Listed By Badge - OID/PID/CID/Admin */}
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
                        {/* Submitter Name/ID */}
                        {garage.submitter_email ? (
                          <span className="text-xs text-muted-foreground truncate max-w-[100px] block" title={garage.submitter_email}>
                            {garage.submitter_email}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{(garage.rating || 5).toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{garage.review_count || 0}</TableCell>
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
                      <TableCell>
                        {/* Subscription Status with Quick Toggle */}
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
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={owner.subscription_active}
                                onCheckedChange={() => handleQuickSubscriptionToggle(owner.id, owner.subscription_active)}
                                className="data-[state=checked]:bg-green-500"
                              />
                              <span className={cn(
                                "text-xs",
                                owner.subscription_active ? "text-green-600" : "text-muted-foreground"
                              )}>
                                {owner.subscription_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
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
                            onClick={() => handleEditGarage(garage)}
                          >
                            <Edit className="w-4 h-4" />
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
            </div>
          )}
        </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="all-reviews">
          <GarageAllReviews />
        </TabsContent>
      </Tabs>

      {/* Garage Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Garage Details</DialogTitle>
            <DialogDescription>
              Complete information about this garage
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
              {selectedGarage.location_link && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location Link</p>
                  <a 
                    href={selectedGarage.location_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}
              
              {/* Owner & Subscription Info */}
              {(() => {
                const owner = getOwnerForGarage(selectedGarage.id);
                return owner ? (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-4 h-4 text-primary" />
                      <h4 className="font-medium">Owner & Subscription</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Business Name</p>
                        <p className="font-medium">{owner.business_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dashboard Access</p>
                        <Badge variant={owner.subscription_active ? "default" : "secondary"}>
                          {owner.subscription_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Signup Date</p>
                        <p className="font-medium">
                          {owner.signup_date ? format(new Date(owner.signup_date), "PP") : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Listing Date</p>
                        <p className="font-medium">
                          {owner.listing_date ? format(new Date(owner.listing_date), "PP") : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Subscription Date</p>
                        <p className="font-medium">
                          {owner.subscription_date ? format(new Date(owner.subscription_date), "PP") : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 border rounded-lg bg-muted/30 text-center">
                    <p className="text-muted-foreground text-sm">No owner linked to this garage</p>
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailsOpen(false);
              if (selectedGarage) handleEditGarage(selectedGarage);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Garage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Garage Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Garage</DialogTitle>
            <DialogDescription>
              Update garage information and photo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Photo Upload & Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Garage Photos (up to 4)</Label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto || garagePhotos.length >= 4}
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isUploadingPhoto ? "Uploading..." : "Upload Photos"}
                </Button>
              </div>
              
              {/* Photo Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {garagePhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={photo.photo_url} 
                        alt="Garage photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                      {photo.photo_url !== editForm.photo_url && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="text-xs"
                          onClick={() => setAsMainPhoto(photo)}
                        >
                          Set as Main
                        </Button>
                      )}
                      {photo.photo_url === editForm.photo_url && (
                        <Badge className="bg-primary text-primary-foreground text-xs">Main Photo</Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="text-xs"
                        onClick={() => handleDeletePhoto(photo)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {garagePhotos.length < 4 && (
                  <div 
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Plus className="w-8 h-8 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
                  </div>
                )}
              </div>
              
              {garagePhotos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No photos uploaded yet. Click "Upload Photos" to add garage images.
                </p>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Garage Name *</Label>
                <Input
                  id="name"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value || null })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value || null })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={editForm.country || "India"}
                  onValueChange={(v) => setEditForm({ ...editForm, country: v, state: null, city: null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="Egypt">Egypt</SelectItem>
                    <SelectItem value="Qatar">Qatar</SelectItem>
                    <SelectItem value="Sudan">Sudan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                {editForm.country === "India" ? (
                  <Select
                    value={editForm.state || ""}
                    onValueChange={(v) => {
                      const stateLabel = indiaStates.find(s => s.value === v)?.label || v;
                      setEditForm({ ...editForm, state: stateLabel, city: null });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {indiaStates.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="state"
                    value={editForm.state || ""}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value || null })}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District (Optional)</Label>
                {editForm.country === "India" && editForm.state ? (
                  <Select
                    value={
                      (() => {
                        const stateKey = indiaStates.find(s => s.label === editForm.state)?.value || "";
                        const districts = indiaDistricts[stateKey] || [];
                        const districtMatch = districts.find(d => d.label === editForm.city);
                        return districtMatch?.value || "";
                      })()
                    }
                    onValueChange={(v) => {
                      const stateKey = indiaStates.find(s => s.label === editForm.state)?.value || "";
                      const districts = indiaDistricts[stateKey] || [];
                      const districtLabel = districts.find(d => d.value === v)?.label || v;
                      setEditForm({ ...editForm, city: districtLabel });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {(() => {
                        const stateKey = indiaStates.find(s => s.label === editForm.state)?.value || "";
                        const districts = indiaDistricts[stateKey] || [];
                        return districts.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="city"
                    placeholder="Enter city name (optional)"
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value || null })}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_link">Google Maps Location Link</Label>
              <Input
                id="location_link"
                placeholder="https://maps.google.com/... or https://goo.gl/maps/..."
                value={editForm.location_link || ""}
                onChange={(e) => setEditForm({ ...editForm, location_link: e.target.value || null })}
              />
              <p className="text-xs text-muted-foreground">
                Paste the Google Maps share link for the garage location. Go to Google Maps → Search for the garage → Click "Share" → Copy link.
              </p>
              {editForm.location_link && (
                <div className="flex items-center gap-2 mt-2">
                  <a 
                    href={editForm.location_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    Test Location Link
                  </a>
                </div>
              )}
            </div>

            {/* Services Selection */}
            <div className="space-y-3">
              <Label>Services Offered</Label>
              <p className="text-sm text-muted-foreground">Select the services this garage provides</p>
              
              {/* Predefined Services Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {predefinedServices.map((service) => (
                  <label 
                    key={service}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      (editForm.services || []).includes(service) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted border-border'
                    }`}
                  >
                    <Checkbox 
                      checked={(editForm.services || []).includes(service)}
                      onCheckedChange={() => {
                        const currentServices = editForm.services || [];
                        const newServices = currentServices.includes(service)
                          ? currentServices.filter(s => s !== service)
                          : [...currentServices, service];
                        setEditForm({ ...editForm, services: newServices.length > 0 ? newServices : null });
                      }}
                    />
                    <span className="text-xs">{service}</span>
                  </label>
                ))}
              </div>
              
              {/* Custom Services Display */}
              {(() => {
                const customServices = (editForm.services || []).filter(s => !predefinedServices.includes(s));
                return customServices.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Custom services:</p>
                    <div className="flex flex-wrap gap-2">
                      {customServices.map((service) => (
                        <Badge 
                          key={service} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {service}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => {
                              const newServices = (editForm.services || []).filter(s => s !== service);
                              setEditForm({ ...editForm, services: newServices.length > 0 ? newServices : null });
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
              
              {/* Add Custom Service */}
              {showCustomInput ? (
                <div className="flex gap-2 mt-3">
                  <Input
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Enter custom service name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmedService = customService.trim();
                        if (trimmedService && !(editForm.services || []).includes(trimmedService)) {
                          setEditForm({ 
                            ...editForm, 
                            services: [...(editForm.services || []), trimmedService] 
                          });
                          setCustomService("");
                          setShowCustomInput(false);
                          toast({ title: "Service Added", description: `"${trimmedService}" added` });
                        }
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={() => {
                      const trimmedService = customService.trim();
                      if (trimmedService && !(editForm.services || []).includes(trimmedService)) {
                        setEditForm({ 
                          ...editForm, 
                          services: [...(editForm.services || []), trimmedService] 
                        });
                        setCustomService("");
                        setShowCustomInput(false);
                        toast({ title: "Service Added", description: `"${trimmedService}" added` });
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomService("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowCustomInput(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Service
                </Button>
              )}
              
              {/* Selected count */}
              <p className="text-sm text-muted-foreground">
                {(editForm.services || []).length} service{(editForm.services || []).length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response_time">Response Time</Label>
              <Input
                id="response_time"
                placeholder="e.g., 30 mins, 1-2 hours"
                value={editForm.response_time || ""}
                onChange={(e) => setEditForm({ ...editForm, response_time: e.target.value || null })}
              />
            </div>

            {/* Badges */}
            <div className="space-y-3">
              <Label>Badges & Status</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                  <Label htmlFor="is_verified" className="text-sm cursor-pointer">Verified Garage</Label>
                  <Switch
                    id="is_verified"
                    checked={editForm.is_verified || false}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_verified: checked })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                  <Label htmlFor="is_certified" className="text-sm cursor-pointer">Certified</Label>
                  <Switch
                    id="is_certified"
                    checked={editForm.is_certified || false}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_certified: checked })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                  <Label htmlFor="is_recommended" className="text-sm cursor-pointer">Recommended</Label>
                  <Switch
                    id="is_recommended"
                    checked={editForm.is_recommended || false}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_recommended: checked })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                  <Label htmlFor="has_discounts" className="text-sm cursor-pointer">Has Discounts</Label>
                  <Switch
                    id="has_discounts"
                    checked={editForm.has_discounts || false}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, has_discounts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                  <Label htmlFor="walk_in_welcome" className="text-sm cursor-pointer">Walk-in Welcome</Label>
                  <Switch
                    id="walk_in_welcome"
                    checked={editForm.walk_in_welcome || false}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, walk_in_welcome: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Owner & Subscription Section */}
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Owner & Subscription</h3>
              </div>
              
              {selectedOwner ? (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Owner ID</p>
                      <p className="font-medium text-sm">{selectedOwner.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      <p className="font-medium">{selectedOwner.business_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="font-medium">{selectedOwner.contact_phone || "N/A"}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Date Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Signup Date */}
                    <div className="space-y-2">
                      <Label className="text-sm">Signup Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ownerForm.signup_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {ownerForm.signup_date ? format(new Date(ownerForm.signup_date), "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={ownerForm.signup_date ? new Date(ownerForm.signup_date) : undefined}
                            onSelect={(date) => setOwnerForm({ ...ownerForm, signup_date: date?.toISOString() || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {ownerForm.signup_date && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() => setOwnerForm({ ...ownerForm, signup_date: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Listing Date */}
                    <div className="space-y-2">
                      <Label className="text-sm">Listing Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ownerForm.listing_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {ownerForm.listing_date ? format(new Date(ownerForm.listing_date), "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={ownerForm.listing_date ? new Date(ownerForm.listing_date) : undefined}
                            onSelect={(date) => setOwnerForm({ ...ownerForm, listing_date: date?.toISOString() || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {ownerForm.listing_date && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() => setOwnerForm({ ...ownerForm, listing_date: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Subscription Date */}
                    <div className="space-y-2">
                      <Label className="text-sm">Subscription Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ownerForm.subscription_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {ownerForm.subscription_date ? format(new Date(ownerForm.subscription_date), "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={ownerForm.subscription_date ? new Date(ownerForm.subscription_date) : undefined}
                            onSelect={(date) => setOwnerForm({ ...ownerForm, subscription_date: date?.toISOString() || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {ownerForm.subscription_date && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() => setOwnerForm({ ...ownerForm, subscription_date: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Subscription Status Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                    <div>
                      <Label htmlFor="subscription_active" className="cursor-pointer font-medium">
                        Dashboard Access
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enable to allow owner access to /garage-dashboard
                      </p>
                    </div>
                    <Switch
                      id="subscription_active"
                      checked={ownerForm.subscription_active || false}
                      onCheckedChange={(checked) => setOwnerForm({ ...ownerForm, subscription_active: checked })}
                    />
                  </div>

                  {/* Save Owner Button */}
                  <Button 
                    onClick={handleSaveOwnerDates} 
                    disabled={isSavingOwner}
                    variant="secondary"
                    className="w-full"
                  >
                    {isSavingOwner ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Owner Details
                  </Button>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm font-medium">
                      No owner is linked to this garage yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create an owner manually to manage subscription access.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create New Owner
                    </h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_business_name">Business Name *</Label>
                      <Input
                        id="new_business_name"
                        value={newOwnerForm.business_name}
                        onChange={(e) => setNewOwnerForm({ ...newOwnerForm, business_name: e.target.value })}
                        placeholder="Enter business/owner name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_contact_phone">Contact Phone</Label>
                      <Input
                        id="new_contact_phone"
                        value={newOwnerForm.contact_phone}
                        onChange={(e) => setNewOwnerForm({ ...newOwnerForm, contact_phone: e.target.value })}
                        placeholder="Enter contact phone"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-500/5">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-green-600" />
                        <Label htmlFor="new_enable_subscription" className="text-sm cursor-pointer">
                          Enable Dashboard Access
                        </Label>
                      </div>
                      <Switch
                        id="new_enable_subscription"
                        checked={newOwnerForm.enable_subscription}
                        onCheckedChange={(checked) => setNewOwnerForm({ ...newOwnerForm, enable_subscription: checked })}
                      />
                    </div>
                    
                    <Button 
                      onClick={() => selectedGarage && handleCreateOwner(selectedGarage.id)}
                      disabled={isCreatingOwner || !newOwnerForm.business_name.trim()}
                      className="w-full"
                    >
                      {isCreatingOwner ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create Owner & Link to Garage
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Reviews Section */}
            {selectedGarage && (
              <GarageRecentReviews 
                garageId={selectedGarage.id} 
                garageName={selectedGarage.name} 
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}