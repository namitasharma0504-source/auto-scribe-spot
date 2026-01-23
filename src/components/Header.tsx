import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LayoutDashboard, Building2, LogOut, Search, ShieldCheck, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import logoMain from "@/assets/merigarage-logo-main.png";

// Helper to get role display info
const getRoleDisplay = (role: string | null) => {
  switch (role) {
    case "admin":
      return { label: "Admin", icon: ShieldCheck, className: "bg-destructive/10 text-destructive border-destructive/30" };
    case "garage_owner":
      return { label: "Garage Owner", icon: Building2, className: "bg-primary/10 text-primary border-primary/30" };
    case "partner":
      return { label: "Partner", icon: Users, className: "bg-accent/10 text-accent border-accent/30" };
    case "customer":
      return { label: "Customer", icon: User, className: "bg-green-500/10 text-green-600 border-green-500/30" };
    default:
      return null;
  }
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const isPartnerDashboard = location.pathname === "/partner-dashboard";
  const { user, loading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Get dashboard path based on user role
  const getDashboardPath = () => {
    switch (role) {
      case "admin":
        return "/admin";
      case "garage_owner":
        return "/garage-dashboard";
      case "partner":
        return "/partner-dashboard";
      case "customer":
      default:
        return "/dashboard";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-white border-b border-border transition-all duration-300",
      scrolled ? "shadow-md" : "shadow-sm"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logoMain} 
              alt="MeriGarageReviews" 
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-3">
              {/* Hide Browse Garages and Garage Login on Partner Dashboard */}
              {!isPartnerDashboard && (
                <>
                  <Link to="/search">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Search className="w-4 h-4" />
                      Browse Garages
                    </Button>
                  </Link>
                  <Link to="/garage-auth">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Building2 className="w-4 h-4" />
                      Garage Login
                    </Button>
                  </Link>
                </>
              )}
              {!loading && !roleLoading && (
                user ? (
                  <>
                    {/* Role Badge */}
                    {role && getRoleDisplay(role) && (
                      <Badge 
                        variant="outline" 
                        className={cn("gap-1.5 py-1", getRoleDisplay(role)?.className)}
                      >
                        {getRoleDisplay(role)?.icon && (
                          <span className="w-3 h-3">
                            {(() => {
                              const IconComponent = getRoleDisplay(role)?.icon;
                              return IconComponent ? <IconComponent className="w-3 h-3" /> : null;
                            })()}
                          </span>
                        )}
                        {getRoleDisplay(role)?.label}
                      </Badge>
                    )}
                    <Link to={getDashboardPath()}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSignOut}
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      Customer Login
                    </Button>
                  </Link>
                )
              )}
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

          {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card rounded-xl shadow-xl mb-4 p-4 animate-scale-in">
            <nav className="flex flex-col gap-2">
              {/* Hide Browse Garages and Garage Login on Partner Dashboard */}
              {!isPartnerDashboard && (
                <>
                  <Link to="/search" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Search className="w-4 h-4" />
                      Browse Garages
                    </Button>
                  </Link>
                  <Link to="/garage-auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Building2 className="w-4 h-4" />
                      Garage Login
                    </Button>
                  </Link>
                </>
              )}
              {!loading && !roleLoading && (
                user ? (
                  <>
                    {/* Role Badge for Mobile */}
                    {role && getRoleDisplay(role) && (
                      <div className="flex justify-center py-2">
                        <Badge 
                          variant="outline" 
                          className={cn("gap-1.5 py-1", getRoleDisplay(role)?.className)}
                        >
                          {getRoleDisplay(role)?.icon && (
                            <span className="w-3 h-3">
                              {(() => {
                                const IconComponent = getRoleDisplay(role)?.icon;
                                return IconComponent ? <IconComponent className="w-3 h-3" /> : null;
                              })()}
                            </span>
                          )}
                          Logged in as {getRoleDisplay(role)?.label}
                        </Badge>
                      </div>
                    )}
                    <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2" 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <User className="w-4 h-4" />
                      Customer Login
                    </Button>
                  </Link>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
