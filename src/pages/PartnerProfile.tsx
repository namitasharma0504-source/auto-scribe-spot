import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, Phone, Mail, Camera, FileText, CreditCard, Building2,
  CheckCircle, XCircle, Clock, Upload, Save, ArrowLeft, AlertTriangle,
  RefreshCw, Eye, Trash2, Search
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { indianBanks } from "@/data/indianBanks";

interface Partner {
  id: string;
  user_id: string | null;
  username: string;
  full_name: string;
  phone: string;
  email: string | null;
  profile_photo: string | null;
  pan_number: string | null;
  pan_document: string | null;
  aadhaar_number: string | null;
  aadhaar_document: string | null;
  kyc_status: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  account_holder_name: string | null;
  bank_verified: boolean | null;
  status: string | null;
  created_at: string | null;
}

export default function PartnerProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  // Signed URLs for viewing private bucket documents
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [panDocumentUrl, setPanDocumentUrl] = useState<string | null>(null);
  const [aadhaarDocumentUrl, setAadhaarDocumentUrl] = useState<string | null>(null);
  
  // Bank search dropdown state
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const bankInputRef = useRef<HTMLInputElement>(null);
  const bankDropdownRef = useRef<HTMLDivElement>(null);
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/partner-login");
      return;
    }

    if (user) {
      fetchPartnerData();
    }
  }, [user, authLoading, navigate]);

  // Close bank dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bankDropdownRef.current && 
        !bankDropdownRef.current.contains(event.target as Node) &&
        bankInputRef.current &&
        !bankInputRef.current.contains(event.target as Node)
      ) {
        setBankSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter banks based on search query
  const filteredBanks = indianBanks.filter(bank =>
    bank.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  const fetchPartnerData = async () => {
    if (!user) return;

    try {
      // Check partner role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner")
        .maybeSingle();

      if (!roleData) {
        navigate("/partner-login");
        return;
      }

      // Get partner profile
      const { data: partnerData, error } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (partnerData) {
        setPartner(partnerData);
        // Initialize form fields
        setFullName(partnerData.full_name || "");
        setPhone(partnerData.phone || "");
        setEmail(partnerData.email || "");
        setPanNumber(partnerData.pan_number || "");
        setAadhaarNumber(partnerData.aadhaar_number || "");
        setBankName(partnerData.bank_name || "");
        setAccountNumber(partnerData.account_number || "");
        setIfscCode(partnerData.ifsc_code || "");
        setAccountHolderName(partnerData.account_holder_name || "");
        
        // Fetch signed URLs for documents
        await fetchSignedUrls(partnerData);
      }
    } catch (error) {
      console.error("Error fetching partner:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSignedUrls = async (partnerData: Partner) => {
    // Fetch profile photo signed URL
    if (partnerData.profile_photo) {
      const { data } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(partnerData.profile_photo, 3600); // 1 hour expiry
      if (data?.signedUrl) {
        setProfilePhotoUrl(data.signedUrl);
      }
    }
    
    // Fetch PAN document signed URL
    if (partnerData.pan_document) {
      const { data } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(partnerData.pan_document, 3600);
      if (data?.signedUrl) {
        setPanDocumentUrl(data.signedUrl);
      }
    }
    
    // Fetch Aadhaar document signed URL
    if (partnerData.aadhaar_document) {
      const { data } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(partnerData.aadhaar_document, 3600);
      if (data?.signedUrl) {
        setAadhaarDocumentUrl(data.signedUrl);
      }
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!partner) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("partners")
        .update({
          full_name: fullName,
          phone: phone,
          email: email,
        })
        .eq("id", partner.id);

      if (error) throw error;

      setPartner(prev => prev ? { ...prev, full_name: fullName, phone, email } : null);
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKYC = async () => {
    if (!partner) return;
    
    setIsSaving(true);
    try {
      const kycStatus = panNumber && aadhaarNumber ? "submitted" : "pending";
      
      const { error } = await supabase
        .from("partners")
        .update({
          pan_number: panNumber || null,
          aadhaar_number: aadhaarNumber || null,
          kyc_status: partner.kyc_status === "verified" ? "verified" : kycStatus,
        })
        .eq("id", partner.id);

      if (error) throw error;

      setPartner(prev => prev ? { 
        ...prev, 
        pan_number: panNumber, 
        aadhaar_number: aadhaarNumber,
        kyc_status: prev.kyc_status === "verified" ? "verified" : kycStatus
      } : null);
      
      toast({
        title: "KYC Details Updated",
        description: panNumber && aadhaarNumber 
          ? "Your documents are submitted for verification." 
          : "Please complete all KYC fields for verification.",
      });
    } catch (error: any) {
      console.error("Error saving KYC:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save KYC details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!partner) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("partners")
        .update({
          bank_name: bankName || null,
          account_number: accountNumber || null,
          ifsc_code: ifscCode || null,
          account_holder_name: accountHolderName || null,
          bank_verified: false, // Reset verification when details change
        })
        .eq("id", partner.id);

      if (error) throw error;

      setPartner(prev => prev ? { 
        ...prev, 
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder_name: accountHolderName,
        bank_verified: false,
      } : null);
      
      toast({
        title: "Bank Details Updated",
        description: "Your bank details are saved and pending verification.",
      });
    } catch (error: any) {
      console.error("Error saving bank details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save bank details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: "pan" | "aadhaar" | "profile") => {
    if (!partner || !user) return;
    
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload JPG, PNG, WEBP, or PDF files only",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(documentType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("partner-documents")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("partner-documents")
        .getPublicUrl(fileName);

      // Note: Since bucket is private, we store the path instead
      const documentPath = fileName;

      // Update partner record
      const updateField = documentType === "pan" ? "pan_document" 
        : documentType === "aadhaar" ? "aadhaar_document" 
        : "profile_photo";
      
      const { error: updateError } = await supabase
        .from("partners")
        .update({ [updateField]: documentPath })
        .eq("id", partner.id);

      if (updateError) throw updateError;

      setPartner(prev => prev ? { ...prev, [updateField]: documentPath } : null);
      
      // Refresh signed URL for the uploaded document
      const { data: signedData } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(documentPath, 3600);
      
      if (signedData?.signedUrl) {
        if (documentType === "profile") setProfilePhotoUrl(signedData.signedUrl);
        else if (documentType === "pan") setPanDocumentUrl(signedData.signedUrl);
        else if (documentType === "aadhaar") setAadhaarDocumentUrl(signedData.signedUrl);
      }
      
      toast({
        title: "Document Uploaded",
        description: `Your ${documentType.toUpperCase()} document has been uploaded.`,
      });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };

  const getKycStatusBadge = (status: string | null) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "submitted":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Partner Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">Please contact admin to set up your partner account.</p>
          <Link to="/partner-dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/partner-dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Partner Profile</h1>
            <p className="text-muted-foreground">Manage your account details and KYC documents</p>
          </div>
          <Badge variant="outline" className="text-emerald-600 border-emerald-600">
            {partner.id}
          </Badge>
        </div>

        {/* KYC Status Alert */}
        {partner.kyc_status !== "verified" && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {partner.kyc_status === "submitted" 
                ? "Your KYC documents are under review. We'll notify you once verified."
                : "Complete your KYC to unlock full earning potential and receive payouts."}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="gap-2">
              <User className="w-4 h-4" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="kyc" className="gap-2">
              <FileText className="w-4 h-4" />
              KYC Documents
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Bank Details
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your basic profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30">
                    {profilePhotoUrl ? (
                      <img 
                        src={profilePhotoUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="profile-upload" className="cursor-pointer">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        disabled={isUploading === "profile"}
                        asChild
                      >
                        <span>
                          {isUploading === "profile" ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          Upload Photo
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload(file, "profile");
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP (max 5MB)</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={partner.username}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXXXXXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSavePersonalInfo} 
                  disabled={isSaving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Documents Tab */}
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      KYC Documents
                    </CardTitle>
                    <CardDescription>
                      Submit your identity documents for verification
                    </CardDescription>
                  </div>
                  {getKycStatusBadge(partner.kyc_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PAN Card */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PAN Card
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="panNumber">PAN Number</Label>
                      <Input
                        id="panNumber"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        disabled={partner.kyc_status === "verified"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN Document</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="pan-upload" className="flex-1 cursor-pointer">
                          <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed ${partner.pan_document ? 'border-green-500/50 bg-green-500/5' : 'border-muted-foreground/30'} hover:border-emerald-500/50 transition-colors`}>
                            {isUploading === "pan" ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : partner.pan_document ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">Document Uploaded</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload PAN Copy</span>
                              </>
                            )}
                          </div>
                        </Label>
                        {panDocumentUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(panDocumentUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <input
                          id="pan-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          disabled={partner.kyc_status === "verified"}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(file, "pan");
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">JPG, PNG, PDF (max 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* Aadhaar Card */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Aadhaar Card
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                      <Input
                        id="aadhaarNumber"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="XXXX XXXX XXXX"
                        maxLength={12}
                        disabled={partner.kyc_status === "verified"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Aadhaar Document</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="aadhaar-upload" className="flex-1 cursor-pointer">
                          <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed ${partner.aadhaar_document ? 'border-green-500/50 bg-green-500/5' : 'border-muted-foreground/30'} hover:border-emerald-500/50 transition-colors`}>
                            {isUploading === "aadhaar" ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : partner.aadhaar_document ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">Document Uploaded</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload Aadhaar Copy</span>
                              </>
                            )}
                          </div>
                        </Label>
                        {aadhaarDocumentUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(aadhaarDocumentUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <input
                          id="aadhaar-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          disabled={partner.kyc_status === "verified"}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(file, "aadhaar");
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">JPG, PNG, PDF (max 5MB)</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveKYC} 
                  disabled={isSaving || partner.kyc_status === "verified"}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {partner.kyc_status === "verified" ? "KYC Verified" : "Submit for Verification"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Details Tab */}
          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      Bank Details
                    </CardTitle>
                    <CardDescription>
                      Add your bank account for receiving payouts
                    </CardDescription>
                  </div>
                  {partner.bank_verified ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                      <Clock className="w-3 h-3 mr-1" />Pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">Account Holder Name</Label>
                    <Input
                      id="accountHolderName"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Name as per bank records"
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <Input
                        ref={bankInputRef}
                        id="bankName"
                        value={bankName}
                        onChange={(e) => {
                          setBankName(e.target.value);
                          setBankSearchQuery(e.target.value);
                          setBankSearchOpen(true);
                        }}
                        onFocus={() => {
                          setBankSearchOpen(true);
                          setBankSearchQuery(bankName);
                        }}
                        placeholder="Search or type bank name..."
                        className="pl-10"
                        autoComplete="off"
                      />
                    </div>
                    {bankSearchOpen && (
                      <div 
                        ref={bankDropdownRef}
                        className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg"
                      >
                        {filteredBanks.length > 0 ? (
                          filteredBanks.slice(0, 10).map((bank) => (
                            <div
                              key={bank}
                              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                              onClick={() => {
                                setBankName(bank);
                                setBankSearchOpen(false);
                                setBankSearchQuery("");
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                {bank}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No banks found. You can type a custom bank name.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter account number"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g., SBIN0001234"
                      maxLength={11}
                    />
                  </div>
                </div>

                <Alert className="border-blue-500/30 bg-blue-500/5">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Ensure your bank details are correct. Payouts will only be processed to verified accounts.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleSaveBankDetails} 
                  disabled={isSaving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Bank Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
