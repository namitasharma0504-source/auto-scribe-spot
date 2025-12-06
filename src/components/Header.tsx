import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Gift, LayoutDashboard, Building2, Wrench, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSearch } from "./SmartSearch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isHomePage ? "bg-primary-foreground/20" : "bg-primary/10"
            )}>
              <Wrench className={cn("w-5 h-5", isHomePage ? "text-primary-foreground" : "text-primary")} />
            </div>
            <span className={cn(
              "text-xl font-bold transition-colors",
              isHomePage ? "text-primary-foreground" : "text-foreground"
            )}>
              MeriGarage <span className={cn(isHomePage ? "text-primary-foreground/80" : "text-primary")}>Reviews</span>
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
                  <>
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm" className={cn(
                        "gap-2",
                        isHomePage && "text-primary-foreground hover:bg-primary-foreground/10"
                      )}>
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant={isHomePage ? "secondary" : "outline"} 
                      size="sm" 
                      onClick={handleSignOut}
                      className={cn(
                        "gap-2",
                        isHomePage && "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant={isHomePage ? "secondary" : "outline"} size="sm" className={cn(
                      "gap-2",
                      isHomePage && "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                    )}>
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
                  <>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
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
