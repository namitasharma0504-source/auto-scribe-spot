import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, Eye, EyeOff, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function GarageAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerEmailError, setCustomerEmailError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as garage owner
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is a garage owner
        const { data: garageOwner } = await supabase
          .from("garage_owners")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        
        if (garageOwner) {
          navigate("/garage-dashboard");
        } else {
          // User is logged in but not a garage owner - show message
          setCustomerEmailError(
            "You are logged in with a customer account. Please sign out and create a new garage account, or use the Customer Login."
          );
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
    setCustomerEmailError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is a garage owner
      const { data: garageOwner } = await supabase
        .from("garage_owners")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (!garageOwner) {
        await supabase.auth.signOut();
        setCustomerEmailError(
          "This account is registered as a customer, not a garage owner. Please use Customer Login or create a new garage account with a different email."
        );
        toast({
          title: "Not a Garage Account",
          description: "This account is not registered as a garage.",
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
    setCustomerEmailError(null);
    
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

      if (error) {
        if (error.message.includes("already registered")) {
          setCustomerEmailError(
            "This email is already registered. If you have a customer account with this email, please use a different email to create a garage account."
          );
          throw error;
        }
        throw error;
      }

      if (data.user) {
        // Create garage owner profile
        const { error: ownerError } = await supabase
          .from("garage_owners")
          .insert({
            user_id: data.user.id,
            business_name: businessName,
            contact_phone: contactPhone,
          });

        if (ownerError) throw ownerError;

        // Add garage_owner role
        const { error: roleError } = await supabase
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
          description: "This email is already registered. Please sign in or use a different email.",
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setCustomerEmailError(null);
    
    // Store that this is a garage signup in localStorage so we can check after OAuth redirect
    localStorage.setItem("garage_oauth_signup", "true");
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/garage-auth`,
      },
    });
    
    if (error) {
      setIsLoading(false);
      localStorage.removeItem("garage_oauth_signup");
      toast({
        title: "Google Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    // OAuth will redirect
  };

  // Handle OAuth callback - check if this is a new garage signup
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const isGarageOAuthSignup = localStorage.getItem("garage_oauth_signup");
      if (!isGarageOAuthSignup) return;
      
      localStorage.removeItem("garage_oauth_signup");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Check if user already exists as a garage owner
      const { data: existingGarageOwner } = await supabase
        .from("garage_owners")
        .select("id")
        .eq("user_id", session.user.id)
        .single();
      
      if (existingGarageOwner) {
        // Already a garage owner, redirect to dashboard
        navigate("/garage-dashboard");
        return;
      }
      
      // Check if user exists as a customer (has customer role)
      const { data: customerRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("role", "customer")
        .single();
      
      if (customerRole) {
        // User is a customer, show error
        await supabase.auth.signOut();
        setCustomerEmailError(
          "This Google account is already registered as a customer. Please use a different Google account to create a garage account, or use Customer Login."
        );
        toast({
          title: "Customer Account Detected",
          description: "This email is already registered as a customer. Use a different email for garage account.",
          variant: "destructive",
        });
        return;
      }
      
      // New user via Google - create garage owner profile
      const userName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "My Garage";
      
      const { error: ownerError } = await supabase
        .from("garage_owners")
        .insert({
          user_id: session.user.id,
          business_name: userName + "'s Garage",
          contact_phone: "",
        });
      
      if (ownerError) {
        console.error("Error creating garage owner profile:", ownerError);
        toast({
          title: "Setup Error",
          description: "Failed to create garage profile. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Add garage_owner role
      await supabase.from("user_roles").insert({
        user_id: session.user.id,
        role: "garage_owner",
      });
      
      toast({
        title: "Account Created!",
        description: "Welcome to MeriGarage! Please update your garage details.",
      });
      navigate("/garage-dashboard");
    };
    
    handleOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Garage Portal</CardTitle>
          <CardDescription>Manage your garage listing and reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {customerEmailError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{customerEmailError}</AlertDescription>
            </Alert>
          )}
          
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
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
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
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Looking to write reviews?{" "}
            <a href="/auth" className="text-primary hover:underline font-medium">
              Go to Customer Login
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
