import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Camera } from "lucide-react";
import { Header } from "@/components/Header";
import { StarRating } from "@/components/StarRating";
import { ServiceTag } from "@/components/ServiceTag";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const WriteReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [overallRating, setOverallRating] = useState(0);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

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

  const handleSubmit = () => {
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

    toast({
      title: "Review Submitted!",
      description: "Thank you for sharing your experience.",
    });

    setTimeout(() => {
      navigate(`/garage/${id}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Link */}
        <Link
          to={`/garage/${id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to garage
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Write a Review
          </h1>
          <p className="text-muted-foreground">
            Share your experience at AutoCare Pro Center
          </p>
        </div>

        <div className="space-y-6">
          {/* Overall Rating */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Overall Rating</CardTitle>
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
              <CardTitle className="text-xl">Your Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Tell others about your experience. What did you like? What could be improved?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {reviewText.length}/500 characters
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

          {/* Submit */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full h-14 text-lg rounded-xl shadow-glow"
            >
              Submit Review
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

export default WriteReview;
