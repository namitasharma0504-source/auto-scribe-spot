import { useState, useEffect } from "react";
import { 
  Rocket, Sparkles, Tag, Percent, Gift, Package, Plus, 
  Facebook, Instagram, Check, X, Loader2, AlertCircle,
  Calendar, Trash2, Megaphone, ExternalLink, Shield,
  Sun, Snowflake, PartyPopper, Zap, Heart, Star, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface BoostPanelProps {
  garageId: string | null;
  garageName: string;
}

interface Offer {
  id: string;
  template_type: string;
  title: string;
  description: string | null;
  discount_value: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  is_promoted_to_meta: boolean;
  meta_ad_id: string | null;
}

interface MetaCredentials {
  is_verified: boolean;
  meta_ad_account_id: string | null;
  meta_page_id: string | null;
  last_verified_at: string | null;
}

// Basic offer types
const basicTemplates = [
  { 
    type: 'percentage_off', 
    label: '% Off', 
    icon: Percent, 
    color: 'bg-red-500',
    defaultTitle: 'Get {value}% Off',
    placeholder: '20',
    defaultDescription: 'Limited time discount on all services'
  },
  { 
    type: 'flat_discount', 
    label: 'Flat Discount', 
    icon: Tag, 
    color: 'bg-green-500',
    defaultTitle: 'Flat ₹{value} Off',
    placeholder: '500',
    defaultDescription: 'Save big on your next service'
  },
  { 
    type: 'free_service', 
    label: 'Free Service', 
    icon: Gift, 
    color: 'bg-purple-500',
    defaultTitle: 'Free {value}',
    placeholder: 'Car Wash',
    defaultDescription: 'Complimentary service with any booking'
  },
  { 
    type: 'bundle_deal', 
    label: 'Bundle Deal', 
    icon: Package, 
    color: 'bg-blue-500',
    defaultTitle: 'Bundle: {value}',
    placeholder: 'Oil Change + Filter',
    defaultDescription: 'Multiple services at special price'
  },
];

// Seasonal themed templates
const seasonalTemplates = [
  { 
    type: 'diwali_special', 
    label: '🪔 Diwali Special', 
    icon: Sparkles, 
    color: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    defaultTitle: 'Diwali Dhamaka - {value}% Off',
    placeholder: '25',
    defaultDescription: 'Celebrate with sparkling savings! Get your car festival-ready',
    emoji: '🪔'
  },
  { 
    type: 'summer_cool', 
    label: '☀️ Summer Cool', 
    icon: Sun, 
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    defaultTitle: 'Summer AC Special - {value}',
    placeholder: '₹999 AC Service',
    defaultDescription: 'Beat the heat! AC checkup & gas refill at special price',
    emoji: '☀️'
  },
  { 
    type: 'winter_carnival', 
    label: '❄️ Winter Carnival', 
    icon: Snowflake, 
    color: 'bg-gradient-to-r from-blue-400 to-cyan-500',
    defaultTitle: 'Winter Care Package - {value}',
    placeholder: '₹1499',
    defaultDescription: 'Prepare your car for winter with complete checkup',
    emoji: '❄️'
  },
  { 
    type: 'new_year', 
    label: '🎉 New Year', 
    icon: PartyPopper, 
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    defaultTitle: 'New Year Special - {value}% Off',
    placeholder: '30',
    defaultDescription: 'Start the year with a fresh ride! Limited period offer',
    emoji: '🎉'
  },
  { 
    type: 'flash_sale', 
    label: '⚡ Flash Sale', 
    icon: Zap, 
    color: 'bg-gradient-to-r from-yellow-500 to-red-500',
    defaultTitle: 'Flash Sale - {value}% Off Today Only!',
    placeholder: '40',
    defaultDescription: '24-hour mega discount! Hurry, limited slots available',
    emoji: '⚡'
  },
  { 
    type: 'valentines', 
    label: '💝 Valentine\'s', 
    icon: Heart, 
    color: 'bg-gradient-to-r from-pink-500 to-red-500',
    defaultTitle: 'Love Your Car - {value}',
    placeholder: 'Free Interior Cleaning',
    defaultDescription: 'Show your car some love with our special spa treatment',
    emoji: '💝'
  },
  { 
    type: 'weekend_special', 
    label: '🌟 Weekend Special', 
    icon: Star, 
    color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    defaultTitle: 'Weekend Warrior - {value}% Off',
    placeholder: '15',
    defaultDescription: 'Exclusive weekend discounts on all services',
    emoji: '🌟'
  },
  { 
    type: 'monsoon_ready', 
    label: '🌧️ Monsoon Ready', 
    icon: Flame, 
    color: 'bg-gradient-to-r from-teal-500 to-blue-500',
    defaultTitle: 'Monsoon Care - {value}',
    placeholder: '₹799 Checkup',
    defaultDescription: 'Prepare for rains! Wiper, brake & tyre inspection',
    emoji: '🌧️'
  },
];

const allTemplates = [...basicTemplates, ...seasonalTemplates];

export function BoostPanel({ garageId, garageName }: BoostPanelProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [metaCredentials, setMetaCredentials] = useState<MetaCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isVerifyingMeta, setIsVerifyingMeta] = useState(false);
  const [isPushingAd, setIsPushingAd] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMetaDialog, setShowMetaDialog] = useState(false);
  const { toast } = useToast();

  // New offer form state
  const [newOffer, setNewOffer] = useState({
    template_type: 'percentage_off',
    title: '',
    description: '',
    discount_value: '',
    valid_until: '',
  });

  // Meta credentials form state
  const [metaForm, setMetaForm] = useState({
    meta_access_token: '',
    meta_ad_account_id: '',
    meta_page_id: '',
  });

  useEffect(() => {
    if (garageId) {
      fetchOffers();
      fetchMetaCredentials();
    } else {
      setIsLoading(false);
    }
  }, [garageId]);

  const fetchOffers = async () => {
    if (!garageId) return;
    
    const { data, error } = await supabase
      .from('garage_offers')
      .select('*')
      .eq('garage_id', garageId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOffers(data as Offer[]);
    }
    setIsLoading(false);
  };

  const fetchMetaCredentials = async () => {
    if (!garageId) return;

    const { data, error } = await supabase
      .from('garage_meta_credentials')
      .select('is_verified, meta_ad_account_id, meta_page_id, last_verified_at')
      .eq('garage_id', garageId)
      .single();

    if (!error && data) {
      setMetaCredentials(data as MetaCredentials);
    }
  };

  const handleCreateOffer = async () => {
    if (!garageId) {
      toast({
        title: "No Garage",
        description: "Please save your garage profile first.",
        variant: "destructive",
      });
      return;
    }

    if (!newOffer.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter an offer title.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOffer(true);
    try {
      const { error } = await supabase
        .from('garage_offers')
        .insert({
          garage_id: garageId,
          template_type: newOffer.template_type,
          title: newOffer.title,
          description: newOffer.description || null,
          discount_value: newOffer.discount_value || null,
          valid_until: newOffer.valid_until || null,
        });

      if (error) throw error;

      toast({
        title: "Offer Created!",
        description: "Your offer is now visible to customers.",
      });

      setShowCreateDialog(false);
      setNewOffer({
        template_type: 'percentage_off',
        title: '',
        description: '',
        discount_value: '',
        valid_until: '',
      });
      fetchOffers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingOffer(false);
    }
  };

  const handleToggleOffer = async (offerId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('garage_offers')
      .update({ is_active: !isActive })
      .eq('id', offerId);

    if (!error) {
      fetchOffers();
      toast({
        title: isActive ? "Offer Paused" : "Offer Activated",
        description: isActive ? "Offer is now hidden from customers." : "Offer is now visible to customers.",
      });
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    const { error } = await supabase
      .from('garage_offers')
      .delete()
      .eq('id', offerId);

    if (!error) {
      fetchOffers();
      toast({
        title: "Offer Deleted",
        description: "The offer has been removed.",
      });
    }
  };

  const handleVerifyMeta = async () => {
    if (!garageId) return;

    if (!metaForm.meta_access_token || !metaForm.meta_ad_account_id) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your Access Token and Ad Account ID.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingMeta(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('meta-ads', {
        body: {
          action: 'verify',
          garage_id: garageId,
          credentials: metaForm,
        },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data.success) {
        toast({
          title: "Meta Connected!",
          description: `Connected to account: ${response.data.account_name}`,
        });
        setShowMetaDialog(false);
        fetchMetaCredentials();
      } else {
        throw new Error(response.data.error || 'Verification failed');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifyingMeta(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!garageId) return;

    try {
      const response = await supabase.functions.invoke('meta-ads', {
        body: {
          action: 'disconnect',
          garage_id: garageId,
        },
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Disconnected",
        description: "Meta account has been disconnected.",
      });
      setMetaCredentials(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePushToMeta = async (offerId: string) => {
    if (!garageId || !metaCredentials?.is_verified) {
      toast({
        title: "Connect Meta First",
        description: "Please connect your Meta account before pushing ads.",
        variant: "destructive",
      });
      return;
    }

    setIsPushingAd(offerId);
    try {
      const response = await supabase.functions.invoke('meta-ads', {
        body: {
          action: 'push_ad',
          garage_id: garageId,
          offer_id: offerId,
        },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data.success) {
        toast({
          title: "Ad Created!",
          description: response.data.message,
        });
        fetchOffers();
      } else {
        throw new Error(response.data.error || 'Failed to push ad');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPushingAd(null);
    }
  };

  const selectedTemplate = allTemplates.find(t => t.type === newOffer.template_type);

  if (!garageId) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Save your garage profile first to access Boost features.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Chamkeela Effect */}
      <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_ease-in-out_infinite]" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Rocket className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                Boost Your Garage
                <Sparkles className="w-5 h-5 text-star animate-pulse" />
              </CardTitle>
              <CardDescription className="text-base">
                Create offers & promote on Facebook/Instagram
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Offer Button */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Create New Offer</h3>
                    <p className="text-sm text-muted-foreground">Use templates to publish offers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
              <DialogDescription>Choose a template and customize your offer</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
              {/* Template Selection with Tabs */}
              <div className="space-y-2">
                <Label>Offer Type</Label>
                <Tabs defaultValue="seasonal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="seasonal" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      Seasonal
                    </TabsTrigger>
                    <TabsTrigger value="basic" className="gap-1">
                      <Tag className="w-3 h-3" />
                      Basic
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="seasonal" className="mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {seasonalTemplates.map((template) => (
                        <button
                          key={template.type}
                          onClick={() => setNewOffer({ 
                            ...newOffer, 
                            template_type: template.type,
                            description: template.defaultDescription || ''
                          })}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                            newOffer.template_type === template.type 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${template.color} flex items-center justify-center flex-shrink-0`}>
                            <template.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium leading-tight">{template.label}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="basic" className="mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {basicTemplates.map((template) => (
                        <button
                          key={template.type}
                          onClick={() => setNewOffer({ 
                            ...newOffer, 
                            template_type: template.type,
                            description: template.defaultDescription || ''
                          })}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            newOffer.template_type === template.type 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${template.color} flex items-center justify-center`}>
                            <template.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium">{template.label}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Offer Title */}
              <div className="space-y-2">
                <Label htmlFor="offer-title">Offer Title</Label>
                <Input
                  id="offer-title"
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                  placeholder={selectedTemplate?.defaultTitle.replace('{value}', selectedTemplate.placeholder)}
                />
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="discount-value">Discount Value</Label>
                <Input
                  id="discount-value"
                  value={newOffer.discount_value}
                  onChange={(e) => setNewOffer({ ...newOffer, discount_value: e.target.value })}
                  placeholder={selectedTemplate?.placeholder}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="offer-description">Description (Optional)</Label>
                <Textarea
                  id="offer-description"
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                  placeholder="e.g., Valid on weekdays only, Limited time offer..."
                  rows={2}
                />
              </div>

              {/* Valid Until */}
              <div className="space-y-2">
                <Label htmlFor="valid-until">Valid Until (Optional)</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={newOffer.valid_until}
                  onChange={(e) => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleCreateOffer} 
                disabled={isCreatingOffer}
                className="w-full"
              >
                {isCreatingOffer ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Offer
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Meta Connection Card */}
        <Dialog open={showMetaDialog} onOpenChange={setShowMetaDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    metaCredentials?.is_verified 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    <Facebook className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      Meta Ads
                      {metaCredentials?.is_verified && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {metaCredentials?.is_verified 
                        ? 'Push offers to Facebook & Instagram' 
                        : 'Connect your Meta account'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-500" />
                Connect Meta Ads
              </DialogTitle>
              <DialogDescription>
                Enter your Meta Business credentials to push ads directly
              </DialogDescription>
            </DialogHeader>

            {metaCredentials?.is_verified ? (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-semibold text-foreground">Account Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Ad Account: {metaCredentials.meta_ad_account_id}
                      </p>
                      {metaCredentials.last_verified_at && (
                        <p className="text-xs text-muted-foreground">
                          Verified: {new Date(metaCredentials.last_verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDisconnectMeta}
                  className="w-full"
                >
                  Disconnect Meta Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">How to get these credentials:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://business.facebook.com" target="_blank" className="text-primary hover:underline">Meta Business Suite</a></li>
                    <li>Navigate to Business Settings → System Users</li>
                    <li>Create a token with ads_management permission</li>
                    <li>Copy your Ad Account ID from Ads Manager</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input
                    id="access-token"
                    type="password"
                    value={metaForm.meta_access_token}
                    onChange={(e) => setMetaForm({ ...metaForm, meta_access_token: e.target.value })}
                    placeholder="EAAxxxxxxx..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-account-id">Ad Account ID</Label>
                  <Input
                    id="ad-account-id"
                    value={metaForm.meta_ad_account_id}
                    onChange={(e) => setMetaForm({ ...metaForm, meta_ad_account_id: e.target.value })}
                    placeholder="123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page-id">Facebook Page ID (Optional)</Label>
                  <Input
                    id="page-id"
                    value={metaForm.meta_page_id}
                    onChange={(e) => setMetaForm({ ...metaForm, meta_page_id: e.target.value })}
                    placeholder="123456789"
                  />
                </div>

                <Button 
                  onClick={handleVerifyMeta} 
                  disabled={isVerifyingMeta}
                  className="w-full"
                >
                  {isVerifyingMeta ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Verify & Connect
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Offers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Your Offers
          </CardTitle>
          <CardDescription>Manage your offers and push them to Meta</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No offers yet. Create your first offer to attract more customers!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => {
                const template = allTemplates.find(t => t.type === offer.template_type);
                return (
                  <div 
                    key={offer.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      offer.is_active 
                        ? 'bg-card border-border' 
                        : 'bg-muted/50 border-border/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${template?.color || 'bg-primary'} flex items-center justify-center`}>
                        {template?.icon && <template.icon className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          {offer.title}
                          {offer.is_promoted_to_meta && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                              <Megaphone className="w-3 h-3 mr-1" />
                              On Meta
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {offer.discount_value && <span className="font-medium text-primary">{offer.discount_value}</span>}
                          {offer.description && ` • ${offer.description}`}
                        </p>
                        {offer.valid_until && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            Valid until {new Date(offer.valid_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Push to Meta Button */}
                      {metaCredentials?.is_verified && !offer.is_promoted_to_meta && offer.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePushToMeta(offer.id)}
                          disabled={isPushingAd === offer.id}
                          className="gap-1"
                        >
                          {isPushingAd === offer.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Facebook className="w-4 h-4" />
                              <Instagram className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Toggle Active */}
                      <Switch
                        checked={offer.is_active}
                        onCheckedChange={() => handleToggleOffer(offer.id, offer.is_active)}
                      />
                      
                      {/* Delete */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
