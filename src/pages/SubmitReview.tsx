import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Camera, MapPin, Building2, Gift, CheckCircle2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { StarRating } from "@/components/StarRating";
import { ServiceTag } from "@/components/ServiceTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GarageSearchInput } from "@/components/GarageSearchInput";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";
import { cn } from "@/lib/utils";

interface FormErrors {
  garageName?: string;
  country?: string;
  state?: string;
  city?: string;
  overallRating?: string;
  reviewText?: string;
}
const serviceTags = [
  "Quick Service",
  "Professional Staff",
  "Fair Pricing",
  "Friendly",
  "Expert Mechanics",
  "Clean Facility",
  "Good Communication",
  "Honest",
  "On Time",
  "Quality Parts",
];

const categoryRatings = [
  { id: "quality", name: "Service Quality" },
  { id: "pricing", name: "Pricing" },
  { id: "timeliness", name: "Timeliness" },
  { id: "communication", name: "Communication" },
];

const countries = [
  { value: "india", label: "India" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "ca", label: "Canada" },
];

const otherCountryCities: Record<string, { value: string; label: string }[]> = {
  ae: [
    { value: "dubai", label: "Dubai" },
    { value: "abu-dhabi", label: "Abu Dhabi" },
    { value: "sharjah", label: "Sharjah" },
  ],
  us: [
    { value: "new-york", label: "New York" },
    { value: "los-angeles", label: "Los Angeles" },
    { value: "chicago", label: "Chicago" },
  ],
  uk: [
    { value: "london", label: "London" },
    { value: "manchester", label: "Manchester" },
    { value: "birmingham", label: "Birmingham" },
  ],
  de: [
    { value: "berlin", label: "Berlin" },
    { value: "munich", label: "Munich" },
    { value: "frankfurt", label: "Frankfurt" },
  ],
  fr: [
    { value: "paris", label: "Paris" },
    { value: "marseille", label: "Marseille" },
    { value: "lyon", label: "Lyon" },
  ],
  ca: [
    { value: "toronto", label: "Toronto" },
    { value: "vancouver", label: "Vancouver" },
    { value: "montreal", label: "Montreal" },
  ],
};

