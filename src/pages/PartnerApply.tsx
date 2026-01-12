import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";
import { PartnerApplicationSuccess } from "@/components/PartnerApplicationSuccess";
import { 
  Users, 
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Target,
  Handshake,
  CheckCircle2,
  Clock,
  Wallet,
  TrendingDown
} from "lucide-react";

const whyJoinOptions = [
  { value: "flexible-income", label: "Looking for flexible income opportunity" },
  { value: "automotive-passion", label: "Passionate about automotive industry" },
  { value: "sales-experience", label: "Have sales experience, want to leverage it" },
  { value: "local-network", label: "Have strong local network in my area" },
  { value: "part-time-gig", label: "Need a part-time gig alongside studies/job" },
  { value: "entrepreneurial", label: "Want to build an entrepreneurial career" },
  { value: "other", label: "Other reason" },
];

const educationOptions = [
  { value: "high-school", label: "High School (10th/12th)" },
  { value: "undergraduate", label: "Undergraduate (Pursuing/Completed)" },
  { value: "graduate", label: "Graduate" },
  { value: "post-graduate", label: "Post Graduate" },
  { value: "diploma", label: "Diploma/ITI" },
  { value: "other", label: "Other" },
];

const occupationOptions = [
  { value: "employed", label: "Employed (Full-time Job)" },
  { value: "self-employed", label: "Self-Employed / Business Owner" },
  { value: "freelancer", label: "Freelancer / Gig Worker" },
  { value: "student", label: "Student" },
  { value: "unemployed", label: "Unemployed / Looking for Work" },
  { value: "homemaker", label: "Homemaker" },
  { value: "retired", label: "Retired" },
  { value: "other", label: "Other" },
];

const PartnerApply = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    customCity: "",
    education: "",
    occupation: "",
    whyJoin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState({ name: "", email: "" });

  const cities = formData.state ? indiaDistricts[formData.state] || [] : [];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "state") {
      setFormData(prev => ({ ...prev, city: "", customCity: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.state || !formData.education || !formData.whyJoin) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const normalizedPhone = formData.phone.trim();

      // Check for duplicate email or phone
      const { data: existingApplications, error: checkError } = await supabase
        .from("partner_applications")
        .select("email, phone")
        .or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`)
        .limit(1);

      if (checkError) throw checkError;

      if (existingApplications && existingApplications.length > 0) {
        const existing = existingApplications[0];
        if (existing.email === normalizedEmail) {
          toast.info("Your application is already submitted! Please check your email for next steps.", {
            duration: 6000,
          });
          setIsSubmitting(false);
          return;
        }
        if (existing.phone === normalizedPhone) {
          toast.error("An application with this phone number already exists. Please use a different number.");
          setIsSubmitting(false);
          return;
        }
      }

      const stateName = indiaStates.find(s => s.value === formData.state)?.label || formData.state;
      const cityName = formData.city === "other" ? formData.customCity.trim() : (cities.find(c => c.value === formData.city)?.label || formData.city);

      const { error } = await supabase.from("partner_applications").insert({
        full_name: formData.fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        state: stateName,
        city: cityName,
        education: educationOptions.find(e => e.value === formData.education)?.label || formData.education,
        occupation: occupationOptions.find(o => o.value === formData.occupation)?.label || formData.occupation,
        why_join: whyJoinOptions.find(w => w.value === formData.whyJoin)?.label || formData.whyJoin,
      });

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-partner-confirmation", {
          body: {
            fullName: formData.fullName.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            state: stateName,
            city: cityName,
          },
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the submission if email fails
      }

      // Store data for success page
      setSubmittedData({
        name: formData.fullName.trim(),
        email: normalizedEmail,
      });
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success page after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PartnerApplicationSuccess 
          applicantName={submittedData.name} 
          email={submittedData.email} 
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-10 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
              <Handshake className="w-3 h-3 mr-1" />
              Partner Application
            </Badge>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
              Join the <span className="text-primary">MeriGarage Partner</span> Program
            </h1>
            <p className="text-muted-foreground">
              Start earning ₹10,000 - ₹50,000+ monthly with flexible hours
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-accent" />
                <span>Flexible Hours</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Wallet className="w-4 h-4 text-success" />
                <span>Daily Earnings</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingDown className="w-4 h-4 text-warning" />
                <span>Zero Investment</span>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Partner Application</CardTitle>
              <CardDescription>
                Fill in your details - takes just 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Personal Details */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Personal Details
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-sm">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          maxLength={255}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm">Mobile Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="10-digit mobile number"
                          className="pl-10"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="education" className="text-sm">Education *</Label>
                      <Select value={formData.education} onValueChange={(value) => handleInputChange("education", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Location
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="state" className="text-sm">State *</Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent>
                          {indiaStates.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm">City/District</Label>
                      <Select 
                        value={formData.city} 
                        onValueChange={(value) => handleInputChange("city", value)}
                        disabled={!formData.state}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.state ? "Select your city" : "Select state first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.value} value={city.value}>
                              {city.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other (Enter manually)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.city === "other" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="customCity" className="text-sm">Enter Your City/Village Name</Label>
                      <Input
                        id="customCity"
                        placeholder="Enter your city or village name"
                        value={formData.customCity}
                        onChange={(e) => handleInputChange("customCity", e.target.value)}
                        maxLength={100}
                      />
                    </div>
                  )}
                </div>

                {/* About You */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    About You
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="occupation" className="text-sm">Current Occupation *</Label>
                      <Select value={formData.occupation} onValueChange={(value) => handleInputChange("occupation", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select occupation" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="whyJoin" className="text-sm">Why do you want to join? *</Label>
                      <Select value={formData.whyJoin} onValueChange={(value) => handleInputChange("whyJoin", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {whyJoinOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate("/partners")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PartnerApply;
