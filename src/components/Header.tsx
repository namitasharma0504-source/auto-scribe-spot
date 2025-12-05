import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Gift, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
          <Link to="/" className="flex items-center group">
            <span className={cn(
              "text-xl font-bold transition-colors",
              isHomePage ? "text-primary-foreground" : "text-foreground"
            )}>
              MeriGarage <span className="text-primary">Reviews</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {!isHomePage && (
              <div className="w-80">
                <SearchBar variant="compact" />
              </div>
            )}
            <nav className="flex items-center gap-4">
              <Link to="/search">
                <Button variant="ghost" className={cn(
                  isHomePage && "text-primary-foreground hover:bg-primary-foreground/10"
                )}>
                  Browse Garages
                </Button>
              </Link>
              <Link to="/rewards">
                <Button variant="ghost" className={cn(
                  "gap-2",
                  isHomePage && "text-primary-foreground hover:bg-primary-foreground/10"
                )}>
                  <Gift className="w-4 h-4" />
                  Rewards
                </Button>
              </Link>
              {!loading && (
                user ? (
                  <Link to="/dashboard">
                    <Button variant={isHomePage ? "secondary" : "default"} className={cn(
                      "gap-2",
                      isHomePage && "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                    )}>
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant={isHomePage ? "secondary" : "outline"} className={cn(
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
