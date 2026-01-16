import { useState, useMemo } from "react";
import { 
  Building2, Search, Calendar as CalendarIcon, 
  Plus, Play, Flag, CheckCircle, XCircle, Clock,
  Database, Star, Laptop, IndianRupee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

interface PartnerListing {
  id: string;
  gin: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  status: string | null;
  rejection_reason: string | null;
  base_earning: number | null;
  reputation_upsell: boolean | null;
  reputation_earning: number | null;
  reputation_payment_id: string | null;
  reputation_verified: boolean | null;
  gms_upsell: boolean | null;
  gms_earning: number | null;
  gms_payment_id: string | null;
  gms_verified: boolean | null;
  total_earning: number | null;
  payout_status: string | null;
  garages?: { name: string; city: string | null } | null;
}

interface MyListingsSectionProps {
  listings: PartnerListing[];
  onStartTask: () => void;
  onUpsell: (listing: PartnerListing, upsellType?: 'reputation' | 'gms') => void;
  onDispute: (listing: PartnerListing) => void;
  partnerId?: string;
}

// Commission amounts
const DATA_COLLECTION_AMOUNT = 20;
const REPUTATION_AMOUNT = 450;
const GMS_AMOUNT = 1800;

export function MyListingsSection({ 
  listings, 
  onStartTask, 
  onUpsell, 
  onDispute,
  partnerId
}: MyListingsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [payoutFilter, setPayoutFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Filter listings based on all criteria
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Search filter
      const searchMatch = searchQuery === "" || 
        listing.garages?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.garages?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.gin?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === "all" || listing.status === statusFilter;

      // Category filter
      let categoryMatch = true;
      if (categoryFilter === "data_only") {
        categoryMatch = !listing.reputation_upsell && !listing.gms_upsell;
      } else if (categoryFilter === "reputation") {
        categoryMatch = listing.reputation_upsell === true;
      } else if (categoryFilter === "gms") {
        categoryMatch = listing.gms_upsell === true;
      }

      // Date range filter
      let dateMatch = true;
      if (dateRange?.from && listing.submitted_at) {
        const submittedDate = new Date(listing.submitted_at);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        dateMatch = isWithinInterval(submittedDate, { start: from, end: to });
      }

      // Payout filter (only applies to approved listings)
      let payoutMatch = true;
      if (payoutFilter !== "all") {
        if (listing.status !== "approved") {
          payoutMatch = false;
        } else {
          const currentPayoutStatus = listing.payout_status || "pending";
          payoutMatch = currentPayoutStatus === payoutFilter;
        }
      }

      return searchMatch && statusMatch && categoryMatch && dateMatch && payoutMatch;
    });
  }, [listings, searchQuery, statusFilter, categoryFilter, dateRange, payoutFilter]);

  // Calculate total payout for a listing (only verified items count)
  const calculateTotalPayout = (listing: PartnerListing) => {
    let total = 0;
    
    // Data Collection: ₹20 if approved
    if (listing.status === "approved") {
      total += DATA_COLLECTION_AMOUNT;
    }
    
    // Reputation: ₹450 if verified by admin
    if (listing.reputation_upsell && listing.reputation_verified) {
      total += REPUTATION_AMOUNT;
    }
    
    // GMS: ₹1,800 if verified by admin
    if (listing.gms_upsell && listing.gms_verified) {
      total += GMS_AMOUNT;
    }
    
    return total;
  };

  // Data Collection status badge
  const getDataCollectionStatus = (listing: PartnerListing) => {
    if (listing.status === "approved") {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0.5">
          <CheckCircle className="w-3 h-3 mr-0.5" />Verified
        </Badge>
      );
    }
    if (listing.status === "rejected") {
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px] px-1.5 py-0.5">
          <XCircle className="w-3 h-3 mr-0.5" />Rejected
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px] px-1.5 py-0.5">
        <Clock className="w-3 h-3 mr-0.5" />Unverified
      </Badge>
    );
  };

  // Reputation status display
  const getReputationStatus = (listing: PartnerListing) => {
    // If listing not approved, show dash
    if (listing.status !== "approved") {
      return <span className="text-[10px] text-muted-foreground">-</span>;
    }
    
    // If reputation is verified (active)
    if (listing.reputation_upsell && listing.reputation_verified) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0.5">
          <CheckCircle className="w-3 h-3 mr-0.5" />Active
        </Badge>
      );
    }
    
    // If reputation is submitted but pending verification
    if (listing.reputation_upsell && !listing.reputation_verified) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] px-1.5 py-0.5">
          <Clock className="w-3 h-3 mr-0.5" />Pending
        </Badge>
      );
    }
    
    // Not yet upsold - show upsell button
    return (
      <Button 
        size="sm" 
        variant="outline"
        className="h-5 px-1.5 text-[10px] text-purple-600 border-purple-400 hover:bg-purple-50"
        onClick={(e) => {
          e.stopPropagation();
          onUpsell(listing, 'reputation');
        }}
      >
        <Star className="w-3 h-3 mr-0.5" />₹450
      </Button>
    );
  };

  // GMS status display
  const getGMSStatus = (listing: PartnerListing) => {
    // If listing not approved, show dash
    if (listing.status !== "approved") {
      return <span className="text-[10px] text-muted-foreground">-</span>;
    }
    
    // If GMS is verified (active)
    if (listing.gms_upsell && listing.gms_verified) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0.5">
          <CheckCircle className="w-3 h-3 mr-0.5" />Active
        </Badge>
      );
    }
    
    // If GMS is submitted but pending verification
    if (listing.gms_upsell && !listing.gms_verified) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] px-1.5 py-0.5">
          <Clock className="w-3 h-3 mr-0.5" />Pending
        </Badge>
      );
    }
    
    // Not yet upsold - show upsell button
    return (
      <Button 
        size="sm" 
        variant="outline"
        className="h-5 px-1.5 text-[10px] text-blue-600 border-blue-400 hover:bg-blue-50"
        onClick={(e) => {
          e.stopPropagation();
          onUpsell(listing, 'gms');
        }}
      >
        <Laptop className="w-3 h-3 mr-0.5" />₹1800
      </Button>
    );
  };

  // Stats
  const totalCount = filteredListings.length;
  const approvedCount = filteredListings.filter(l => l.status === "approved").length;
  const pendingCount = filteredListings.filter(l => l.status === "pending" || !l.status).length;
  const rejectedCount = filteredListings.filter(l => l.status === "rejected").length;
  const paidCount = filteredListings.filter(l => l.status === "approved" && l.payout_status === "paid").length;
  const totalEarnings = filteredListings.reduce((sum, l) => sum + calculateTotalPayout(l), 0);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPayoutFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || categoryFilter !== "all" || payoutFilter !== "all" || dateRange;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-purple-500" />
              My Listed Garages
            </CardTitle>
            <Button 
              size="sm"
              onClick={onStartTask}
              className="gap-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
            >
              <Plus className="w-3 h-3" /> Add New
            </Button>
          </div>
          {partnerId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Your Partner ID:</span>
              <code className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{partnerId}</code>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden">
        {/* Compact Filters Row */}
        <div className="flex flex-col gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search garage, city, GIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            {/* Date Range Picker */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "dd MMM")} - {format(dateRange.to, "dd MMM")}</>
                    ) : format(dateRange.from, "dd MMM")
                  ) : "Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.to) setIsCalendarOpen(false);
                  }}
                  numberOfMonths={1}
                />
                <div className="p-2 border-t flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => {
                      setDateRange(undefined);
                      setIsCalendarOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="data_only">Data Only</SelectItem>
                <SelectItem value="reputation">Reputation</SelectItem>
                <SelectItem value="gms">GMS</SelectItem>
              </SelectContent>
            </Select>

            {/* Payout Status Filter */}
            <Select value={payoutFilter} onValueChange={setPayoutFilter}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue placeholder="Payout" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Payouts</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground">
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Compact Stats Summary */}
        <div className="grid grid-cols-6 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-sm font-bold">{totalCount}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10 text-center">
            <p className="text-sm font-bold text-green-600">{approvedCount}</p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-sm font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-center">
            <p className="text-sm font-bold text-red-600">{rejectedCount}</p>
            <p className="text-[10px] text-muted-foreground">Rejected</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
            <p className="text-sm font-bold text-emerald-600">{paidCount}</p>
            <p className="text-[10px] text-muted-foreground">Paid</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 text-center">
            <p className="text-sm font-bold text-purple-600">₹{totalEarnings}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground px-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Verified/Active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Pending Approval</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Unverified</span>
        </div>

        {/* Listings Table - Scrollable */}
        <div className="flex-1 min-h-0 overflow-auto">
          {filteredListings.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              {listings.length === 0 ? (
                <>
                  <h3 className="text-base font-semibold mb-1">No listings yet</h3>
                  <p className="text-sm text-muted-foreground mb-3">Start adding garages to earn money!</p>
                  <Button size="sm" onClick={onStartTask} className="bg-gradient-to-r from-purple-500 to-violet-500">
                    <Play className="w-3 h-3 mr-1" /> Start First Task
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold mb-1">No matches</h3>
                  <p className="text-sm text-muted-foreground mb-3">Try adjusting your filters</p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[10px] font-semibold">Timestamp</TableHead>
                    <TableHead className="text-[10px] font-semibold">Garage</TableHead>
                    <TableHead className="text-[10px] font-semibold">GIN</TableHead>
                    <TableHead className="text-[10px] font-semibold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Database className="w-3 h-3 text-purple-500" />
                        Data (₹20)
                      </div>
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-violet-500" />
                        Reputation
                      </div>
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Laptop className="w-3 h-3 text-blue-500" />
                        GMS
                      </div>
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IndianRupee className="w-3 h-3 text-emerald-500" />
                        Total Payout
                      </div>
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.slice(0, 10).map((listing) => {
                    const canDispute = listing.status === "rejected";
                    const totalPayout = calculateTotalPayout(listing);

                    return (
                      <TableRow key={listing.id} className="hover:bg-muted/20">
                        <TableCell className="py-2 text-[10px] text-muted-foreground whitespace-nowrap">
                          {listing.submitted_at ? format(new Date(listing.submitted_at), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell className="py-2">
                          <div>
                            <p className="text-xs font-medium truncate max-w-[100px]">{listing.garages?.name || "Processing..."}</p>
                            <p className="text-[10px] text-muted-foreground">{listing.garages?.city || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] py-2 text-purple-600">{listing.gin || "-"}</TableCell>
                        <TableCell className="py-2 text-center">{getDataCollectionStatus(listing)}</TableCell>
                        <TableCell className="py-2 text-center">{getReputationStatus(listing)}</TableCell>
                        <TableCell className="py-2 text-center">{getGMSStatus(listing)}</TableCell>
                        <TableCell className="text-right py-2">
                          <span className={`font-bold text-sm ${totalPayout > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            ₹{totalPayout.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-1">
                            {canDispute && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-orange-600 h-6 px-2 text-xs"
                                onClick={() => onDispute(listing)}
                              >
                                <Flag className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredListings.length > 10 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30 border-t">
                  Showing 10 of {filteredListings.length} listings
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
