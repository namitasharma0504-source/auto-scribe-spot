import { useState, useEffect } from "react";
import { Tag, Percent, Gift, Package, Calendar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Offer {
  id: string;
  template_type: string;
  title: string;
  description: string | null;
  discount_value: string | null;
  valid_until: string | null;
}

interface GarageOffersProps {
  garageId: string;
}

const templateConfig: Record<string, { icon: typeof Tag; color: string; bgColor: string }> = {
  percentage_off: { icon: Percent, color: 'text-red-600', bgColor: 'bg-red-500' },
  flat_discount: { icon: Tag, color: 'text-green-600', bgColor: 'bg-green-500' },
  free_service: { icon: Gift, color: 'text-purple-600', bgColor: 'bg-purple-500' },
  bundle_deal: { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-500' },
};

export function GarageOffers({ garageId }: GarageOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      const { data, error } = await supabase
        .from('garage_offers')
        .select('id, template_type, title, description, discount_value, valid_until')
        .eq('garage_id', garageId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filter out expired offers
        const validOffers = data.filter(offer => {
          if (!offer.valid_until) return true;
          return new Date(offer.valid_until) >= new Date();
        });
        setOffers(validOffers);
      }
      setIsLoading(false);
    };

    if (garageId) {
      fetchOffers();
    }
  }, [garageId]);

  if (isLoading || offers.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-6 border border-primary/20 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-star" />
        <h2 className="text-xl font-semibold text-foreground">Special Offers</h2>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
          {offers.length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {offers.map((offer) => {
          const config = templateConfig[offer.template_type] || templateConfig.percentage_off;
          const IconComponent = config.icon;

          return (
            <div 
              key={offer.id}
              className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{offer.title}</h3>
                {offer.discount_value && (
                  <p className={`text-sm font-medium ${config.color}`}>
                    {offer.discount_value}
                  </p>
                )}
                {offer.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {offer.description}
                  </p>
                )}
                {offer.valid_until && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Calendar className="w-3 h-3" />
                    Valid until {new Date(offer.valid_until).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
