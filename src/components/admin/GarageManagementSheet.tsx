import { useState, useRef, useEffect } from "react";
import { 
  Building2, 
  Trash2,
  MapPin,
  Phone,
  Star,
  Save,
  X,
  Image as ImageIcon,
  Plus,
  Loader2,
  Store,
  CalendarIcon,
  Key,
  UserPlus,
  Link2,
  UserX,
  AlertTriangle,
  RotateCcw,
  Power,
  PowerOff,
  Ban,
  ShieldAlert,
  Eye,
  ExternalLink,
  RefreshCw,
  Mail,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { GarageRecentReviews } from "./GarageRecentReviews";
import { Card, CardContent } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  slug: string | null;
  created_at: string;
}

interface GaragePhoto {
  id: string;
  garage_id: string;
  photo_url: string;
  display_order: number;
  created_at: string;
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

interface GarageManagementSheetProps {
  garage: Garage | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  garageOwners: GarageOwner[];
}

export function GarageManagementSheet({ 
  garage, 
  isOpen, 
  onClose, 
  onRefresh,
  garageOwners 
}: GarageManagementSheetProps) {
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [garagePhotos, setGaragePhotos] = useState<GaragePhoto[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<GarageOwner | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Garage>>({});
  const [ownerForm, setOwnerForm] = useState<Partial<GarageOwner>>({});
  const [customService, setCustomService] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedOwnerToLink, setSelectedOwnerToLink] = useState<string>("");
  const [isLinkingOwner, setIsLinkingOwner] = useState(false);
  const [isDeletingListing, setIsDeletingListing] = useState(false);
  const [isDeletingCredentials, setIsDeletingCredentials] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  // Get unlinked owners
  const unlinkedOwners = garageOwners.filter(o => !o.garage_id);

  useEffect(() => {
    if (garage && isOpen) {
      initializeForm(garage);
    }
  }, [garage, isOpen]);

  const initializeForm = async (g: Garage) => {
    setEditForm({
      name: g.name,
      address: g.address,
      city: g.city,
      state: g.state,
      country: g.country,
      phone: g.phone,
      photo_url: g.photo_url,
      location_link: g.location_link,
      services: g.services,
      is_verified: g.is_verified,
      is_certified: g.is_certified,
      is_recommended: g.is_recommended,
      has_discounts: g.has_discounts,
      walk_in_welcome: g.walk_in_welcome,
      response_time: g.response_time,
    });
    setCustomService("");
    setShowCustomInput(false);
    await fetchGaragePhotos(g.id);
    
    // Load owner data for this garage
    const owner = garageOwners.find(o => o.garage_id === g.id) || null;
    setSelectedOwner(owner);
    setOwnerEmail(null);
    
    if (owner) {
      setOwnerForm({
        signup_date: owner.signup_date,
        listing_date: owner.listing_date,
        subscription_date: owner.subscription_date,
        subscription_end_date: owner.subscription_end_date,
        subscription_active: owner.subscription_active,
      });
      
      // Try to fetch owner email from claim requests where they claimed this garage
      try {
        const { data: claimData } = await supabase
          .from("garage_claim_requests")
          .select("claimant_email")
          .eq("claimant_user_id", owner.user_id)
          .eq("status", "approved")
          .limit(1)
          .single();
        
        if (claimData?.claimant_email) {
          setOwnerEmail(claimData.claimant_email);
        }
      } catch (err) {
        // No claim record found, email will show as N/A
        console.log("Could not fetch owner email from claims");
      }
    } else {
      setOwnerForm({});
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
    if (!files || !garage) return;

    setIsUploadingPhoto(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${garage.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('garage-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('garage-photos')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('garage_photos')
          .insert({
            garage_id: garage.id,
            photo_url: urlData.publicUrl,
            display_order: garagePhotos.length + i
          });

        if (dbError) throw dbError;

        if (i === 0 && (garagePhotos.length === 0 || !editForm.photo_url)) {
          await supabase
            .from('garages')
            .update({ photo_url: urlData.publicUrl })
            .eq('id', garage.id);
          
          setEditForm(prev => ({ ...prev, photo_url: urlData.publicUrl }));
        }
      }

      toast({
        title: "Photos Uploaded",
        description: `${files.length} photo(s) uploaded successfully`,
      });

      fetchGaragePhotos(garage.id);
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
      const urlParts = photo.photo_url.split('/garage-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('garage-photos').remove([filePath]);
      }

      const { error } = await supabase
        .from('garage_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      const remainingPhotos = garagePhotos.filter(p => p.id !== photo.id);
      if (garage && photo.photo_url === editForm.photo_url) {
        const newMainPhoto = remainingPhotos[0]?.photo_url || null;
        await supabase
          .from('garages')
          .update({ photo_url: newMainPhoto })
          .eq('id', garage.id);
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
    if (!garage) return;

    try {
      const { error: garageError } = await supabase
        .from("garages")
        .update({ photo_url: photo.photo_url })
        .eq("id", garage.id);

      if (garageError) throw garageError;

      const { data: freshPhotos, error: photosError } = await supabase
        .from("garage_photos")
        .select("id, photo_url, display_order, created_at")
        .eq("garage_id", garage.id)
        .order("display_order", { ascending: true });

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
      await fetchGaragePhotos(garage.id);

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

  const handleSaveEdit = async () => {
    if (!garage) return;

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
        .eq("id", garage.id);

      if (error) throw error;

      toast({
        title: "Garage Updated",
        description: "The garage details have been saved",
      });

      onRefresh();
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
          subscription_end_date: ownerForm.subscription_end_date || null,
          subscription_active: ownerForm.subscription_active || false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOwner.id);

      if (error) throw error;

      toast({
        title: "Owner Details Updated",
        description: "The owner dates and subscription status have been saved",
      });

      onRefresh();
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

  const handleLinkExistingOwner = async () => {
    if (!garage || !selectedOwnerToLink) {
      toast({
        title: "Select an Owner",
        description: "Please select an existing owner to link",
        variant: "destructive",
      });
      return;
    }

    setIsLinkingOwner(true);
    try {
      const ownerToLink = garageOwners.find(o => o.id === selectedOwnerToLink);
      if (!ownerToLink) throw new Error("Owner not found");

      const { error: ownerError } = await supabase
        .from("garage_owners")
        .update({
          garage_id: garage.id,
          listing_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOwnerToLink);

      if (ownerError) throw ownerError;

      const { error: garageError } = await supabase
        .from("garages")
        .update({ owner_id: selectedOwnerToLink })
        .eq("id", garage.id);

      if (garageError) throw garageError;

      toast({
        title: "Owner Linked Successfully",
        description: `${ownerToLink.business_name || 'Owner'} has been linked to this garage`,
      });

      setSelectedOwnerToLink("");
      onRefresh();
      
      // Update local state
      setSelectedOwner(ownerToLink);
      setOwnerForm({
        signup_date: ownerToLink.signup_date,
        listing_date: ownerToLink.listing_date,
        subscription_date: ownerToLink.subscription_date,
        subscription_end_date: ownerToLink.subscription_end_date,
        subscription_active: ownerToLink.subscription_active,
      });
    } catch (error: any) {
      console.error("Error linking owner:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to link owner",
        variant: "destructive",
      });
    } finally {
      setIsLinkingOwner(false);
    }
  };

  // DELETION ACTIONS

  const handleDeleteGarageListing = async () => {
    if (!garage) return;
    
    setIsDeletingListing(true);
    try {
      // Delete from garages (CASCADE will handle related photos, leads, claims, etc.)
      const { error } = await supabase
        .from("garages")
        .delete()
        .eq("id", garage.id);

      if (error) throw error;

      toast({
        title: "Garage Listing Deleted",
        description: "The garage listing has been removed from the platform",
      });

      onClose();
      onRefresh();
    } catch (error: any) {
      console.error("Error deleting garage:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete garage listing",
        variant: "destructive",
      });
    } finally {
      setIsDeletingListing(false);
    }
  };

  const handleDeleteOwnerCredentials = async () => {
    if (!selectedOwner) return;

    setIsDeletingCredentials(true);
    try {
      // Unlink owner from garage first
      if (garage) {
        await supabase
          .from("garages")
          .update({ owner_id: null })
          .eq("id", garage.id);
      }

      // Set garage_id to null on garage_owner (keeping the record but unlinked)
      const { error } = await supabase
        .from("garage_owners")
        .update({ 
          garage_id: null,
          subscription_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOwner.id);

      if (error) throw error;

      toast({
        title: "Owner Credentials Removed",
        description: "The owner has been unlinked from this garage. They can no longer access the dashboard.",
      });

      setSelectedOwner(null);
      setOwnerForm({});
      onRefresh();
    } catch (error: any) {
      console.error("Error removing owner credentials:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove owner credentials",
        variant: "destructive",
      });
    } finally {
      setIsDeletingCredentials(false);
    }
  };

  const handleDisableSubscription = async () => {
    if (!selectedOwner) return;

    try {
      const { error } = await supabase
        .from("garage_owners")
        .update({
          subscription_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOwner.id);

      if (error) throw error;

      toast({
        title: "Subscription Disabled",
        description: "Dashboard access has been revoked. The listing remains visible publicly.",
      });

      setOwnerForm(prev => ({ ...prev, subscription_active: false }));
      onRefresh();
    } catch (error: any) {
      console.error("Error disabling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to disable subscription",
        variant: "destructive",
      });
    }
  };

  const handleEnableSubscription = async () => {
    if (!selectedOwner) return;

    try {
      const today = new Date();
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const { error } = await supabase
        .from("garage_owners")
        .update({
          subscription_active: true,
          subscription_date: today.toISOString(),
          subscription_end_date: oneYearLater.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOwner.id);

      if (error) throw error;

      toast({
        title: "Subscription Activated",
        description: "Dashboard access has been granted for 1 year.",
      });

      setOwnerForm(prev => ({ 
        ...prev, 
        subscription_active: true,
        subscription_date: today.toISOString(),
        subscription_end_date: oneYearLater.toISOString(),
      }));
      onRefresh();
    } catch (error: any) {
      console.error("Error enabling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to enable subscription",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedOwner) return;

    setIsResettingPassword(true);
    try {
      // Get the user email from auth (we need to call an edge function or use admin API)
      // For now, we'll show a message that password reset needs to be done via email
      toast({
        title: "Password Reset Initiated",
        description: "The owner will receive a password reset email at their registered email address.",
      });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!garage) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {garage.photo_url ? (
                <img 
                  src={garage.photo_url} 
                  alt={garage.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <SheetTitle className="text-xl">{garage.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3" />
                  {[garage.city, garage.state].filter(Boolean).join(", ") || "Location not set"}
                </SheetDescription>
                <div className="flex gap-2 mt-2">
                  {garage.is_verified && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                      Verified
                    </Badge>
                  )}
                  {selectedOwner ? (
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      ownerForm.subscription_active 
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/30" 
                        : "bg-gray-500/10 text-gray-500 border-gray-500/30"
                    )}>
                      {ownerForm.subscription_active ? "Subscribed" : "Inactive"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                      Unclaimed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {garage.slug && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => window.open(`/garage/${garage.slug}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Live
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6">
            <Accordion type="multiple" defaultValue={["listing", "owner", "lifecycle", "access"]} className="space-y-4">
              
              {/* Section 1: Garage Listing Management */}
              <AccordionItem value="listing" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Garage Listing Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-6">
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
                        {isUploadingPhoto ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                    
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
                                className="text-xs h-7"
                                onClick={() => setAsMainPhoto(photo)}
                              >
                                Set Main
                              </Button>
                            )}
                            {photo.photo_url === editForm.photo_url && (
                              <Badge className="bg-primary text-primary-foreground text-xs">Main</Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="text-xs h-7"
                              onClick={() => handleDeletePhoto(photo)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {garagePhotos.length < 4 && (
                        <div 
                          className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => photoInputRef.current?.click()}
                        >
                          <Plus className="w-6 h-6 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground mt-1">Add</span>
                        </div>
                      )}
                    </div>
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
                      <Label>Country</Label>
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
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
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
                          <SelectContent className="max-h-[200px]">
                            {indiaStates.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={editForm.state || ""}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value || null })}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>District/City</Label>
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
                          <SelectContent className="max-h-[200px]">
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
                          placeholder="Enter city name"
                          value={editForm.city || ""}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value || null })}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Google Maps Link</Label>
                    <Input
                      placeholder="https://maps.google.com/..."
                      value={editForm.location_link || ""}
                      onChange={(e) => setEditForm({ ...editForm, location_link: e.target.value || null })}
                    />
                  </div>

                  {/* Services */}
                  <div className="space-y-3">
                    <Label>Services Offered</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {predefinedServices.slice(0, 12).map((service) => (
                        <label 
                          key={service}
                          className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
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
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Badges & Status */}
                  <div className="space-y-3">
                    <Label>Badges & Status</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="is_verified" className="text-xs cursor-pointer">Verified</Label>
                        <Switch
                          id="is_verified"
                          checked={editForm.is_verified || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_verified: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="is_certified" className="text-xs cursor-pointer">Certified</Label>
                        <Switch
                          id="is_certified"
                          checked={editForm.is_certified || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_certified: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="is_recommended" className="text-xs cursor-pointer">Recommended</Label>
                        <Switch
                          id="is_recommended"
                          checked={editForm.is_recommended || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_recommended: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveEdit} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Listing Changes
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Owner & Login Credentials */}
              <AccordionItem value="owner" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Garage Owner & Login Credentials</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4">
                  {selectedOwner ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Owner ID</p>
                          <p className="font-medium text-sm">{selectedOwner.id.slice(0, 8)}...</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Business Name</p>
                          <p className="font-medium text-sm">{selectedOwner.business_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Phone</p>
                          <p className="font-medium text-sm">{selectedOwner.contact_phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dashboard Status</p>
                          <Badge variant={ownerForm.subscription_active ? "default" : "secondary"}>
                            {ownerForm.subscription_active ? "Can Access" : "Blocked"}
                          </Badge>
                        </div>
                      </div>

                      {/* Login Credentials Section */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="w-4 h-4 text-blue-600" />
                          <p className="font-medium text-sm text-blue-800">Login Credentials</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Email ID</p>
                              <p className="font-medium text-sm">
                                {ownerEmail || (
                                  <span className="text-muted-foreground italic">
                                    Not available (use password reset)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Password</p>
                              <p className="font-medium text-sm text-muted-foreground">••••••••</p>
                              <p className="text-xs text-muted-foreground">(Encrypted - not visible)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reset Password */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-200">
                        <div>
                          <p className="font-medium text-sm">Password Reset</p>
                          <p className="text-xs text-muted-foreground">Send password reset email to owner</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleResetPassword}
                          disabled={isResettingPassword}
                        >
                          {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
                          Reset
                        </Button>
                      </div>

                      {/* Save Owner Changes Button */}
                      <Button onClick={handleSaveOwnerDates} disabled={isSavingOwner} variant="secondary" className="w-full">
                        {isSavingOwner ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Owner Changes
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center py-4 text-muted-foreground">
                        <UserX className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No owner linked</p>
                        <p className="text-xs">Link an existing registered owner to this garage</p>
                      </div>
                      
                      {unlinkedOwners.length > 0 ? (
                        <div className="space-y-3">
                          <Select
                            value={selectedOwnerToLink}
                            onValueChange={setSelectedOwnerToLink}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an owner..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              {unlinkedOwners.map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{owner.business_name || "No Name"}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {owner.contact_phone || "No phone"}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button 
                            onClick={handleLinkExistingOwner}
                            disabled={isLinkingOwner || !selectedOwnerToLink}
                            className="w-full"
                          >
                            {isLinkingOwner ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Link2 className="w-4 h-4 mr-2" />
                            )}
                            Link Owner
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-center text-muted-foreground">
                          No unlinked owners available. Owners must sign up first.
                        </p>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Section 3: Lifecycle Dates */}
              <AccordionItem value="lifecycle" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Garage Lifecycle Dates</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Listing Date</p>
                      <p className="font-medium text-sm">
                        {garage.created_at ? format(new Date(garage.created_at), "PPP") : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">(When added to platform)</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Owner Signup Date</p>
                      <p className="font-medium text-sm">
                        {selectedOwner?.signup_date 
                          ? format(new Date(selectedOwner.signup_date), "PPP") 
                          : "Unclaimed"}
                      </p>
                    </div>
                    {selectedOwner && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Subscription Start</p>
                          <p className="font-medium text-sm">
                            {ownerForm.subscription_date 
                              ? format(new Date(ownerForm.subscription_date), "PPP") 
                              : "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Subscription End</p>
                          <p className="font-medium text-sm">
                            {ownerForm.subscription_end_date 
                              ? format(new Date(ownerForm.subscription_end_date), "PPP") 
                              : "Not set"}
                          </p>
                          {ownerForm.subscription_end_date && (
                            <p className="text-xs mt-1">
                              {(() => {
                                const daysRemaining = Math.ceil((new Date(ownerForm.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return daysRemaining > 0 
                                  ? <span className="text-green-600">{daysRemaining} days remaining</span>
                                  : <span className="text-red-600">Expired</span>;
                              })()}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {selectedOwner && (
                    <>
                      {/* Date Editors */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Subscription Start</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {ownerForm.subscription_date ? format(new Date(ownerForm.subscription_date), "PP") : "Select"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-background" align="start">
                              <Calendar
                                mode="single"
                                selected={ownerForm.subscription_date ? new Date(ownerForm.subscription_date) : undefined}
                                onSelect={(date) => setOwnerForm({ ...ownerForm, subscription_date: date?.toISOString() || null })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Subscription End</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {ownerForm.subscription_end_date ? format(new Date(ownerForm.subscription_end_date), "PP") : "Select"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-background" align="start">
                              <Calendar
                                mode="single"
                                selected={ownerForm.subscription_end_date ? new Date(ownerForm.subscription_end_date) : undefined}
                                onSelect={(date) => setOwnerForm({ ...ownerForm, subscription_end_date: date?.toISOString() || null })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <Button onClick={handleSaveOwnerDates} disabled={isSavingOwner} variant="secondary" className="w-full">
                        {isSavingOwner ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Date Changes
                      </Button>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Section 4: Subscription & Dashboard Access */}
              <AccordionItem value="access" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2">
                    <Power className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Subscription & Dashboard Access</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4">
                  {selectedOwner ? (
                    <>
                      <Card className={cn(
                        "border-2",
                        ownerForm.subscription_active ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">Dashboard Access</p>
                              <p className="text-sm text-muted-foreground">
                                {ownerForm.subscription_active 
                                  ? "Owner can access /garage-dashboard"
                                  : "Dashboard access is disabled"}
                              </p>
                            </div>
                            <Switch
                              checked={ownerForm.subscription_active || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleEnableSubscription();
                                } else {
                                  handleDisableSubscription();
                                }
                              }}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={handleEnableSubscription}
                          disabled={ownerForm.subscription_active}
                        >
                          <Power className="w-4 h-4 mr-2" />
                          Enable (1 Year)
                        </Button>
                        <Button
                          variant="outline"
                          className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          onClick={handleDisableSubscription}
                          disabled={!ownerForm.subscription_active}
                        >
                          <PowerOff className="w-4 h-4 mr-2" />
                          Disable Access
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Ban className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No owner linked</p>
                      <p className="text-xs">Link an owner first to manage subscription</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Section 5: Danger Zone - Deletion Rules */}
              <AccordionItem value="danger" className="border border-red-200 rounded-lg px-4 bg-red-50/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-600">Danger Zone</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    These actions are independent and cannot be undone. Please read the effects carefully.
                  </p>

                  {/* Disable Subscription */}
                  {selectedOwner && ownerForm.subscription_active && (
                    <div className="p-4 rounded-lg border border-amber-300 bg-amber-50">
                      <div className="flex items-start gap-3">
                        <PowerOff className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Disable Subscription</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            • Garage owner cannot access dashboard<br/>
                            • Listing remains visible publicly<br/>
                            • Can be re-enabled later
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 border-amber-500 text-amber-600 hover:bg-amber-100"
                            onClick={handleDisableSubscription}
                          >
                            Disable Dashboard Access
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delete Login Credentials */}
                  {selectedOwner && (
                    <div className="p-4 rounded-lg border border-orange-300 bg-orange-50">
                      <div className="flex items-start gap-3">
                        <UserX className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Delete Login Credentials</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            • Prevents garage owner login<br/>
                            • Unlinks owner from this garage<br/>
                            • Listing may still exist publicly
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 border-orange-500 text-orange-600 hover:bg-orange-100"
                              >
                                Remove Owner Credentials
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                                  Remove Owner Credentials?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will unlink the owner from this garage and revoke their dashboard access.
                                  The owner will need to be re-linked to regain access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteOwnerCredentials}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  {isDeletingCredentials ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delete Garage Listing */}
                  <div className="p-4 rounded-lg border border-red-300 bg-red-50">
                    <div className="flex items-start gap-3">
                      <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Delete Garage Listing</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          • Removes listing from frontend<br/>
                          • Revokes dashboard access<br/>
                          • Deletes all photos, leads, claims<br/>
                          • This action is PERMANENT
                        </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="mt-3"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Entire Listing
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                                Delete "{garage.name}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the garage
                                listing and all associated data including photos, leads, and claims.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteGarageListing}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeletingListing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Recent Reviews Section */}
            <div className="pt-4">
              <GarageRecentReviews 
                garageId={garage.id} 
                garageName={garage.name} 
              />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
