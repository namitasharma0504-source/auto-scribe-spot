import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
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
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Simulate sending quote request
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Quote Request Sent!",
      description: `${garageName} will contact you shortly with a quote.`,
    });

    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Fill in your details and the garage will contact you with a quote.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" placeholder="Enter your name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="Enter your phone number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle Details</Label>
            <Input id="vehicle" placeholder="e.g., Maruti Swift 2020" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">Service Required</Label>
            <Textarea 
              id="service" 
              placeholder="Describe the service or issue you need help with..."
              className="min-h-[80px]"
              required 
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              "Sending..."
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
