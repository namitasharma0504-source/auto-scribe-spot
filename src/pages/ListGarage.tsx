import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Phone, MapPin, Link as LinkIcon, Camera, Wrench, ArrowLeft, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const countries = [
  { value: "in", label: "India" },
  { value: "ae", label: "UAE" },
  { value: "ng", label: "Nigeria" },
  { value: "eg", label: "Egypt" },
  { value: "qa", label: "Qatar" },
  { value: "sd", label: "Sudan" },
];

const cities: Record<string, { value: string; label: string }[]> = {
  in: [
    { value: "mumbai", label: "Mumbai" },
    { value: "delhi", label: "Delhi" },
    { value: "bangalore", label: "Bangalore" },
    { value: "chennai", label: "Chennai" },
    { value: "hyderabad", label: "Hyderabad" },
    { value: "pune", label: "Pune" },
    { value: "kolkata", label: "Kolkata" },
    { value: "ahmedabad", label: "Ahmedabad" },
    { value: "jaipur", label: "Jaipur" },
    { value: "lucknow", label: "Lucknow" },
  ],
  ae: [
    { value: "dubai", label: "Dubai" },
    { value: "abu-dhabi", label: "Abu Dhabi" },
    { value: "sharjah", label: "Sharjah" },
    { value: "ajman", label: "Ajman" },
    { value: "ras-al-khaimah", label: "Ras Al Khaimah" },
  ],
  ng: [
    { value: "lagos", label: "Lagos" },
    { value: "abuja", label: "Abuja" },
    { value: "port-harcourt", label: "Port Harcourt" },
    { value: "kano", label: "Kano" },
    { value: "ibadan", label: "Ibadan" },
  ],
  eg: [
    { value: "cairo", label: "Cairo" },
    { value: "alexandria", label: "Alexandria" },
    { value: "giza", label: "Giza" },
    { value: "sharm-el-sheikh", label: "Sharm El Sheikh" },
    { value: "luxor", label: "Luxor" },
  ],
  qa: [
    { value: "doha", label: "Doha" },
    { value: "al-wakrah", label: "Al Wakrah" },
    { value: "al-khor", label: "Al Khor" },
    { value: "lusail", label: "Lusail" },
  ],
  sd: [
    { value: "khartoum", label: "Khartoum" },
    { value: "omdurman", label: "Omdurman" },
    { value: "port-sudan", label: "Port Sudan" },
    { value: "kassala", label: "Kassala" },
  ],
};

const states: Record<string, { value: string; label: string }[]> = {
  in: [
    { value: "maharashtra", label: "Maharashtra" },
    { value: "delhi", label: "Delhi" },
    { value: "karnataka", label: "Karnataka" },
    { value: "tamil-nadu", label: "Tamil Nadu" },
    { value: "telangana", label: "Telangana" },
    { value: "gujarat", label: "Gujarat" },
    { value: "west-bengal", label: "West Bengal" },
    { value: "rajasthan", label: "Rajasthan" },
    { value: "uttar-pradesh", label: "Uttar Pradesh" },
  ],
  ae: [
    { value: "dubai", label: "Dubai" },
    { value: "abu-dhabi", label: "Abu Dhabi" },
    { value: "sharjah", label: "Sharjah" },
    { value: "ajman", label: "Ajman" },
    { value: "ras-al-khaimah", label: "Ras Al Khaimah" },
  ],
  ng: [
    { value: "lagos", label: "Lagos" },
    { value: "abuja-fct", label: "Abuja FCT" },
    { value: "rivers", label: "Rivers" },
    { value: "kano", label: "Kano" },
    { value: "oyo", label: "Oyo" },
  ],
  eg: [
    { value: "cairo", label: "Cairo" },
    { value: "alexandria", label: "Alexandria" },
    { value: "giza", label: "Giza" },
    { value: "south-sinai", label: "South Sinai" },
    { value: "luxor", label: "Luxor" },
  ],
  qa: [
    { value: "doha", label: "Doha" },
    { value: "al-wakrah", label: "Al Wakrah" },
    { value: "al-khor", label: "Al Khor" },
  ],
  sd: [
    { value: "khartoum", label: "Khartoum" },
    { value: "red-sea", label: "Red Sea" },
    { value: "kassala", label: "Kassala" },
  ],
};

const ListGarage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    garageName: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    locationLink: "",
    photoUrl: "",
    servicesOffered: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "country") {
      setFormData((prev) => ({ ...prev, state: "", city: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.garageName || !formData.phone || !formData.address || !formData.country || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success("Your garage has been submitted for review! We'll notify you once it's approved.");
    setIsSubmitting(false);
    navigate("/");
  };

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

            {/* Country & State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>State</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(v) => handleInputChange("state", v)}
                  disabled={!formData.country}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.country && states[formData.country]?.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>City *</Label>
              <Select 
                value={formData.city} 
                onValueChange={(v) => handleInputChange("city", v)}
                disabled={!formData.country}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {formData.country && cities[formData.country]?.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Google Maps Link */}
            <div className="space-y-2">
              <Label htmlFor="locationLink" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                Google Maps Link
              </Label>
              <Input
                id="locationLink"
                type="url"
                placeholder="https://maps.google.com/..."
                value={formData.locationLink}
                onChange={(e) => handleInputChange("locationLink", e.target.value)}
              />
            </div>

            {/* Photo URL */}
            <div className="space-y-2">
              <Label htmlFor="photoUrl" className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Photo of Garage (URL)
              </Label>
              <Input
                id="photoUrl"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={formData.photoUrl}
                onChange={(e) => handleInputChange("photoUrl", e.target.value)}
              />
            </div>

            {/* Services Offered */}
            <div className="space-y-2">
              <Label htmlFor="servicesOffered" className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Services Offered
              </Label>
              <Textarea
                id="servicesOffered"
                placeholder="E.g., Oil Change, Brake Repair, Engine Diagnostics, AC Service, Tire Alignment..."
                value={formData.servicesOffered}
                onChange={(e) => handleInputChange("servicesOffered", e.target.value)}
                rows={3}
              />
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Your Garage"}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListGarage;