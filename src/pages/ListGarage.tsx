import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Phone, MapPin, Link as LinkIcon, Camera, Wrench, ArrowLeft, CheckCircle, Upload, X, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";

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

const countries = [
  { value: "in", label: "India" },
  { value: "ae", label: "UAE" },
  { value: "ng", label: "Nigeria" },
  { value: "eg", label: "Egypt" },
  { value: "qa", label: "Qatar" },
  { value: "sd", label: "Sudan" },
];

// Other countries' states (simplified)
const otherCountryStates: Record<string, { value: string; label: string }[]> = {
  ae: [
    { value: "dubai", label: "Dubai" },
    { value: "abu-dhabi", label: "Abu Dhabi" },
    { value: "sharjah", label: "Sharjah" },
    { value: "ajman", label: "Ajman" },
    { value: "ras-al-khaimah", label: "Ras Al Khaimah" },
    { value: "fujairah", label: "Fujairah" },
    { value: "umm-al-quwain", label: "Umm Al Quwain" },
  ],
  ng: [
    { value: "lagos", label: "Lagos" },
    { value: "abuja-fct", label: "Abuja FCT" },
    { value: "rivers", label: "Rivers" },
    { value: "kano", label: "Kano" },
    { value: "oyo", label: "Oyo" },
    { value: "kaduna", label: "Kaduna" },
    { value: "delta", label: "Delta" },
  ],
  eg: [
    { value: "cairo", label: "Cairo" },
    { value: "alexandria", label: "Alexandria" },
    { value: "giza", label: "Giza" },
    { value: "south-sinai", label: "South Sinai" },
    { value: "luxor", label: "Luxor" },
    { value: "aswan", label: "Aswan" },
  ],
  qa: [
    { value: "doha", label: "Doha" },
    { value: "al-wakrah", label: "Al Wakrah" },
    { value: "al-khor", label: "Al Khor" },
    { value: "al-rayyan", label: "Al Rayyan" },
  ],
  sd: [
    { value: "khartoum", label: "Khartoum" },
    { value: "red-sea", label: "Red Sea" },
    { value: "kassala", label: "Kassala" },
    { value: "gezira", label: "Gezira" },
  ],
};

