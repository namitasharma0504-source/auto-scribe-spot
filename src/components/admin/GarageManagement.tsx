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
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  has_discounts: boolean | null;
  walk_in_welcome: boolean | null;
  response_time: string | null;
  services: string[] | null;
  location_link: string | null;
  photo_url: string | null;
  created_at: string;
}

interface GaragePhoto {
  id: string;
  garage_id: string;
  photo_url: string;
  display_order: number;
  created_at: string;
}

export function GarageManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [garagePhotos, setGaragePhotos] = useState<GaragePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Garage>>({});

  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("garages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGarages(data || []);
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

        // Update main photo_url if this is the first photo
        if (garagePhotos.length === 0 && i === 0) {
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
      const { error } = await supabase
        .from('garages')
        .update({ photo_url: photo.photo_url })
        .eq('id', selectedGarage.id);

      if (error) throw error;

      setEditForm(prev => ({ ...prev, photo_url: photo.photo_url }));

      toast({
        title: "Main Photo Updated",
        description: "This photo is now the main display photo",
      });
    } catch (error: any) {
      console.error("Error setting main photo:", error);
      toast({
        title: "Error",
        description: "Failed to update main photo",
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
    fetchGaragePhotos(garage.id);
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

        const garages: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 2) continue;

          const garage: any = {
            name: values[0]?.trim() || "",
            phone: values[1]?.trim() || null,
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

          if (garage.name) {
            garages.push(garage);
          }
        }

        if (garages.length === 0) {
          throw new Error("No valid garages found in the file");
        }

        const { error } = await supabase.from("garages").insert(garages);

        if (error) throw error;

        toast({
          title: "Import Successful",
          description: `${garages.length} garages have been imported`,
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

  const filteredGarages = garages.filter(garage =>
    garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (garage.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (garage.state || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Status</TableHead>
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
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{(garage.rating || 5).toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{garage.review_count || 0}</TableCell>
                      <TableCell>
                        {garage.is_verified ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">
                            Unverified
                          </Badge>
                        )}
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editForm.city || ""}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editForm.state || ""}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={editForm.country || ""}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value || null })}
                />
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

            <div className="space-y-2">
              <Label htmlFor="services">Services (comma-separated)</Label>
              <Input
                id="services"
                placeholder="Oil Change, Tire Service, AC Repair"
                value={editForm.services?.join(", ") || ""}
                onChange={(e) => setEditForm({ 
                  ...editForm, 
                  services: e.target.value ? e.target.value.split(",").map(s => s.trim()) : null 
                })}
              />
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