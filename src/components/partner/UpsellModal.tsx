import { useState, useEffect, useRef } from "react";
import { Star, Laptop, QrCode, Upload, X, Image as ImageIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  garageName: string;
  garageGin: string;
  preselectedService?: 'reputation' | 'gms';
  onUpsellConfirm: (listingId: string, reputationSold: boolean, gmsSold: boolean, paymentIds: { reputation?: string; gms?: string }, paymentProofUrl?: string) => void;
}

const REPUTATION_PRICE = 1500;
const GMS_PRICE = 6000;
const COMBINED_PRICE = 7500;
const REPUTATION_COMMISSION = 450;
const GMS_COMMISSION = 1800;
const COMBINED_COMMISSION = 2250;

export function UpsellModal({ 
  open, 
  onOpenChange, 
  listingId, 
  garageName, 
  garageGin,
  preselectedService,
  onUpsellConfirm 
}: UpsellModalProps) {
  const [reputationSelected, setReputationSelected] = useState(false);
  const [gmsSelected, setGmsSelected] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Pre-select service when modal opens based on which button was clicked
  useEffect(() => {
    if (open && preselectedService) {
      if (preselectedService === 'reputation') {
        setReputationSelected(true);
        setGmsSelected(false);
      } else if (preselectedService === 'gms') {
        setGmsSelected(true);
        setReputationSelected(false);
      }
    }
  }, [open, preselectedService]);

  const getAmountToCollect = () => {
    if (reputationSelected && gmsSelected) return COMBINED_PRICE;
    if (reputationSelected) return REPUTATION_PRICE;
    if (gmsSelected) return GMS_PRICE;
    return 0;
  };

  const getPartnerCommission = () => {
    if (reputationSelected && gmsSelected) return COMBINED_COMMISSION;
    if (reputationSelected) return REPUTATION_COMMISSION;
    if (gmsSelected) return GMS_COMMISSION;
    return 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setPaymentProof(file);
    setUploading(true);

    try {
      // Get current user ID for folder path (required by RLS policy)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proof-${listingId}-${Date.now()}.${fileExt}`;
      // Use user ID as folder name to comply with RLS policy
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the file path (not public URL since bucket is private)
      // Admin will use signed URLs to view
      setPaymentProofUrl(filePath);
      toast.success("Payment proof uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload payment proof: " + (error.message || "Unknown error"));
      setPaymentProof(null);
    } finally {
      setUploading(false);
    }
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    if (!reputationSelected && !gmsSelected) {
      toast.error("Please select at least one service to upsell");
      return;
    }

    if (!paymentDone) {
      toast.error("Please confirm that payment has been received");
      return;
    }

    if (!paymentProofUrl) {
      toast.error("Please upload payment proof");
      return;
    }

    onUpsellConfirm(
      listingId, 
      reputationSelected, 
      gmsSelected, 
      {
        reputation: reputationSelected ? `REP-${garageGin}` : undefined,
        gms: gmsSelected ? `GMS-${garageGin}` : undefined,
      },
      paymentProofUrl
    );
    
    // Reset
    setReputationSelected(false);
    setGmsSelected(false);
    setPaymentDone(false);
    setPaymentProof(null);
    setPaymentProofUrl("");
    onOpenChange(false);
  };

  const amountToCollect = getAmountToCollect();
  const partnerCommission = getPartnerCommission();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            Upsell Services
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{garageName}</span>
            <Badge variant="outline" className="ml-2 font-mono">{garageGin}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Service Selection */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">SELECT SERVICES TO SELL</h4>
            
            {/* Reputation Management Option */}
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                reputationSelected 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-border hover:border-purple-300'
              }`}
              onClick={() => setReputationSelected(!reputationSelected)}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={reputationSelected} 
                  onCheckedChange={(checked) => setReputationSelected(!!checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold">Reputation Management</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Collect <span className="font-bold text-purple-600">₹{REPUTATION_PRICE}</span> from garage
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Your commission: ₹{REPUTATION_COMMISSION}</p>
                </div>
              </div>
            </div>

            {/* GMS Software Option */}
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                gmsSelected 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-border hover:border-blue-300'
              }`}
              onClick={() => setGmsSelected(!gmsSelected)}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={gmsSelected} 
                  onCheckedChange={(checked) => setGmsSelected(!!checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">GMS Software</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Collect <span className="font-bold text-blue-600">₹{GMS_PRICE}</span> from garage
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Your commission: ₹{GMS_COMMISSION}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          {(reputationSelected || gmsSelected) && (
            <>
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/30">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Amount to Collect from Garage</p>
                  <p className="text-4xl font-bold text-foreground mt-1">₹{amountToCollect.toLocaleString()}</p>
                  {reputationSelected && gmsSelected && (
                    <p className="text-xs text-muted-foreground mt-1">(₹{REPUTATION_PRICE} + ₹{GMS_PRICE} = ₹{COMBINED_PRICE})</p>
                  )}
                </div>
              </div>

              {/* QR Code for Payment */}
              <div className="text-center">
                <p className="text-sm font-medium mb-3">Scan QR Code for Payment</p>
                <div className="inline-block p-4 bg-card rounded-xl border">
                  {/* Dummy QR Code placeholder */}
                  <div className="w-44 h-44 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-xs text-gray-500 mt-2">UPI QR Code</p>
                      <p className="text-xs font-bold text-purple-600">₹{amountToCollect}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  UPI ID: merigarage@upi
                </p>
              </div>

              {/* Payment Proof Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Payment Proof</Label>
                {!paymentProof ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <div className="flex justify-center gap-4">
                      {/* Camera Capture Button */}
                      <div 
                        className="flex flex-col items-center justify-center p-4 cursor-pointer rounded-xl border-2 border-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-all hover:scale-105"
                        onClick={() => !uploading && cameraInputRef.current?.click()}
                      >
                        <Camera className="h-8 w-8 mb-2 text-purple-600" />
                        <p className="text-sm font-medium text-purple-700">
                          {uploading ? "Uploading..." : "Take Photo"}
                        </p>
                      </div>
                      
                      {/* Gallery Upload Button */}
                      <div 
                        className="flex flex-col items-center justify-center p-4 cursor-pointer rounded-xl border-2 border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 transition-all hover:scale-105"
                        onClick={() => !uploading && fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          From Gallery
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Take a photo or select from gallery (Max 5MB)
                    </p>
                    
                    {/* Camera input - opens device camera */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {/* Gallery input - opens file picker */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <ImageIcon className="w-8 h-8 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{paymentProof.name}</p>
                      <p className="text-xs text-emerald-600">Uploaded successfully</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removePaymentProof} className="h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Confirmation */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="payment-done" 
                  checked={paymentDone} 
                  onCheckedChange={(checked) => setPaymentDone(!!checked)} 
                />
                <Label htmlFor="payment-done" className="flex-1 cursor-pointer text-sm">
                  I confirm that the garage owner has paid ₹{amountToCollect} on given QR code, attaching the payment proof here
                </Label>
              </div>

              {/* Commission Summary */}
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <span className="text-sm text-emerald-700">Your Commission (after admin approval):</span>
                <span className="text-xl font-bold text-emerald-600">₹{partnerCommission}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reputationSelected && !gmsSelected || !paymentDone || !paymentProofUrl}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Submit for Verification
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
