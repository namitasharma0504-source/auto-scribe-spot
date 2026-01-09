import { useState } from "react";
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, Mail, MessageCircle, QrCode, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

interface ShareDialogProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export function ShareDialog({ url, title, description, className }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fullUrl = url.startsWith("http") ? url : `https://merigaragereviews.com${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
      } catch (err) {
        // User cancelled or share failed silently
      }
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("share-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${title.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share {title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 mt-4">
            {/* Copy Link */}
            <div className="flex items-center gap-2">
              <Input
                value={fullUrl}
                readOnly
                className="flex-1 text-sm bg-secondary/50"
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-5 gap-3">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors group"
              >
                <MessageCircle className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-muted-foreground">WhatsApp</span>
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
              >
                <Facebook className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-muted-foreground">Facebook</span>
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 transition-colors group"
              >
                <Twitter className="w-6 h-6 text-sky-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-muted-foreground">Twitter</span>
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-700/10 hover:bg-blue-700/20 transition-colors group"
              >
                <Linkedin className="w-6 h-6 text-blue-700 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-muted-foreground">LinkedIn</span>
              </a>
              <a
                href={shareLinks.email}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 transition-colors group"
              >
                <Mail className="w-6 h-6 text-gray-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-muted-foreground">Email</span>
              </a>
            </div>

            {/* Native Share (Mobile) */}
            {typeof navigator !== "undefined" && navigator.share && (
              <Button onClick={handleNativeShare} className="w-full gap-2">
                <Share2 className="w-4 h-4" />
                More Sharing Options
              </Button>
            )}
          </TabsContent>

          <TabsContent value="qr" className="mt-4">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-md">
                <QRCodeSVG
                  id="share-qr-code"
                  value={fullUrl}
                  size={200}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: "/favicon.png",
                    x: undefined,
                    y: undefined,
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to open the garage page
              </p>
              <Button onClick={downloadQRCode} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download QR Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
