import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Mail, Lock, Eye, EyeOff, Phone, AlertCircle, Store, User, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type RoleType = "garage_owner" | "customer" | "partner" | null;

export default function GarageSignup() {
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check what role the user has and redirect accordingly
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (role?.role === "garage_owner") {
          navigate("/garage-account");
        } else if (role?.role === "partner") {
          navigate("/partner-dashboard");
        } else if (role?.role === "customer") {
          navigate("/list-garage");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      
      if (selectedRole === "garage_owner" && !businessName.trim()) {
        toast({
          title: "Business Name Required",
          description: "Please enter your garage/business name",
          variant: "destructive",
        });
        return false;
      }
      
      if ((selectedRole === "customer" || selectedRole === "partner") && !fullName.trim()) {
        toast({
          title: "Full Name Required",
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    setError(null);
    
    // Store role info for error messages
    let detectedRole: string | null = null;
    
    try {
      // Check if email already has a role assigned
      const { data: roleCheck } = await supabase
        .rpc('check_email_role_conflict', { check_email: email });
      
      const roleLabels: Record<string, string> = {
        'customer': 'Customer',
        'garage_owner': 'Garage Owner',
        'partner': 'Partner',
        'admin': 'Admin'
      };
      
      if (roleCheck && roleCheck[0]?.has_conflict) {
        detectedRole = roleCheck[0].existing_role;
        setError(`This email is already registered as a ${roleLabels[detectedRole] || detectedRole}. Please use a different email or sign in with your existing account.`);
        setIsLoading(false);
        return;
      }

      // Handle Partner role - redirect to partner application
      if (selectedRole === "partner") {
        navigate("/partner-apply");
        return;
      }

      // Create the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            full_name: selectedRole === "garage_owner" ? businessName : fullName,
            role: selectedRole,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Assign role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: selectedRole,
          });

        if (roleError) console.error("Role assignment error:", roleError);

        if (selectedRole === "garage_owner") {
          // Create garage owner profile
          const { error: ownerError } = await supabase
            .from("garage_owners")
            .insert({
              user_id: data.user.id,
              business_name: businessName,
              contact_phone: contactPhone,
            });

          if (ownerError) throw ownerError;

          // Also create a profile entry
          await supabase.from("profiles").insert({
            user_id: data.user.id,
            full_name: businessName,
          });

          toast({
            title: "Account Created!",
            description: "Now list your garage to get started.",
          });
          
          // Redirect to list garage form
          navigate("/list-garage");
        } else if (selectedRole === "customer") {
          // Create profile for customer
          await supabase.from("profiles").insert({
            user_id: data.user.id,
            full_name: fullName,
          });

          toast({
            title: "Account Created!",
            description: "You can now list and review garages.",
          });
          
          // Redirect to list garage form
          navigate("/list-garage");
        }
      }
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        // If we detected a role earlier, use it in the message
        if (detectedRole) {
          const roleLabels: Record<string, string> = {
            'customer': 'Customer',
            'garage_owner': 'Garage Owner',
            'partner': 'Partner',
            'admin': 'Admin'
          };
          setError(`This email is already registered as a ${roleLabels[detectedRole] || detectedRole}. Please sign in or use a different email.`);
        } else {
          // User exists in auth but has no role (incomplete deletion by admin)
          setError("This email is already registered in our system. Please contact support or use a different email address.");
        }
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!selectedRole) {
      toast({
        title: "Select Your Role",
        description: "Please select who you are before continuing with Google.",
        variant: "destructive",
      });
      return;
    }

    // Partners should go to partner application
    if (selectedRole === "partner") {
      navigate("/partner-apply");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Store role in localStorage for post-OAuth handling
    localStorage.setItem("signup_role", selectedRole);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/garage-signup`,
      },
    });
    
    if (error) {
      setIsLoading(false);
      localStorage.removeItem("signup_role");
      toast({
        title: "Google Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const storedRole = localStorage.getItem("signup_role") as RoleType;
      if (!storedRole) return;
      
      localStorage.removeItem("signup_role");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      if (existingRole) {
        // User already exists, redirect based on role
        if (existingRole.role === "garage_owner") {
          navigate("/garage-account");
        } else if (existingRole.role === "customer") {
          navigate("/list-garage");
        }
        return;
      }
      
      // New user via Google - create profile based on selected role
      const userName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
      
      // Assign role
      await supabase.from("user_roles").insert({
        user_id: session.user.id,
        role: storedRole,
      });

      if (storedRole === "garage_owner") {
        // Create garage owner profile
        await supabase.from("garage_owners").insert({
          user_id: session.user.id,
          business_name: userName + "'s Garage",
          contact_phone: "",
        });

        await supabase.from("profiles").insert({
          user_id: session.user.id,
          full_name: userName,
        });
        
        toast({
          title: "Account Created!",
          description: "Now list your garage to get started.",
        });
        navigate("/list-garage");
      } else if (storedRole === "customer") {
        await supabase.from("profiles").insert({
          user_id: session.user.id,
          full_name: userName,
        });
        
        toast({
          title: "Account Created!",
          description: "You can now list and review garages.",
        });
        navigate("/list-garage");
      }
    };
    
    handleOAuthCallback();
  }, [navigate, toast]);

  const roleCards = [
    {
      id: "garage_owner" as RoleType,
      icon: Store,
      title: "I am a Garage Owner",
      description: "I want to list my own garage so customers can review it",
      color: "primary",
    },
    {
      id: "customer" as RoleType,
      icon: User,
      title: "I am a Customer",
      description: "I want to list and rate a garage I recently visited",
      color: "secondary",
    },
    {
      id: "partner" as RoleType,
      icon: Users,
      title: "I am a Garage Partner",
      description: "I'm a MeriGarage partner who lists multiple garages",
      color: "blue",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">List Your Garage</CardTitle>
          <CardDescription>Create an account to add a garage to MeriGarage</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Role Selection */}
          {!selectedRole ? (
            <div className="space-y-4">
              <h3 className="text-center text-lg font-semibold text-foreground mb-4">Who are you?</h3>
              <div className="space-y-3">
                {roleCards.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      role.color === "primary" ? "bg-primary/10" : 
                      role.color === "blue" ? "bg-blue-500/10" : "bg-secondary/50"
                    }`}>
                      <role.icon className={`w-6 h-6 ${
                        role.color === "primary" ? "text-primary" : 
                        role.color === "blue" ? "text-blue-600" : "text-secondary-foreground"
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold">{role.title}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/garage-auth" className="text-primary hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Step 2: Signup Form */
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedRole(null)}
                className="mb-2 gap-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to role selection
              </Button>

              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  {selectedRole === "garage_owner" && <Store className="w-4 h-4 text-primary" />}
                  {selectedRole === "customer" && <User className="w-4 h-4" />}
                  {selectedRole === "partner" && <Users className="w-4 h-4 text-blue-600" />}
                  Signing up as: {
                    selectedRole === "garage_owner" ? "Garage Owner" :
                    selectedRole === "customer" ? "Customer" : "Garage Partner"
                  }
                </p>
              </div>

              {selectedRole === "partner" ? (
                <div className="text-center py-6">
                  <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Become a Garage Partner</h3>
                  <p className="text-muted-foreground mb-6">
                    Join our partner program to list garages and earn money. Complete the application form to get started.
                  </p>
                  <Button 
                    onClick={() => navigate("/partner-apply")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Partner Application
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  {selectedRole === "garage_owner" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business/Garage Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="businessName"
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
                        <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="contactPhone"
                            type="tel"
                            placeholder="+91 9876543210"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
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
                    {isLoading ? "Creating Account..." : "Create Account & Continue"}
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
                    onClick={handleGoogleSignUp}
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

                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Already have an account?{" "}
                    <Link to="/garage-auth" className="text-primary hover:underline">
                      Sign In
                    </Link>
                  </p>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
