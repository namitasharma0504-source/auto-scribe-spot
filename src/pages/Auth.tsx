import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Wrench, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [garageEmailError, setGarageEmailError] = useState<string | null>(null);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  // Check if customer signup is enabled
  useEffect(() => {
    const checkSignupSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "signup_settings")
        .single();
      
      if (data?.value) {
        setSignupEnabled((data.value as any).customer_signup_enabled ?? true);
      }
    };
    checkSignupSettings();
  }, []);

  useEffect(() => {
    if (user) {
      // If there's a return URL (e.g., from review page), redirect there
      if (returnUrl) {
        navigate(returnUrl);
        return;
      }
      
      // Check if user is a garage owner - if so, redirect to garage dashboard
      const checkUserType = async () => {
        const { data: garageOwner } = await supabase
          .from("garage_owners")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (garageOwner) {
          toast({
            title: "Garage Account Detected",
            description: "You have a garage account. Redirecting to garage dashboard.",
          });
          navigate("/garage-dashboard");
        } else {
          navigate("/dashboard");
        }
      };
      checkUserType();
    }
  }, [user, navigate, toast, returnUrl]);

  const validateInputs = (isSignUp: boolean) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isSignUp && !fullName.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your full name",
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

  const checkIfGarageOwner = async (emailToCheck: string): Promise<boolean> => {
    // First sign in to check, then check if there's a garage_owner record
    // We can't directly check garage_owners table without auth, so we check after signup attempt
    return false; // This will be handled after signup
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(false)) return;

    setIsLoading(true);
    setGarageEmailError(null);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setIsLoading(false);
      toast({
        title: "Sign In Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again." 
          : error.message,
        variant: "destructive",
      });
    }
    // The useEffect will handle navigation after successful sign in
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if signup is enabled
    if (!signupEnabled) {
      toast({
        title: "Signup Disabled",
        description: "Customer signups are currently disabled. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateInputs(true)) return;

    setIsLoading(true);
    setGarageEmailError(null);
    
    try {
      // Check if email already has a role assigned
      const { data: roleCheck } = await supabase
        .rpc('check_email_role_conflict', { check_email: email });
      
      if (roleCheck && roleCheck[0]?.has_conflict) {
        const existingRole = roleCheck[0].existing_role;
        const roleLabels: Record<string, string> = {
          'customer': 'Customer',
          'garage_owner': 'Garage Owner',
          'partner': 'Partner',
          'admin': 'Admin'
        };
        setGarageEmailError(
          `This email is already registered as a ${roleLabels[existingRole] || existingRole}. Please use a different email or sign in with your existing account.`
        );
        toast({
          title: "Email Already Registered",
          description: `This email is registered as a ${roleLabels[existingRole] || existingRole}. Use a different email.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await signUp(email, password, fullName);

      if (error) {
        setIsLoading(false);
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // After successful signup, add customer role and update profile with phone
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await supabase.from("user_roles").insert({
          user_id: newUser.id,
          role: "customer",
        });
        
        // Update profile with phone number if provided
        if (phone.trim()) {
          await supabase.from("profiles").update({
            phone: phone.trim(),
          }).eq("user_id", newUser.id);
        }
      }
      
      toast({
        title: "Account Created!",
        description: "Welcome to GarageReviews! You are now signed in.",
      });
      // Navigation will be handled by the useEffect when user state changes
    } catch (err) {
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setGarageEmailError(null);
    
    // Use returnUrl if available, otherwise default to dashboard
    const redirectTo = returnUrl 
      ? `${window.location.origin}${returnUrl}`
      : `${window.location.origin}/dashboard`;
    
    const { error } = await signInWithGoogle(redirectTo);
    
    if (error) {
      setIsLoading(false);
      toast({
        title: "Google Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    // OAuth will redirect, so loading stays true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">MeriGarage Reviews</CardTitle>
          <CardDescription>Sign in to track your reviews and rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {garageEmailError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{garageEmailError}</AlertDescription>
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
                      placeholder="your@email.com"
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
                  {isLoading ? "Signing in..." : "Sign In"}
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
              {!signupEnabled && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Customer signups are currently disabled. Please try again later or contact support.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
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
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
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
                  {isLoading ? "Creating account..." : "Create Account"}
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
            Are you a garage owner?{" "}
            <a href="/garage-auth" className="text-primary hover:underline font-medium">
              Go to Garage Login
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
