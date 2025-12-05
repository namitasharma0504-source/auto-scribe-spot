import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Gift, LayoutDashboard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSearch } from "./SmartSearch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/7KBskuF0S6aidF2yeUxNqGAEox73/uploads/1764918252245-Screenshot 2025-12-05 at 12.34.03 PM.png";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { user, loading } = useAuth();

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      isHomePage 
        ? "bg-transparent absolute w-full" 
        : "bg-card/95 backdrop-blur-md shadow-sm border-b border-border"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src={LOGO_URL} alt="MeriGarage" className="w-10 h-10 object-contain" />
            <span className={cn(
              "text-xl font-bold transition-colors",
              isHomePage ? "text-primary-foreground" : "text-foreground"
            )}>
              MeriGarage <span className="text-primary">Reviews</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {!isHomePage && (
              <SmartSearch className="w-64" />
            )}
            <nav className="flex items-center gap-3">
              <Link to="/search">
                <Button variant="ghost" size="sm" className={cn(
                  isHomePage && "text-primary-foreground hover:bg-primary-foreground/10"
                )}>
                  Browse Garages
                </Button>
              </Link>
              <Link to="/rewards">
                <Button variant="ghost" size="sm" className={cn(
                  "gap-2",
                  isHomePage && "text-primary-foreground hover:bg-primary-foreground/10"
                )}>
                  <Gift className="w-4 h-4" />
                  Rewards
                </Button>
              </Link>
              <Link to="/garage-auth">
                <Button variant="ghost" size="sm" className={cn(
                  "gap-2",
                  isHomePage && "text-primary-foreground hover:bg-primary-foreground/10"
                )}>
                  <Building2 className="w-4 h-4" />
                  Garage Login
                </Button>
              </Link>
              {!loading && (
                user ? (
                  <Link to="/dashboard">
                    <Button variant={isHomePage ? "secondary" : "default"} size="sm" className={cn(
                      "gap-2",
                      isHomePage && "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                    )}>
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant={isHomePage ? "secondary" : "outline"} size="sm" className={cn(
                      "gap-2",
                      isHomePage && "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                    )}>
                      <User className="w-4 h-4" />
                      Sign In
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
              <X className={cn("w-6 h-6", isHomePage ? "text-primary-foreground" : "text-foreground")} />
            ) : (
              <Menu className={cn("w-6 h-6", isHomePage ? "text-primary-foreground" : "text-foreground")} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card rounded-xl shadow-xl mb-4 p-4 animate-scale-in">
            <nav className="flex flex-col gap-2">
              <SmartSearch className="mb-2" />
              <Link to="/search" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Browse Garages
                </Button>
              </Link>
              <Link to="/rewards" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Gift className="w-4 h-4" />
                  Rewards
                </Button>
              </Link>
              <Link to="/garage-auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Building2 className="w-4 h-4" />
                  Garage Login
                </Button>
              </Link>
              {!loading && (
                user ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" className="w-full justify-start gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <User className="w-4 h-4" />
                      Sign In
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
