import { useState, useEffect } from "react";
import { Building2, Loader2, Upload, X, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ClaimGarageDialogProps {
  garageId: string;
  garageName: string;
}

interface ExistingClaim {
  id: string;
  status: string;
  created_at: string;
}

export function ClaimGarageDialog({ garageId, garageName }: ClaimGarageDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingClaim, setExistingClaim] = useState<ExistingClaim | null>(null);
  const [checkingClaim, setCheckingClaim] = useState(false);
  const [formData, setFormData] = useState({
    claimantName: "",
    claimantPhone: "",
    claimantEmail: "",
    businessProof: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for existing claim when user is logged in
  useEffect(() => {
    const checkExistingClaim = async () => {
      if (!user) {
        setExistingClaim(null);
        return;
      }

      setCheckingClaim(true);
      try {
        const { data, error } = await supabase
          .from("garage_claim_requests")
          .select("id, status, created_at")
          .eq("garage_id", garageId)
          .eq("claimant_user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking claim:", error);
        } else {
          setExistingClaim(data);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setCheckingClaim(false);
      }
    };

    checkExistingClaim();
  }, [user, garageId]);

  // Pre-fill form with user data when dialog opens
  useEffect(() => {
    const prefillUserData = async () => {
      if (!user || !open) return;

      // Pre-fill email from auth
      const userEmail = user.email || "";

      // Fetch profile for full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch garage owner data for phone if available
      const { data: garageOwner } = await supabase
        .from("garage_owners")
        .select("contact_phone, business_name")
        .eq("user_id", user.id)
        .maybeSingle();

      setFormData(prev => ({
        ...prev,
        claimantEmail: userEmail,
        claimantName: profile?.full_name || prev.claimantName,
        claimantPhone: garageOwner?.contact_phone || prev.claimantPhone,
      }));
    };

    prefillUserData();
  }, [user, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB limit.`,
          variant: "destructive",
        });
        continue;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not supported. Use JPG, PNG, WEBP, or PDF.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    // Max 3 files
    const totalFiles = [...uploadedFiles, ...validFiles].slice(0, 3);
    setUploadedFiles(totalFiles);
    
    // Reset input
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string): Promise<string[]> => {
    if (uploadedFiles.length === 0) return [];

    const urls: string[] = [];
    
    for (const file of uploadedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${garageId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('claim-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload ${file.name}`);
      }

      urls.push(fileName);
    }

    return urls;
  };

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

    if (uploadedFiles.length === 0) {
      toast({
        title: "Document Required",
        description: "Please upload at least one proof of ownership document (e.g., GST certificate, business registration, utility bill).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files first
      setIsUploading(true);
      const fileUrls = await uploadFiles(user.id);
      setIsUploading(false);

      // Combine text proof with file URLs
      const proofData = {
        description: formData.businessProof || null,
        documents: fileUrls
      };

      const { error } = await supabase
        .from("garage_claim_requests")
        .insert({
          garage_id: garageId,
          claimant_user_id: user.id,
          claimant_name: formData.claimantName,
          claimant_phone: formData.claimantPhone,
          claimant_email: formData.claimantEmail,
          business_proof: JSON.stringify(proofData),
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
      setUploadedFiles([]);
      
      // Refresh existing claim status
      const { data } = await supabase
        .from("garage_claim_requests")
        .select("id, status, created_at")
        .eq("garage_id", garageId)
        .eq("claimant_user_id", user.id)
        .maybeSingle();
      
      setExistingClaim(data);
    } catch (error: any) {
      console.error("Error submitting claim:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const getStatusBadge = () => {
    if (!existingClaim) return null;

    switch (existingClaim.status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Claim Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Claim Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Claim Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  // Show claim status if exists
  if (existingClaim) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-center">
          {getStatusBadge()}
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {existingClaim.status === "pending" && "Your ownership claim is being reviewed by our team."}
          {existingClaim.status === "approved" && "You are the verified owner of this garage."}
          {existingClaim.status === "rejected" && "Your claim was not approved. Contact support for details."}
        </p>
      </div>
    );
  }

  if (checkingClaim) {
    return (
      <Button variant="outline" className="gap-2 w-full" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Building2 className="w-4 h-4" />
          Claim This Garage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              Additional Details (Optional)
            </Label>
            <Textarea
              id="businessProof"
              placeholder="Describe any information that proves your ownership (e.g., GST number, business registration details)"
              value={formData.businessProof}
              onChange={(e) => setFormData({ ...formData, businessProof: e.target.value })}
              rows={2}
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Upload Documents *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Upload proof of ownership <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  GST certificate, business license, utility bill, or any official document
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WEBP, or PDF (max 5MB each, up to 3 files)
                </p>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,application/pdf,image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="max-w-[200px] cursor-pointer"
                  disabled={uploadedFiles.length >= 3}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  {isUploading ? "Uploading..." : "Submitting..."}
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
