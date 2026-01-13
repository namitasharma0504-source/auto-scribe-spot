import { useState } from "react";
import { Star, Laptop, IndianRupee, QrCode, CheckCircle2, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  garageName: string;
  garageGin: string;
  onUpsellConfirm: (listingId: string, reputationSold: boolean, gmsSold: boolean, paymentIds: { reputation?: string; gms?: string }) => void;
}

const REPUTATION_PRICE = 1500;
const GMS_PRICE = 6000;
const UPI_ID = "merigarage@upi"; // Replace with actual UPI ID

export function UpsellModal({ 
  open, 
  onOpenChange, 
  listingId, 
  garageName, 
  garageGin,
  onUpsellConfirm 
}: UpsellModalProps) {
  const [reputationSold, setReputationSold] = useState(false);
  const [gmsSold, setGmsSold] = useState(false);
  const [reputationPaymentId, setReputationPaymentId] = useState("");
  const [gmsPaymentId, setGmsPaymentId] = useState("");
  const [activeTab, setActiveTab] = useState<string>("reputation");

  const generateUpiLink = (amount: number, note: string) => {
    return `upi://pay?pa=${UPI_ID}&pn=MeriGarage&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied to clipboard");
  };

  const handleConfirm = () => {
    if (reputationSold && !reputationPaymentId.trim()) {
      toast.error("Please enter the Reputation payment transaction ID");
      return;
    }
    if (gmsSold && !gmsPaymentId.trim()) {
      toast.error("Please enter the GMS payment transaction ID");
      return;
    }

    onUpsellConfirm(listingId, reputationSold, gmsSold, {
      reputation: reputationSold ? reputationPaymentId : undefined,
      gms: gmsSold ? gmsPaymentId : undefined,
    });
    
    // Reset
    setReputationSold(false);
    setGmsSold(false);
    setReputationPaymentId("");
    setGmsPaymentId("");
    onOpenChange(false);
  };

  const totalEarning = (reputationSold ? 450 : 0) + (gmsSold ? 1800 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reputation" className="gap-2">
              <Star className="w-4 h-4" />
              Reputation
            </TabsTrigger>
            <TabsTrigger value="gms" className="gap-2">
              <Laptop className="w-4 h-4" />
              GMS Software
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reputation" className="space-y-4 pt-4">
            <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
              <h3 className="font-semibold text-purple-700">Reputation Management</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">₹{REPUTATION_PRICE}/year</p>
              <p className="text-sm text-muted-foreground mt-1">Your commission: <span className="font-semibold text-emerald-600">₹450</span></p>
            </div>

            <div className="flex justify-center p-4 bg-card rounded-xl border">
              <QRCodeSVG 
                value={generateUpiLink(REPUTATION_PRICE, `REP-${garageGin}`)} 
                size={180}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">UPI ID:</span>
              <code className="font-mono">{UPI_ID}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={copyUpiId}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Checkbox 
                id="rep-sold" 
                checked={reputationSold} 
                onCheckedChange={(checked) => setReputationSold(!!checked)} 
              />
              <Label htmlFor="rep-sold" className="flex-1 cursor-pointer">
                Payment received from garage owner
              </Label>
            </div>

            {reputationSold && (
              <div className="space-y-2">
                <Label htmlFor="rep-txn">Transaction ID / Reference</Label>
                <Input
                  id="rep-txn"
                  placeholder="Enter payment reference"
                  value={reputationPaymentId}
                  onChange={(e) => setReputationPaymentId(e.target.value)}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="gms" className="space-y-4 pt-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <h3 className="font-semibold text-blue-700">Garage Management Software</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{GMS_PRICE}/year</p>
              <p className="text-sm text-muted-foreground mt-1">Your commission: <span className="font-semibold text-emerald-600">₹1,800</span></p>
            </div>

            <div className="flex justify-center p-4 bg-card rounded-xl border">
              <QRCodeSVG 
                value={generateUpiLink(GMS_PRICE, `GMS-${garageGin}`)} 
                size={180}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">UPI ID:</span>
              <code className="font-mono">{UPI_ID}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={copyUpiId}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>

            <a 
              href="https://merigarage.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Demo the software
            </a>

            <div className="flex items-center gap-3 pt-2">
              <Checkbox 
                id="gms-sold" 
                checked={gmsSold} 
                onCheckedChange={(checked) => setGmsSold(!!checked)} 
              />
              <Label htmlFor="gms-sold" className="flex-1 cursor-pointer">
                Payment received from garage owner
              </Label>
            </div>

            {gmsSold && (
              <div className="space-y-2">
                <Label htmlFor="gms-txn">Transaction ID / Reference</Label>
                <Input
                  id="gms-txn"
                  placeholder="Enter payment reference"
                  value={gmsPaymentId}
                  onChange={(e) => setGmsPaymentId(e.target.value)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {(reputationSold || gmsSold) && (
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30 mt-4">
            <span className="text-sm text-emerald-700">Your Earning:</span>
            <span className="text-lg font-bold text-emerald-600">₹{totalEarning}</span>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Skip for Now
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reputationSold && !gmsSold}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Confirm Sales
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
