import { useState } from "react";
import { AlertTriangle, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  gin: string;
  garageName: string;
  partnerId: string;
  rejectionReason: string | null;
  onDisputeSubmitted: () => void;
}

export function DisputeModal({
  open,
  onOpenChange,
  listingId,
  gin,
  garageName,
  partnerId,
  rejectionReason,
  onDisputeSubmitted,
}: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 5MB allowed.`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `disputes/${partnerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("partner-documents")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("partner-documents")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setEvidence((prev) => [...prev, ...uploadedUrls]);
      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} file(s) uploaded`);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeEvidence = (url: string) => {
    setEvidence((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("disputes").insert({
        partner_id: partnerId,
        listing_id: listingId,
        gin: gin,
        reason: reason.trim(),
        supporting_evidence: evidence.length > 0 ? evidence : null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Dispute submitted successfully");
      onDisputeSubmitted();
      onOpenChange(false);
      setReason("");
      setEvidence([]);
    } catch (error: any) {
      console.error("Error submitting dispute:", error);
      toast.error(error.message || "Failed to submit dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Dispute Rejection
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{garageName}</span>
            <Badge variant="outline" className="ml-2 font-mono">
              {gin}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {rejectionReason && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
            <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
            <p className="text-sm text-red-600 mt-1">{rejectionReason}</p>
          </div>
        )}

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="dispute-reason">Why do you disagree with the rejection?</Label>
            <Textarea
              id="dispute-reason"
              placeholder="Explain why you believe this listing should be approved..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Supporting Evidence (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {evidence.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                >
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[100px] truncate">Evidence {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeEvidence(url)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              {isUploading ? (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Upload photos or documents
                  </span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Max 5MB per file. JPG, PNG, PDF accepted.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? "Submitting..." : "Submit Dispute"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
