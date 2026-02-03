import { useState } from "react";
import { 
  FileText, 
  Package, 
  UserCog, 
  Sparkles, 
  CheckCircle,
  Phone,
  Calendar,
  TrendingUp,
  BarChart3,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GMSPromoCardProps {
  garageId: string;
  garageName: string;
  garagePhone: string;
  ownerName?: string;
}

export function GMSPromoCard({ garageId, garageName, garagePhone, ownerName }: GMSPromoCardProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const { toast } = useToast();

  const handleRequestDemo = async () => {
    setIsRequesting(true);
    try {
      // Check if a demo request already exists
      const { data: existingRequest } = await supabase
        .from("garage_leads")
        .select("id")
        .eq("garage_id", garageId)
        .eq("service_required", "GMS Demo Request")
        .limit(1);

      if (existingRequest && existingRequest.length > 0) {
        setHasRequested(true);
        toast({
          title: "Request Already Submitted",
          description: "Our team will contact you shortly.",
        });
        return;
      }

      // Create a lead for admin to see
      const { error } = await supabase
        .from("garage_leads")
        .insert({
          garage_id: garageId,
          customer_name: ownerName || garageName,
          customer_phone: garagePhone,
          service_required: "GMS Demo Request",
          vehicle_details: "Garage Management SaaS - Job Cards, Inventory & Staff Management",
          status: "new",
        });

      if (error) throw error;

      setHasRequested(true);
      toast({
        title: "Demo Request Submitted! 🎉",
        description: "Our team will call you within 24 hours to schedule a demo.",
      });
    } catch (error: any) {
      console.error("Error requesting demo:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const features = [
    {
      icon: FileText,
      title: "Digital Job Cards",
      description: "Create & track service records with customer details, photos & signatures",
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track spare parts, get low-stock alerts & manage suppliers",
    },
    {
      icon: UserCog,
      title: "Staff Management",
      description: "Assign roles, manage mechanics & control access with PINs",
    },
    {
      icon: BarChart3,
      title: "Business Analytics",
      description: "Track revenue, popular services & customer visit history",
    },
  ];

  if (hasRequested) {
    return (
      <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-700 mb-2">Demo Request Received!</h3>
          <p className="text-green-600 mb-4">
            Our team will contact you at <strong>{garagePhone}</strong> within 24 hours.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>Or call us directly: <strong>+91 93107 45153</strong></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-purple-50 overflow-hidden">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            Premium Feature
          </Badge>
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Garage Management System
        </CardTitle>
        <CardDescription className="text-base">
          Digitize your garage operations. Manage everything from one dashboard.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg bg-background/80 border border-primary/10"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-background/80 rounded-lg p-4 border border-primary/10">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Why Go Digital?
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Reduce paperwork by 90%</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Never miss a follow-up</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Track parts & prevent theft</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Professional invoices in seconds</span>
            </li>
          </ul>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4 pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Schedule a free demo with our team</span>
          </div>
          
          <Button 
            size="lg" 
            className="w-full md:w-auto px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg h-12 gap-2"
            onClick={handleRequestDemo}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Request Free Demo
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Our team will call you within 24 hours to schedule a demo
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
