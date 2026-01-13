import { useState } from "react";
import { Star, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PartnerFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  onFeedbackSubmitted: () => void;
}

const ratingCategories = [
  { id: "overall", label: "Overall Experience" },
  { id: "ease_of_use", label: "Ease of Use" },
  { id: "earning_potential", label: "Earning Potential" },
  { id: "payment_transparency", label: "Payment Transparency" },
  { id: "support_quality", label: "Support Quality" },
];

export function PartnerFeedbackModal({
  open,
  onOpenChange,
  partnerId,
  onFeedbackSubmitted,
}: PartnerFeedbackModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    overall: 0,
    ease_of_use: 0,
    earning_potential: 0,
    payment_transparency: 0,
    support_quality: 0,
  });
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});

  const handleRating = (category: string, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("partner_feedback").insert({
        partner_id: partnerId,
        overall_rating: ratings.overall,
        ease_of_use_rating: ratings.ease_of_use || null,
        earning_potential_rating: ratings.earning_potential || null,
        payment_transparency_rating: ratings.payment_transparency || null,
        support_quality_rating: ratings.support_quality || null,
        written_feedback: feedback.trim() || null,
        suggestions: suggestions.trim() || null,
      });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      onFeedbackSubmitted();
      onOpenChange(false);
      
      // Reset form
      setRatings({
        overall: 0,
        ease_of_use: 0,
        earning_potential: 0,
        payment_transparency: 0,
        support_quality: 0,
      });
      setFeedback("");
      setSuggestions("");
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (category: string) => {
    const currentRating = ratings[category];
    const hovered = hoveredStars[category] || 0;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRating(category, star)}
            onMouseEnter={() => setHoveredStars((prev) => ({ ...prev, [category]: star }))}
            onMouseLeave={() => setHoveredStars((prev) => ({ ...prev, [category]: 0 }))}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hovered || currentRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Rate the Partner Program
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Categories */}
          {ratingCategories.map((category, index) => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={index === 0 ? "font-semibold" : ""}>
                  {category.label}
                  {index === 0 && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderStars(category.id)}
              </div>
              {index === 0 && <hr className="mt-4" />}
            </div>
          ))}

          {/* Written Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">What do you like about the program?</Label>
            <Textarea
              id="feedback"
              placeholder="Share your positive experiences..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label htmlFor="suggestions">Any suggestions for improvement?</Label>
            <Textarea
              id="suggestions"
              placeholder="How can we make this better for you?"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || ratings.overall === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            {isSubmitting ? "Submitting..." : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
