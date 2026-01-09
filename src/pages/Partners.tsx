import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";
import { 
  Users, 
  Camera, 
  TrendingUp, 
  Laptop, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  Target,
  Star,
  Handshake,
  IndianRupee,
  FileCheck
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

const Partners = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    customCity: "",
    education: "",
    whyJoin: "",
    garageNetwork: "",
    estimatedGarages: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplication, setShowApplication] = useState(false);

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
      // Using type assertion since the types may not be regenerated yet
      const { error } = await supabase.from("partner_applications" as any).insert({
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        state: indiaStates.find(s => s.value === formData.state)?.label || formData.state,
        city: formData.city === "other" ? formData.customCity.trim() : (cities.find(c => c.value === formData.city)?.label || formData.city),
        education: educationOptions.find(e => e.value === formData.education)?.label || formData.education,
        why_join: whyJoinOptions.find(w => w.value === formData.whyJoin)?.label || formData.whyJoin,
        garage_network: formData.garageNetwork.trim(),
        estimated_garages: formData.estimatedGarages.trim(),
      });

      if (error) throw error;

      toast.success("Application submitted successfully! We'll contact you soon.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        state: "",
        city: "",
        customCity: "",
        education: "",
        whyJoin: "",
        garageNetwork: "",
        estimatedGarages: "",
      });
      setShowApplication(false);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Handshake className="w-3 h-3 mr-1" />
              Partner Program
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Become a <span className="text-primary">MeriGarage Partner</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Work from home, earn daily. Join India's largest garage discovery platform as a partner and unlock multiple income streams.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-sm">
                <Laptop className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Work From Home</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-sm">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Flexible Hours</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-sm">
                <Wallet className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">Daily Earnings</span>
              </div>
            </div>
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => setShowApplication(true)}
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple 3-step process to become a MeriGarage Partner
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mb-2">Step 1</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Apply Online</h3>
              <p className="text-muted-foreground text-sm">
                Fill out the application form with your details and submit your request to join the program.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent mb-2">Step 2</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Interview Process</h3>
              <p className="text-muted-foreground text-sm">
                Once shortlisted, you'll go through a brief interview to understand your skills and availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-success" />
              </div>
              <div className="text-2xl font-bold text-success mb-2">Step 3</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Start Earning</h3>
              <p className="text-muted-foreground text-sm">
                Get selected and start working from home on various tasks. Earn daily based on your performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Earning Opportunities */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Earning Opportunities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three ways to earn as a MeriGarage Partner
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Task 1: Data Collection */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                Daily Pay
              </div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Data Collection</CardTitle>
                <CardDescription>Build India's garage database</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Collect visiting cards from local garages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Upload garage info on MeriGarage portal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Click pictures of shop board & upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Add location pin & save listing</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <IndianRupee className="w-4 h-4" />
                    <span>Earn per garage added daily</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task 2: Reputation Management Sales */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-accent/30">
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                Commission
              </div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Reputation Sales</CardTitle>
                <CardDescription>Sell listing subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Pitch garage listing as reputation tool</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Help garage owners claim their listing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Explain benefits of verified profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Close subscription deals</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-accent font-semibold">
                    <IndianRupee className="w-4 h-4" />
                    <span>Handsome commission per sale</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task 3: GMS Sales */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-success/30">
              <div className="absolute top-0 right-0 bg-success text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                High Earnings
              </div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-xl">GMS Software Sales</CardTitle>
                <CardDescription>Sell garage management system</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Pitch MeriGarage Management System</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Demo software features to owners</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Help with onboarding & setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Close software deals</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-success font-semibold">
                    <IndianRupee className="w-4 h-4" />
                    <span>Highest commission per sale</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-8">
            * Exact earning amounts will be disclosed after you join the program
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Become a Partner?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Laptop className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">100% Remote</h3>
              <p className="text-sm text-muted-foreground">Work from anywhere, anytime. No office required.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Flexible Schedule</h3>
              <p className="text-sm text-muted-foreground">Choose your own hours. Perfect for students & part-timers.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Multiple Income Streams</h3>
              <p className="text-sm text-muted-foreground">Daily pay + commissions from sales.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Growth Opportunity</h3>
              <p className="text-sm text-muted-foreground">Build skills in sales, tech & automotive industry.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      {showApplication && (
        <section id="apply" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Partner Application</CardTitle>
                <CardDescription>
                  Fill in your details to apply for the MeriGarage Partner Program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Personal Details
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
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

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Mobile Number *</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="education">Education *</Label>
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
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Location
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="city">City/District</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="customCity">Enter Your City/Village Name</Label>
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

                  {/* Program Interest */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      About You
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whyJoin">Why do you want to join this program? *</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="garageNetwork">
                        What is your network in garages of your city?
                      </Label>
                      <Textarea
                        id="garageNetwork"
                        placeholder="E.g., I know 5-10 garage owners personally, or I frequently visit garages in my area..."
                        value={formData.garageNetwork}
                        onChange={(e) => handleInputChange("garageNetwork", e.target.value)}
                        maxLength={500}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedGarages">
                        How many garages do you think are there in your city?
                      </Label>
                      <Input
                        id="estimatedGarages"
                        placeholder="E.g., Around 100-150 garages"
                        value={formData.estimatedGarages}
                        onChange={(e) => handleInputChange("estimatedGarages", e.target.value)}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowApplication(false)}
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
      )}

      {/* CTA Section */}
      {!showApplication && (
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join hundreds of partners across India who are already earning with MeriGarage
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => setShowApplication(true)}
            >
              Apply for Partner Program
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Partners;
