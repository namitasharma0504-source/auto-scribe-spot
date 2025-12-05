import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/7KBskuF0S6aidF2yeUxNqGAEox73/uploads/1764918252245-Screenshot 2025-12-05 at 12.34.03 PM.png";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function GarageAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as garage owner
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is a garage owner
        const { data: garageOwner } = await (supabase as any)
          .from("garage_owners")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        
        if (garageOwner) {
          navigate("/garage-dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const validateInputs = (isSignUp: boolean) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isSignUp && !businessName.trim()) {
        toast({
          title: "Business Name Required",
          description: "Please enter your garage/business name",
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(false)) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is a garage owner
      const { data: garageOwner } = await (supabase as any)
        .from("garage_owners")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (!garageOwner) {
        await supabase.auth.signOut();
        toast({
          title: "Not a Garage Account",
          description: "This account is not registered as a garage. Please sign up as a garage or use customer login.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in to your garage dashboard.",
      });
      navigate("/garage-dashboard");
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again." 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(true)) return;

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/garage-dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            business_name: businessName,
            is_garage_owner: true,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create garage owner profile
        const { error: ownerError } = await (supabase as any)
          .from("garage_owners")
          .insert({
            user_id: data.user.id,
            business_name: businessName,
            contact_phone: contactPhone,
          });

        if (ownerError) throw ownerError;

        // Add garage_owner role
        const { error: roleError } = await (supabase as any)
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: "garage_owner",
          });

        if (roleError) console.error("Role assignment error:", roleError);

        toast({
          title: "Account Created!",
          description: "Welcome to MeriGarage! You can now set up your garage profile.",
        });
        navigate("/garage-dashboard");
      }
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Account Exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={LOGO_URL} alt="MeriGarage" className="w-16 h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Garage Portal</CardTitle>
          <CardDescription>Manage your garage listing and reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="garage@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In to Dashboard"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-business">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-business"
                      type="text"
                      placeholder="Your Garage Name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="garage@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Garage Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
