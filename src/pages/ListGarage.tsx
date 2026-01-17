import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Phone, MapPin, Link as LinkIcon, Camera, Wrench, ArrowLeft, CheckCircle, Upload, X, Plus, Loader2, AlertCircle, User, Store, Navigation, MapPinned } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";
import { cn } from "@/lib/utils";

// Validation error type
interface FormErrors {
  garageName?: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  services?: string;
  location?: string;
  photo?: string;
}

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
  const location = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [listingType, setListingType] = useState<"owner" | "customer" | "partner" | "">("");
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  
  // Get prefilled data from navigation state (from GarageAccount)
  const prefillData = (location.state as { prefill?: { businessName?: string; phone?: string; email?: string } })?.prefill;
  
  // Get user email from session as fallback
  const userEmail = user?.email || "";

  // Auto-detect user role from signup to skip role selection
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setIsLoadingRole(false);
        return;
      }
      
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (roleData?.role) {
          // Map database role to listing type
          if (roleData.role === 'garage_owner') {
            setListingType('owner');
          } else if (roleData.role === 'partner') {
            setListingType('partner');
          } else if (roleData.role === 'customer') {
            setListingType('customer');
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoadingRole(false);
      }
    };
    
    fetchUserRole();
  }, [user]);
  
  const [formData, setFormData] = useState({
    garageName: prefillData?.businessName || "",
    phone: prefillData?.phone || "",
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
  const [isParsingMapsLink, setIsParsingMapsLink] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [capturedCoordinates, setCapturedCoordinates] = useState<{
    latitude: number;
    longitude: number;
    capturedAt: string;
    method: 'gps' | 'maps_link';
  } | null>(null);
  const [locationVerification, setLocationVerification] = useState<{
    verified: boolean;
    detectedCity?: string;
    detectedState?: string;
    detectedCountry?: string;
    mismatch?: boolean;
  } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Clear error when field is edited
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Mark field as touched on blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Helper to match detected location with form selections
  const matchLocationToForm = (detectedCity?: string, detectedState?: string, detectedCountry?: string) => {
    if (!detectedCity && !detectedState) return;
    
    // Check if India
    if (detectedCountry?.toLowerCase().includes('india')) {
      // Try to match state
      const matchedState = indiaStates.find(s => 
        s.label.toLowerCase() === detectedState?.toLowerCase() ||
        detectedState?.toLowerCase().includes(s.label.toLowerCase())
      );
      
      if (matchedState && !formData.state) {
        setFormData(prev => ({ ...prev, country: 'in', state: matchedState.value }));
      }
      
      // Try to match district/city
      if (matchedState) {
        const districts = indiaDistricts[matchedState.value] || [];
        const matchedDistrict = districts.find(d =>
          d.label.toLowerCase() === detectedCity?.toLowerCase() ||
          detectedCity?.toLowerCase().includes(d.label.toLowerCase())
        );
        
        if (matchedDistrict && !formData.city) {
          setFormData(prev => ({ ...prev, city: matchedDistrict.value }));
        } else if (detectedCity && !formData.customCity) {
          // Use as custom city
          setFormData(prev => ({ ...prev, customCity: detectedCity }));
          setUseCustomCity(true);
        }
      }
    }
  };

  // Parse Google Maps link and auto-fill form
  const parseGoogleMapsLink = async (url: string) => {
    if (!url) return;
    
    // Check if it looks like a Google Maps link
    const isGoogleMapsLink = 
      url.includes('google.com/maps') || 
      url.includes('goo.gl/maps') || 
      url.includes('maps.app.goo.gl') ||
      url.includes('share.google');
    
    if (!isGoogleMapsLink) return;
    
    setIsParsingMapsLink(true);
    setLocationVerification(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-google-maps', {
        body: { url }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        const parsed = data.data;
        
        // Auto-fill name if empty and we got a name
        if (parsed.name && !formData.garageName) {
          setFormData(prev => ({ ...prev, garageName: parsed.name }));
          toast.success("Garage name auto-filled from Maps link");
        }
        
        // Store the full resolved URL
        if (parsed.fullUrl) {
          setFormData(prev => ({ ...prev, locationLink: parsed.fullUrl }));
        }
        
        // Capture coordinates from parsed link
        if (parsed.latitude && parsed.longitude) {
          setCapturedCoordinates({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            capturedAt: new Date().toISOString(),
            method: 'maps_link',
          });
          clearError('location');
        }
        
        // Set country to India by default (since this is the primary market)
        if (!formData.country) {
          setFormData(prev => ({ ...prev, country: "in" }));
        }
        
        // Handle location verification
        if (parsed.city || parsed.state) {
          setLocationVerification({
            verified: true,
            detectedCity: parsed.city,
            detectedState: parsed.state,
            detectedCountry: parsed.country,
          });
          
          // Auto-match to form
          matchLocationToForm(parsed.city, parsed.state, parsed.country);
          
          toast.success(`Location detected: ${[parsed.city, parsed.state].filter(Boolean).join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error parsing Google Maps link:', error);
      // Don't show error to user - just silently fail
    } finally {
      setIsParsingMapsLink(false);
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    setIsGettingLocation(true);
    setLocationVerification(null);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Store captured coordinates immediately
      setCapturedCoordinates({
        latitude,
        longitude,
        capturedAt: new Date().toISOString(),
        method: 'gps',
      });
      clearError('location');
      
      // Call edge function to reverse geocode
      const { data, error } = await supabase.functions.invoke('parse-google-maps', {
        body: { latitude, longitude }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        const parsed = data.data;
        
        // Create a Google Maps URL from coordinates
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setFormData(prev => ({ ...prev, locationLink: mapsUrl }));
        
        // Set verification data
        if (parsed.city || parsed.state) {
          setLocationVerification({
            verified: true,
            detectedCity: parsed.city,
            detectedState: parsed.state,
            detectedCountry: parsed.country,
          });
          
          // Auto-match to form
          matchLocationToForm(parsed.city, parsed.state, parsed.country);
          
          toast.success(`Location captured: ${[parsed.city, parsed.state].filter(Boolean).join(', ')}`);
        } else {
          setLocationVerification({ verified: true });
          toast.success("GPS location captured successfully!");
        }
      }
    } catch (error: any) {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        toast.error("Location access denied. Please enable location permissions.");
      } else if (error.code === 2) {
        toast.error("Unable to determine location. Please try again.");
      } else if (error.code === 3) {
        toast.error("Location request timed out. Please try again.");
      } else {
        toast.error("Failed to get location");
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleLocationLinkChange = (value: string) => {
    setFormData(prev => ({ ...prev, locationLink: value }));
    setLocationVerification(null);
    
    // Debounce the parsing
    if (value.length > 10) {
      parseGoogleMapsLink(value);
    }
  };

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
    if (field !== "city" && field !== "customCity") {
      clearError(field as keyof FormErrors);
    }
    
    if (field === "country") {
      setFormData((prev) => ({ ...prev, state: "", city: "", customCity: "" }));
      setUseCustomCity(false);
      clearError("state");
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
    clearError("services");
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
      
      console.log('Uploading photo to:', filePath);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('garage-photos')
        .upload(filePath, photoFile);
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload successful:', uploadData);
      
      const { data: { publicUrl } } = supabase.storage
        .from('garage-photos')
        .getPublicUrl(filePath);
      
      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const rawMessage = (error?.message || error?.error_description || "").toString();
      const hint = rawMessage ? ` (${rawMessage})` : "";

      // Provide more specific error message
      if (rawMessage.toLowerCase().includes('policy') || rawMessage.toLowerCase().includes('row-level')) {
        toast.error(`Photo upload blocked by permissions${hint}. Try again, or skip photo for now.`);
      } else if (rawMessage.toLowerCase().includes('size')) {
        toast.error("Photo is too large. Please use an image under 5MB");
      } else {
        toast.error(`Failed to upload photo${hint}. Your garage will be saved without a photo.`);
      }
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const finalCity = useCustomCity ? formData.customCity : formData.city;
    
    if (!formData.garageName.trim()) {
      newErrors.garageName = "Please enter your garage name";
    } else if (formData.garageName.trim().length < 2) {
      newErrors.garageName = "Garage name must be at least 2 characters";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter your phone number";
    } else if (!/^[\d\s\-+()]{8,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Please enter your garage address";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Please enter a more detailed address";
    }
    
    if (!formData.country) {
      newErrors.country = "Please select a country";
    }
    
    if (formData.country && !formData.state) {
      newErrors.state = "Please select a state/region";
    }
    
    // City is now optional - no validation required
    
    if (formData.services.length === 0) {
      newErrors.services = "Please select at least one service you offer";
    }
    
    // Partner-specific validations
    if (listingType === "partner") {
      // Partners MUST capture GPS location to prove physical visit
      if (!capturedCoordinates) {
        newErrors.location = "You must capture your GPS location to verify physical visit";
      } else if (capturedCoordinates.method !== 'gps') {
        newErrors.location = "Partners must use GPS location (not Maps link) to verify presence at garage";
      }
      
      // Partners MUST upload photo of garage board/visiting card
      if (!photoFile) {
        newErrors.photo = "Please upload a photo of the garage board or visiting card";
      }
    }
    
    setErrors(newErrors);
    
    // Mark all fields as touched
    setTouched({
      garageName: true,
      phone: true,
      address: true,
      country: true,
      state: true,
      services: true,
      location: true,
      photo: true,
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast.error("Please fix the errors below to continue");
      return;
    }
    
    const finalCity = useCustomCity ? formData.customCity : formData.city;

    setIsSubmitting(true);
    
    try {
      // User is guaranteed to be logged in (ProtectedRoute)
      if (!user) {
        toast.error("Please sign in to list a garage");
        navigate("/auth");
        return;
      }
      
      // Upload photo first if selected
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
        if (!photoUrl) {
          // For partners, photo is MANDATORY - block submission
          if (listingType === "partner") {
            toast.error("Photo upload failed. Please try again with a different image (max 5MB).");
            setIsSubmitting(false);
            return;
          }
          // For non-partners, continue but log warning
          console.warn('Photo upload failed, continuing without photo');
        }
      }
      
      const countryLabel = countries.find(c => c.value === formData.country)?.label || formData.country;
      const statesForCountry = getStatesForCountry(formData.country);
      const stateLabel = statesForCountry.find(s => s.value === formData.state)?.label || formData.state;
      
      let cityLabel = finalCity;
      if (!useCustomCity && formData.country === "in") {
        const districts = getDistrictsForState(formData.country, formData.state);
        cityLabel = districts.find(c => c.value === formData.city)?.label || formData.city;
      }
      
      // Validation-based auto-approval logic
      const isValidPhone = /^[\d\s\-+()]{8,15}$/.test(formData.phone.trim());
      const isValidAddress = formData.address.trim().length >= 10;
      const hasServices = formData.services.length > 0;
      const hasValidName = formData.garageName.trim().length >= 2;
      const shouldAutoApprove = isValidPhone && isValidAddress && hasServices && hasValidName;

      const isOwner = listingType === "owner";
      const isPartner = listingType === "partner";
      
      // For partners, get their partner record
      let partnerId: string | null = null;
      if (isPartner) {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        partnerId = partnerData?.id || null;
      }
      
      const { data: garageData, error } = await supabase
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
          is_approved: shouldAutoApprove,
          submitted_by: user.id,
          owner_id: null, // Owner must claim through verification process
          listing_type: listingType,
          partner_id: partnerId,
          referral_source: isPartner ? 'partner' : 'direct',
          rating: 5.0,
          review_count: 0,
          // Location verification data
          captured_latitude: capturedCoordinates?.latitude || null,
          captured_longitude: capturedCoordinates?.longitude || null,
          location_captured_at: capturedCoordinates?.capturedAt || null,
          location_capture_method: capturedCoordinates?.method || null,
        })
        .select('id')
        .single();
      
      if (error) throw error;

      // If owner, add garage_owner role
      if (isOwner) {
        await supabase
          .from('user_roles')
          .upsert({ user_id: user.id, role: 'garage_owner' }, { onConflict: 'user_id,role' });
      }
      
      // Note: partner_listings entry is now created automatically via database trigger
      // when a garage with partner_id is inserted
      
      if (shouldAutoApprove) {
        if (!photoUrl && photoFile) {
          toast.success("Your garage has been listed! Note: Photo upload failed - you can add photos later.");
        } else {
          toast.success("Your garage has been listed successfully! It's now live on the platform.");
        }
      } else {
        toast.success("Your garage has been submitted for review. We'll notify you once it's approved.");
      }

      // Redirect based on listing type
      if (listingType === "owner" && garageData?.id) {
        // Owner goes to their garage listing page to claim it
        const { data: garageSlug } = await supabase
          .from('garages')
          .select('slug')
          .eq('id', garageData.id)
          .single();
        
        if (garageSlug?.slug) {
          toast.success("Your garage is now live! Claim it to access your dashboard.");
          navigate(`/garage/${garageSlug.slug}`);
        } else {
          navigate("/garage-account");
        }
      } else if (listingType === "partner") {
        toast.success("Listing submitted! Earn ₹20 when approved. You can now upsell services.");
        navigate("/partner-dashboard");
      } else {
        // Customer - go to review the garage they just listed
        if (garageData?.id) {
          const { data: garageSlug } = await supabase
            .from('garages')
            .select('slug')
            .eq('id', garageData.id)
            .single();
          
          if (garageSlug?.slug) {
            navigate(`/garage/${garageSlug.slug}/review`);
          } else {
            navigate("/");
          }
        } else {
          navigate("/");
        }
      }
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
            <h1 className="text-3xl font-bold text-foreground mb-2">List a Garage</h1>
            <p className="text-muted-foreground">
              Add a garage to our platform and help fellow car owners find trusted mechanics
            </p>
          </div>

          {/* Loading State */}
          {isLoadingRole && (
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Setting up your form...</span>
            </div>
          )}

          {/* Role Badge - shown when role is detected */}
          {!isLoadingRole && listingType && (
            <div className="mb-6">
              <Badge 
                variant={listingType === "owner" ? "default" : "secondary"} 
                className={cn(
                  "text-sm py-1 px-3",
                  listingType === "partner" && "bg-blue-500 hover:bg-blue-600 text-white"
                )}
              >
                {listingType === "owner" ? (
                  <><Store className="w-3.5 h-3.5 mr-1.5" /> Listing as Garage Owner</>
                ) : listingType === "partner" ? (
                  <><Building2 className="w-3.5 h-3.5 mr-1.5" /> Listing as Channel Partner</>
                ) : (
                  <><User className="w-3.5 h-3.5 mr-1.5" /> Listing as Customer</>
                )}
              </Badge>
            </div>
          )}

          {!isLoadingRole && listingType && (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border space-y-6">
            {/* Garage Name */}
            <div className="space-y-2" data-error={!!errors.garageName}>
              <Label htmlFor="garageName" className={cn("flex items-center gap-2", errors.garageName && "text-destructive")}>
                <Building2 className={cn("w-4 h-4", errors.garageName ? "text-destructive" : "text-primary")} />
                Garage Name *
              </Label>
              <Input
                id="garageName"
                placeholder="Enter your garage name"
                value={formData.garageName}
                onChange={(e) => handleInputChange("garageName", e.target.value)}
                onBlur={() => handleBlur("garageName")}
                className={cn(errors.garageName && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.garageName && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.garageName}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2" data-error={!!errors.phone}>
              <Label htmlFor="phone" className={cn("flex items-center gap-2", errors.phone && "text-destructive")}>
                <Phone className={cn("w-4 h-4", errors.phone ? "text-destructive" : "text-primary")} />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number (e.g., +91 98765 43210)"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2" data-error={!!errors.address}>
              <Label htmlFor="address" className={cn("flex items-center gap-2", errors.address && "text-destructive")}>
                <MapPin className={cn("w-4 h-4", errors.address ? "text-destructive" : "text-primary")} />
                Address *
              </Label>
              <Textarea
                id="address"
                placeholder="Enter complete address with landmarks"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                onBlur={() => handleBlur("address")}
                className={cn(errors.address && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.address && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.address}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2" data-error={!!errors.country}>
              <Label className={cn(errors.country && "text-destructive")}>Country *</Label>
              <Select value={formData.country} onValueChange={(v) => handleInputChange("country", v)}>
                <SelectTrigger className={cn(errors.country && "border-destructive focus:ring-destructive")}>
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
              {errors.country && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.country}
                </p>
              )}
            </div>

            {/* State */}
            {formData.country && (
              <div className="space-y-2" data-error={!!errors.state}>
                <Label className={cn(errors.state && "text-destructive")}>State / Region *</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(v) => handleInputChange("state", v)}
                >
                  <SelectTrigger className={cn(errors.state && "border-destructive focus:ring-destructive")}>
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
                {errors.state && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.state}
                  </p>
                )}
              </div>
            )}

            {/* District/City - Only for India with districts */}
            {formData.country === "in" && formData.state && availableDistricts.length > 0 && !useCustomCity && (
              <div className="space-y-2">
                <Label>District (Optional)</Label>
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
                <Label htmlFor="customCity">City / Village / Town (Optional)</Label>
                <Input
                  id="customCity"
                  placeholder="Enter your city, village, or town name"
                  value={formData.customCity}
                  onChange={(e) => handleInputChange("customCity", e.target.value)}
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

            {/* Google Maps Link / Live Location */}
            <div className="space-y-3" data-error={!!errors.location}>
              <Label className={cn("flex items-center gap-2", errors.location && "text-destructive")}>
                <MapPinned className={cn("w-4 h-4", errors.location ? "text-destructive" : "text-primary")} />
                Garage Location {listingType === "partner" && "*"}
              </Label>
              
              {/* Partner-specific warning */}
              {listingType === "partner" && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-700">Physical Visit Required</p>
                      <p className="text-xs text-purple-600">
                        You must be physically present at the garage to capture GPS location. 
                        This ensures data authenticity and prevents copying from online sources.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Live Location Button - mandatory for partners */}
              <Button
                type="button"
                variant={listingType === "partner" ? "default" : "outline"}
                className={cn(
                  "w-full gap-2",
                  listingType === "partner" 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "border-dashed",
                  capturedCoordinates?.method === 'gps' && "bg-green-600 hover:bg-green-700"
                )}
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Getting your location...
                  </>
                ) : capturedCoordinates?.method === 'gps' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    GPS Location Captured ✓
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    {listingType === "partner" ? "Capture GPS Location (Required)" : "Use Current Location"}
                  </>
                )}
              </Button>
              
              {/* Show captured coordinates for partners */}
              {capturedCoordinates && (
                <div className="p-2 rounded bg-muted text-xs font-mono">
                  📍 {capturedCoordinates.latitude.toFixed(6)}, {capturedCoordinates.longitude.toFixed(6)}
                  <span className="ml-2 text-muted-foreground">
                    ({capturedCoordinates.method === 'gps' ? 'GPS' : 'Maps Link'})
                  </span>
                </div>
              )}
              
              {errors.location && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.location}
                </p>
              )}
              
              {/* Maps link option - secondary for partners */}
              {listingType !== "partner" && (
                <>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex-1 border-t" />
                    <span>OR paste Google Maps link</span>
                    <span className="flex-1 border-t" />
                  </div>
                  
                  <div className="relative">
                    <Input
                      id="locationLink"
                      type="url"
                      placeholder="Paste Google Maps share link (e.g., https://share.google/...)"
                      value={formData.locationLink}
                      onChange={(e) => handleLocationLinkChange(e.target.value)}
                      className={cn(
                        locationVerification?.verified && "border-green-500 pr-10"
                      )}
                    />
                    {isParsingMapsLink && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {locationVerification?.verified && !isParsingMapsLink && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </>
              )}
              
              {/* Location Verification Status */}
              {locationVerification?.verified && (locationVerification.detectedCity || locationVerification.detectedState) && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700">Location Verified</p>
                      <p className="text-xs text-green-600">
                        Detected: {[locationVerification.detectedCity, locationVerification.detectedState, locationVerification.detectedCountry].filter(Boolean).join(', ')}
                      </p>
                      {formData.state && locationVerification.detectedState && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.state.toLowerCase().includes(locationVerification.detectedState?.toLowerCase() || '') || 
                           locationVerification.detectedState?.toLowerCase().includes(formData.state.toLowerCase()) ? (
                            <span className="text-green-600">✓ Matches selected state</span>
                          ) : (
                            <span className="text-amber-600">⚠ Selected state may differ from detected location</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {listingType === "partner" 
                  ? "GPS location capture is mandatory to verify your physical presence at the garage"
                  : "Use live location or paste a Google Maps link - we'll auto-detect the city and verify it matches your selection"
                }
              </p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2" data-error={!!errors.photo}>
              <Label className={cn("flex items-center gap-2", errors.photo && "text-destructive")}>
                <Camera className={cn("w-4 h-4", errors.photo ? "text-destructive" : "text-primary")} />
                {listingType === "partner" ? "Garage Board / Visiting Card Photo *" : "Garage Photo"}
              </Label>
              
              {/* Partner-specific instruction */}
              {listingType === "partner" && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-start gap-2">
                    <Camera className="w-4 h-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-700">Photo Proof Required</p>
                      <p className="text-xs text-purple-600">
                        Upload a clear photo of the garage board (name board) or the owner's visiting card. 
                        This proves you physically visited and collected authentic information.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={cn(
                "border-2 border-dashed rounded-xl p-4",
                errors.photo ? "border-destructive bg-destructive/5" : "border-border"
              )}>
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
                    {listingType === "partner" && (
                      <Badge className="absolute bottom-2 left-2 bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" /> Photo uploaded
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div 
                    className={cn(
                      "flex flex-col items-center justify-center py-8 cursor-pointer rounded-lg transition-colors",
                      listingType === "partner" ? "hover:bg-purple-500/10" : "hover:bg-muted/50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={cn(
                      "h-10 w-10 mb-2",
                      listingType === "partner" ? "text-purple-600" : "text-muted-foreground"
                    )} />
                    <p className={cn(
                      "text-sm",
                      listingType === "partner" ? "text-purple-700 font-medium" : "text-muted-foreground"
                    )}>
                      {listingType === "partner" 
                        ? "Upload garage board or visiting card photo" 
                        : "Click to upload garage photo"
                      }
                    </p>
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
              
              {errors.photo && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.photo}
                </p>
              )}
            </div>

            {/* Services Selection */}
            <div className="space-y-3" data-error={!!errors.services}>
              <Label className={cn("flex items-center gap-2", errors.services && "text-destructive")}>
                <Wrench className={cn("w-4 h-4", errors.services ? "text-destructive" : "text-primary")} />
                Services Offered *
              </Label>
              <p className="text-sm text-muted-foreground">Select the services your garage provides</p>
              
              {errors.services && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.services}
                </p>
              )}
              
              <div className={cn(
                "grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border",
                errors.services ? "border-destructive bg-destructive/5" : "border-transparent"
              )}>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListGarage;