const SubmitReview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Garage details
  const [garageName, setGarageName] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [address, setAddress] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  
  // Review details
  const [overallRating, setOverallRating] = useState(0);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const isIndia = country === "india";
  const availableStates = isIndia ? indiaStates : [];
  const availableDistricts = isIndia && state ? (indiaDistricts[state] || []) : [];
  const availableCities = !isIndia && country ? (otherCountryCities[country] || []) : [];

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!garageName.trim()) {
      newErrors.garageName = "Please enter the garage name";
    }

    if (!country) {
      newErrors.country = "Please select a country";
    }

    if (isIndia && !state) {
      newErrors.state = "Please select a state";
    }

    const hasCity = city || customCity.trim();
    if (isIndia && state && !hasCity) {
      newErrors.city = "Please select a district or enter a city name";
    } else if (!isIndia && country && !hasCity) {
      newErrors.city = "Please select or enter a city";
    }

    if (overallRating === 0) {
      newErrors.overallRating = "Please select an overall rating";
    }

    if (!reviewText.trim()) {
      newErrors.reviewText = "Please write your review";
    } else if (reviewText.trim().length < 20) {
      newErrors.reviewText = "Review must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToFirstError = () => {
    const errorFields = ['garageName', 'country', 'state', 'city', 'overallRating', 'reviewText'];
    for (const field of errorFields) {
      const element = document.getElementById(`field-${field}`);
      if (element && errors[field as keyof FormErrors]) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setImages((prev) => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReceiptUpload = () => {
    setReceiptUploaded(true);
    toast({
      title: "Receipt Uploaded",
      description: "Your review will be marked as verified once approved.",
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      setTimeout(scrollToFirstError, 100);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit a review.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const points = receiptUploaded ? 50 : 25;
      const countryLabel = countries.find(c => c.value === country)?.label || country;
      
      let locationString = "";
      if (isIndia) {
        const stateLabel = indiaStates.find(s => s.value === state)?.label || state;
        const districtLabel = indiaDistricts[state]?.find(d => d.value === city)?.label || city;
        const cityName = customCity.trim() || districtLabel;
        locationString = `${cityName}, ${stateLabel}, ${countryLabel}`;
      } else {
        const cityLabel = otherCountryCities[country]?.find(c => c.value === city)?.label || city;
        const cityName = customCity.trim() || cityLabel;
        locationString = `${cityName}, ${countryLabel}`;
      }

      // Insert review with pending status
      const { error: insertError } = await supabase
        .from("user_reviews")
        .insert({
          user_id: user.id,
          garage_name: garageName.trim(),
          garage_location: locationString,
          rating: overallRating,
          review_text: reviewText.trim(),
          is_verified: receiptUploaded,
          points_earned: points,
          status: "pending",
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      toast({
        title: "Review Submitted!",
        description: `Thank you for sharing your experience. You earned ${points} points! Your review is pending approval.`,
      });

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Points Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-6 mb-8 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Earn Points for Your Review!</h3>
              <p className="text-muted-foreground">
                Get <span className="font-semibold text-primary">50 points</span> for verified reviews (with receipt) or <span className="font-semibold text-accent">25 points</span> for standard reviews
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Submit a Review
          </h1>
          <p className="text-muted-foreground">
            Tell us about a garage you recently visited
          </p>
        </div>

        <div className="space-y-6">
          {/* Garage Details */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Garage Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="field-garageName">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Garage Name <span className="text-destructive">*</span>
                </label>
                <GarageSearchInput
                  value={garageName}
                  onChange={(val) => {
                    setGarageName(val);
                    clearError('garageName');
                  }}
                  onGarageSelect={(garage) => {
                    clearError('garageName');
                    clearError('country');
                    clearError('state');
                    clearError('city');
                    // Auto-fill location when a garage is selected
                    if (garage.country) {
                      const countryMatch = countries.find(
                        (c) => c.label.toLowerCase() === garage.country?.toLowerCase()
                      );
                      if (countryMatch) {
                        setCountry(countryMatch.value);
                        
                        // For India, try to match state and city
                        if (countryMatch.value === "india" && garage.state) {
                          const stateMatch = indiaStates.find(
                            (s) => s.label.toLowerCase() === garage.state?.toLowerCase()
                          );
                          if (stateMatch) {
                            setState(stateMatch.value);
                            if (garage.city && indiaDistricts[stateMatch.value]) {
                              const districtMatch = indiaDistricts[stateMatch.value].find(
                                (d) => d.label.toLowerCase() === garage.city?.toLowerCase()
                              );
                              if (districtMatch) {
                                setCity(districtMatch.value);
                              } else {
                                setCustomCity(garage.city);
                              }
                            }
                          }
                        } else if (countryMatch.value !== "india" && garage.city && otherCountryCities[countryMatch.value]) {
                          // For other countries
                          const cityMatch = otherCountryCities[countryMatch.value].find(
                            (c) => c.label.toLowerCase() === garage.city?.toLowerCase()
                          );
                          if (cityMatch) {
                            setCity(cityMatch.value);
                          } else {
                            setCustomCity(garage.city);
                          }
                        }
                      }
                    }
                    if (garage.address) {
                      setAddress(garage.address);
                    }
                  }}
                  placeholder="Search for a garage..."
                  className={cn(errors.garageName && "border-destructive ring-destructive/20 ring-2")}
                />
                {errors.garageName ? (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.garageName}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Start typing to search existing garages or enter a new name
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="field-country">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <Select value={country} onValueChange={(v) => { setCountry(v); setState(""); setCity(""); setCustomCity(""); clearError('country'); clearError('state'); clearError('city'); }}>
                    <SelectTrigger className={cn(errors.country && "border-destructive ring-destructive/20 ring-2")}>
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
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.country}
                    </p>
                  )}
                </div>
                
                {isIndia ? (
                  <div id="field-state">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      State <span className="text-destructive">*</span>
                    </label>
                    <Select value={state} onValueChange={(v) => { setState(v); setCity(""); setCustomCity(""); clearError('state'); clearError('city'); }}>
                      <SelectTrigger className={cn(errors.state && "border-destructive ring-destructive/20 ring-2")}>
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
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.state}
                      </p>
                    )}
                  </div>
                ) : (
                  <div id="field-city">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      City <span className="text-destructive">*</span>
                    </label>
                    <Select value={city} onValueChange={(v) => { setCity(v); clearError('city'); }} disabled={!country}>
                      <SelectTrigger className={cn(errors.city && "border-destructive ring-destructive/20 ring-2")}>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.city}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {isIndia && state && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div id="field-city">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      District <span className="text-destructive">*</span>
                    </label>
                    <Select value={city} onValueChange={(v) => { setCity(v); setCustomCity(""); clearError('city'); }}>
                      <SelectTrigger className={cn(errors.city && "border-destructive ring-destructive/20 ring-2")}>
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
                    {errors.city && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.city}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      City/Village/Town (Optional)
                    </label>
                    <Input
                      placeholder="Enter if not in district list"
                      value={customCity}
                      onChange={(e) => { setCustomCity(e.target.value); if (e.target.value.trim()) clearError('city'); }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter specific city/village name if different from district
                    </p>
                  </div>
                </div>
              )}

              {!isIndia && country && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    City/Town (if not listed above)
                  </label>
                  <Input
                    placeholder="Enter city/town name"
                    value={customCity}
                    onChange={(e) => { setCustomCity(e.target.value); if (e.target.value.trim()) clearError('city'); }}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Street Address (Optional)
                </label>
                <Input
                  placeholder="Enter street address if known"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Visit Date
                  </label>
                  <Input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Service Type
                  </label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oil-change">Oil Change</SelectItem>
                      <SelectItem value="brake-repair">Brake Repair</SelectItem>
                      <SelectItem value="engine-repair">Engine Repair</SelectItem>
                      <SelectItem value="tire-service">Tire Service</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="general-maintenance">General Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <Card id="field-overallRating" className={cn("border-0 shadow-md", errors.overallRating && "ring-2 ring-destructive/20 border-destructive")}>
            <CardHeader>
              <CardTitle className="text-xl">Overall Rating <span className="text-destructive">*</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <StarRating
                  rating={overallRating}
                  size="lg"
                  interactive
                  onRatingChange={(r) => { setOverallRating(r); clearError('overallRating'); }}
                />
                {errors.overallRating ? (
                  <p className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.overallRating}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {overallRating === 0 && "Click to rate"}
                    {overallRating === 1 && "Poor"}
                    {overallRating === 2 && "Fair"}
                    {overallRating === 3 && "Good"}
                    {overallRating === 4 && "Very Good"}
                    {overallRating === 5 && "Excellent"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Ratings */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Rate by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryRatings.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-foreground">{cat.name}</span>
                    <StarRating
                      rating={categoryScores[cat.id] || 0}
                      size="md"
                      interactive
                      onRatingChange={(r) =>
                        setCategoryScores((prev) => ({ ...prev, [cat.id]: r }))
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Review Text */}
          <Card id="field-reviewText" className={cn("border-0 shadow-md", errors.reviewText && "ring-2 ring-destructive/20 border-destructive")}>
            <CardHeader>
              <CardTitle className="text-xl">Your Review <span className="text-destructive">*</span></CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Tell others about your experience. What service did you get? How was the quality? Would you recommend this garage?"
                value={reviewText}
                onChange={(e) => { setReviewText(e.target.value); if (e.target.value.trim().length >= 20) clearError('reviewText'); }}
                className={cn("min-h-[150px] resize-none", errors.reviewText && "border-destructive ring-destructive/20 ring-2")}
              />
              {errors.reviewText ? (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.reviewText}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  {reviewText.length}/500 characters (minimum 20)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Service Tags */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">What stood out?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {serviceTags.map((tag) => (
                  <ServiceTag
                    key={tag}
                    label={tag}
                    selectable
                    selected={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Add Photos (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Upload ${index + 1}`}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Upload up to 5 photos
              </p>
            </CardContent>
          </Card>

          {/* Verification - Receipt Upload */}
          <Card className={`border-2 shadow-md transition-colors ${receiptUploaded ? 'border-success bg-success/5' : 'border-dashed border-primary/30'}`}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                {receiptUploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Gift className="w-5 h-5 text-primary" />
                )}
                Verify Your Visit (+25 bonus points)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receiptUploaded ? (
                <div className="flex items-center gap-3 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Receipt uploaded! Your review will be verified.</span>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Upload your service receipt to verify your visit and earn 25 extra points! Verified reviews are highlighted and trusted more by other users.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Receipt
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full h-14 text-lg rounded-xl shadow-glow"
            >
              Submit Review & Earn {receiptUploaded ? '50' : '25'} Points
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              By submitting, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Review Guidelines
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitReview;