const ListGarage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    garageName: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    customCity: "",
    locationLink: "",
    services: [] as string[],
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [customService, setCustomService] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [useCustomCity, setUseCustomCity] = useState(false);

  // Get states based on country
  const getStatesForCountry = (countryCode: string) => {
    if (countryCode === "in") {
      return indiaStates;
    }
    return otherCountryStates[countryCode] || [];
  };

  // Get districts/cities based on state (only for India)
  const getDistrictsForState = (countryCode: string, stateValue: string) => {
    if (countryCode === "in" && stateValue) {
      return indiaDistricts[stateValue] || [];
    }
    return [];
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "country") {
      setFormData((prev) => ({ ...prev, state: "", city: "", customCity: "" }));
      setUseCustomCity(false);
    }
    if (field === "state") {
      setFormData((prev) => ({ ...prev, city: "", customCity: "" }));
      setUseCustomCity(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleAddCustomService = () => {
    const trimmedService = customService.trim();
    if (trimmedService && !formData.services.includes(trimmedService) && !predefinedServices.includes(trimmedService)) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, trimmedService]
      }));
      setCustomService("");
      setShowCustomInput(false);
      toast.success(`"${trimmedService}" added to services`);
    } else if (predefinedServices.includes(trimmedService) || formData.services.includes(trimmedService)) {
      toast.error("This service already exists");
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    
    setIsUploading(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `garage-listings/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('garage-photos')
        .upload(filePath, photoFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('garage-photos')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error("Failed to upload photo");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCity = useCustomCity ? formData.customCity : formData.city;
    
    if (!formData.garageName || !formData.phone || !formData.address || !formData.country || !finalCity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.services.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }
      
      const countryLabel = countries.find(c => c.value === formData.country)?.label || formData.country;
      const statesForCountry = getStatesForCountry(formData.country);
      const stateLabel = statesForCountry.find(s => s.value === formData.state)?.label || formData.state;
      
      let cityLabel = finalCity;
      if (!useCustomCity && formData.country === "in") {
        const districts = getDistrictsForState(formData.country, formData.state);
        cityLabel = districts.find(c => c.value === formData.city)?.label || formData.city;
      }
      
      const { error } = await supabase
        .from('garages')
        .insert({
          name: formData.garageName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          state: stateLabel,
          city: cityLabel,
          country: countryLabel,
          location_link: formData.locationLink.trim() || null,
          photo_url: photoUrl,
          services: formData.services,
          is_verified: false,
          rating: 5.0,
          review_count: 0
        });
      
      if (error) throw error;
      
      toast.success("Your garage has been submitted for review! We'll notify you once it's approved.");
      navigate("/");
    } catch (error) {
      console.error('Error submitting garage:', error);
      toast.error("Failed to submit garage. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const customServices = formData.services.filter(s => !predefinedServices.includes(s));
  const availableStates = getStatesForCountry(formData.country);
  const availableDistricts = getDistrictsForState(formData.country, formData.state);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">List Your Garage</h1>
            <p className="text-muted-foreground">
              Join thousands of garages and start collecting reviews from your customers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border space-y-6">
            {/* Garage Name */}
            <div className="space-y-2">
              <Label htmlFor="garageName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Garage Name *
              </Label>
              <Input
                id="garageName"
                placeholder="Enter your garage name"
                value={formData.garageName}
                onChange={(e) => handleInputChange("garageName", e.target.value)}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Address *
              </Label>
              <Textarea
                id="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label>Country *</Label>
              <Select value={formData.country} onValueChange={(v) => handleInputChange("country", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            {formData.country && (
              <div className="space-y-2">
                <Label>State / Region *</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(v) => handleInputChange("state", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableStates.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* District/City - Only for India with districts */}
            {formData.country === "in" && formData.state && availableDistricts.length > 0 && !useCustomCity && (
              <div className="space-y-2">
                <Label>District *</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(v) => handleInputChange("city", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableDistricts.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 h-auto text-sm"
                  onClick={() => setUseCustomCity(true)}
                >
                  Can't find your city/village? Enter manually
                </Button>
              </div>
            )}

            {/* Custom City/Village Input */}
            {(useCustomCity || (formData.country && formData.country !== "in") || (formData.country === "in" && formData.state && availableDistricts.length === 0)) && (
              <div className="space-y-2">
                <Label htmlFor="customCity">City / Village / Town *</Label>
                <Input
                  id="customCity"
                  placeholder="Enter your city, village, or town name"
                  value={formData.customCity}
                  onChange={(e) => handleInputChange("customCity", e.target.value)}
                  required
                />
                {useCustomCity && formData.country === "in" && (
                  <Button 
                    type="button" 
                    variant="link" 
                    className="px-0 h-auto text-sm"
                    onClick={() => {
                      setUseCustomCity(false);
                      setFormData(prev => ({ ...prev, customCity: "" }));
                    }}
                  >
                    Select from district list instead
                  </Button>
                )}
              </div>
            )}

            {/* Google Maps Link */}
            <div className="space-y-2">
              <Label htmlFor="locationLink" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                Google Maps Link
              </Label>
              <Input
                id="locationLink"
                type="url"
                placeholder="https://maps.google.com/... or https://goo.gl/maps/..."
                value={formData.locationLink}
                onChange={(e) => handleInputChange("locationLink", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste your Google Maps share link to help customers find you easily
              </p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Garage Photo
              </Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4">
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Garage preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload garage photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Services Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Services Offered *
              </Label>
              <p className="text-sm text-muted-foreground">Select the services your garage provides</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {predefinedServices.map((service) => (
                  <label 
                    key={service}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.services.includes(service) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted border-border'
                    }`}
                  >
                    <Checkbox 
                      checked={formData.services.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <span className="text-sm">{service}</span>
                  </label>
                ))}
              </div>
              
              {customServices.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Custom services added:</p>
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
                          onClick={() => handleRemoveService(service)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {showCustomInput ? (
                <div className="flex gap-2 mt-3">
                  <Input
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Enter custom service name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomService();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddCustomService} size="sm">
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
                  className="mt-2"
                  onClick={() => setShowCustomInput(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Services
                </Button>
              )}
              
              <p className="text-sm text-muted-foreground">
                {formData.services.length} service{formData.services.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-foreground">Benefits of Listing</h3>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Get discovered by thousands of car owners
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Collect verified reviews from customers
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Build trust and credibility online
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  100% Free - No charges ever
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? "Submitting..." : isUploading ? "Uploading Photo..." : "Submit Your Garage"}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListGarage;
