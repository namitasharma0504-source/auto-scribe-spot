import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Camera, Search, MapPin, Building2, Gift, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { StarRating } from "@/components/StarRating";
import { ServiceTag } from "@/components/ServiceTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "ca", label: "Canada" },
];

const cities: Record<string, { value: string; label: string }[]> = {
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
  const [city, setCity] = useState("");
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

  const handleSubmit = () => {
    if (!garageName.trim()) {
      toast({
        title: "Garage Name Required",
        description: "Please enter the name of the garage you visited.",
        variant: "destructive",
      });
      return;
    }

    if (!country || !city) {
      toast({
        title: "Location Required",
        description: "Please select the country and city of the garage.",
        variant: "destructive",
      });
      return;
    }

    if (overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select an overall rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (reviewText.trim().length < 20) {
      toast({
        title: "Review Too Short",
        description: "Please write at least 20 characters in your review.",
        variant: "destructive",
      });
      return;
    }

    const points = receiptUploaded ? 50 : 25;
    
    toast({
      title: "Review Submitted!",
      description: `Thank you for sharing your experience. You earned ${points} points!`,
    });

    setTimeout(() => {
      navigate("/");
    }, 2000);
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
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Garage Name *
                </label>
                <Input
                  placeholder="Enter the garage name"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Country *
                  </label>
                  <Select value={country} onValueChange={(v) => { setCountry(v); setCity(""); }}>
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
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    City *
                  </label>
                  <Select value={city} onValueChange={setCity} disabled={!country}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {country && cities[country]?.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Overall Rating *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <StarRating
                  rating={overallRating}
                  size="lg"
                  interactive
                  onRatingChange={setOverallRating}
                />
                <p className="text-muted-foreground">
                  {overallRating === 0 && "Click to rate"}
                  {overallRating === 1 && "Poor"}
                  {overallRating === 2 && "Fair"}
                  {overallRating === 3 && "Good"}
                  {overallRating === 4 && "Very Good"}
                  {overallRating === 5 && "Excellent"}
                </p>
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
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Your Review *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Tell others about your experience. What service did you get? How was the quality? Would you recommend this garage?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {reviewText.length}/500 characters (minimum 20)
              </p>
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
