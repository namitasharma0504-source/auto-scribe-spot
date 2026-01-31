import { useState } from "react";
import { Plus, Loader2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";

const SERVICES_LIST = [
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
  "Wheel Alignment",
  "Denting & Painting",
];

interface AddGarageDialogProps {
  onGarageAdded: () => void;
}

export function AddGarageDialog({ onGarageAdded }: AddGarageDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>(["4-wheeler"]);
  const [isVerified, setIsVerified] = useState(false);

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setState("");
    setCity("");
    setLocationLink("");
    setPhotoUrl("");
    setSelectedServices([]);
    setSelectedVehicleTypes(["4-wheeler"]);
    setIsVerified(false);
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleVehicleTypeToggle = (type: string) => {
    setSelectedVehicleTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Garage name is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedVehicleTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one vehicle type",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from("garages")
        .select("id")
        .eq("name", name.trim())
        .maybeSingle();

      if (existing) {
        toast({
          title: "Duplicate Garage",
          description: "A garage with this name already exists",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("garages").insert({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        state: state || null,
        city: city.trim() || null,
        country: "India",
        location_link: locationLink.trim() || null,
        photo_url: photoUrl.trim() || null,
        services: selectedServices.length > 0 ? selectedServices : null,
        vehicle_types: selectedVehicleTypes,
        is_verified: isVerified,
        is_approved: true,
        rating: 5.0,
        review_count: 0,
        listing_type: "admin",
      });

      if (error) throw error;

      toast({
        title: "Garage Added",
        description: `"${name}" has been added successfully`,
      });

      resetForm();
      setIsOpen(false);
      onGarageAdded();
    } catch (error: any) {
      console.error("Error adding garage:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add garage",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get cities for selected state - find the state value from label
  const stateValue = indiaStates.find(s => s.label === state)?.value || "";
  const districts = stateValue ? indiaDistricts[stateValue] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Garage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Garage</DialogTitle>
          <DialogDescription>
            Manually add a single garage to the platform
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Garage Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter garage name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: State & City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={(val) => {
                setState(val);
                setCity(""); // Reset city when state changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {indiaStates.map((s) => (
                    <SelectItem key={s.value} value={s.label}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City / District</Label>
              {districts.length > 0 ? (
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select City / District" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.value} value={d.label}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="city"
                  placeholder="Enter city name"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Row 3: Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Full address of the garage"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* Row 4: Location Link */}
          <div className="space-y-2">
            <Label htmlFor="locationLink" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Google Maps Link
            </Label>
            <Input
              id="locationLink"
              placeholder="https://maps.google.com/..."
              value={locationLink}
              onChange={(e) => setLocationLink(e.target.value)}
            />
          </div>

          {/* Row 5: Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input
              id="photoUrl"
              placeholder="https://example.com/garage-photo.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
            {photoUrl && (
              <div className="mt-2">
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-md border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Row 6: Vehicle Types */}
          <div className="space-y-2">
            <Label>
              Vehicle Types <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vehicle-4w"
                  checked={selectedVehicleTypes.includes("4-wheeler")}
                  onCheckedChange={() => handleVehicleTypeToggle("4-wheeler")}
                />
                <Label htmlFor="vehicle-4w" className="text-sm font-normal cursor-pointer">
                  🚗 4-Wheeler
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vehicle-2w"
                  checked={selectedVehicleTypes.includes("2-wheeler")}
                  onCheckedChange={() => handleVehicleTypeToggle("2-wheeler")}
                />
                <Label htmlFor="vehicle-2w" className="text-sm font-normal cursor-pointer">
                  🏍️ 2-Wheeler
                </Label>
              </div>
            </div>
            {selectedVehicleTypes.length === 0 && (
              <p className="text-xs text-destructive">At least one vehicle type must be selected</p>
            )}
          </div>

          {/* Row 7: Services */}
          <div className="space-y-2">
            <Label>Services Offered</Label>
            <div className="grid grid-cols-3 gap-2">
              {SERVICES_LIST.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${service}`}
                    checked={selectedServices.includes(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <Label
                    htmlFor={`service-${service}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Row 8: Verified Toggle */}
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox
              id="isVerified"
              checked={isVerified}
              onCheckedChange={(checked) => setIsVerified(checked as boolean)}
            />
            <Label htmlFor="isVerified" className="cursor-pointer">
              Mark as Verified
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Garage"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
