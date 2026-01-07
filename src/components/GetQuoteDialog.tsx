import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface GetQuoteDialogProps {
  garageName: string;
  garageId: string;
  variant?: "primary" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function GetQuoteDialog({
  garageName,
  garageId,
  variant = "primary",
  size = "default",
  className,
}: GetQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    service: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !user) {
      toast({
        title: "Login Required",
        description: "Please login to request a quote.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setOpen(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("garage_leads")
        .insert({
          garage_id: garageId,
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email || null,
          vehicle_details: formData.vehicle || null,
          service_required: formData.service,
        });

      if (error) throw error;

      toast({
        title: "Quote Request Sent!",
        description: `Your request has been received. ${garageName} or our team will contact you shortly.`,
      });

      setFormData({
        name: "",
        phone: "",
        email: "",
        vehicle: "",
        service: "",
      });
      setOpen(false);
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Error",
        description: "Failed to send quote request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant={variant === "primary" ? "default" : "outline"} 
          size={size}
          className={className}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Get Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get a Quote from {garageName}</DialogTitle>
          <DialogDescription>
            Fill in your details and we'll get you a quote as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input 
              id="name" 
              placeholder="Enter your name" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="Enter your phone number" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Enter your email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle Details</Label>
            <Input 
              id="vehicle" 
              placeholder="e.g., Maruti Swift 2020" 
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">Service Required *</Label>
            <Textarea 
              id="service" 
              placeholder="Describe the service or issue you need help with..."
              className="min-h-[80px]"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              required 
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Quote Request
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
