import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ClaimGarageDialogProps {
  garageId: string;
  garageName: string;
}

export function ClaimGarageDialog({ garageId, garageName }: ClaimGarageDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    claimantName: "",
    claimantPhone: "",
    claimantEmail: "",
    businessProof: "",
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to claim this garage.",
        variant: "destructive",
      });
      navigate("/garage-auth");
      return;
    }

    if (!formData.claimantName || !formData.claimantPhone || !formData.claimantEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if claim already exists
      const { data: existingClaim } = await supabase
        .from("garage_claim_requests")
        .select("id, status")
        .eq("garage_id", garageId)
        .eq("claimant_user_id", user.id)
        .maybeSingle();

      if (existingClaim) {
        toast({
          title: "Claim Already Exists",
          description: `You already have a ${existingClaim.status} claim for this garage.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("garage_claim_requests")
        .insert({
          garage_id: garageId,
          claimant_user_id: user.id,
          claimant_name: formData.claimantName,
          claimant_phone: formData.claimantPhone,
          claimant_email: formData.claimantEmail,
          business_proof: formData.businessProof || null,
        });

      if (error) throw error;

      toast({
        title: "Claim Submitted!",
        description: "Your claim request has been submitted for admin review. We'll notify you once it's processed.",
      });

      setOpen(false);
      setFormData({
        claimantName: "",
        claimantPhone: "",
        claimantEmail: "",
        businessProof: "",
      });
    } catch (error: any) {
      console.error("Error submitting claim:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 w-full">
          <Building2 className="w-4 h-4" />
          Claim This Garage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Claim Garage Ownership
          </DialogTitle>
          <DialogDescription>
            Are you the owner of <strong>{garageName}</strong>? Submit a claim request and our team will verify your ownership.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="claimantName">Full Name *</Label>
            <Input
              id="claimantName"
              placeholder="Enter your full name"
              value={formData.claimantName}
              onChange={(e) => setFormData({ ...formData, claimantName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimantPhone">Phone Number *</Label>
            <Input
              id="claimantPhone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.claimantPhone}
              onChange={(e) => setFormData({ ...formData, claimantPhone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimantEmail">Email Address *</Label>
            <Input
              id="claimantEmail"
              type="email"
              placeholder="Enter your email"
              value={formData.claimantEmail}
              onChange={(e) => setFormData({ ...formData, claimantEmail: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessProof">
              Proof of Ownership (Optional)
            </Label>
            <Textarea
              id="businessProof"
              placeholder="Describe any documents or information that proves your ownership (e.g., business registration, GST number, etc.)"
              value={formData.businessProof}
              onChange={(e) => setFormData({ ...formData, businessProof: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Our team may contact you for verification documents.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Claim"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
