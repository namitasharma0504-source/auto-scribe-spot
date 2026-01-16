import { useState, useMemo } from "react";
import { 
  Building2, Search, Calendar as CalendarIcon, 
  Plus, Play, Flag, CheckCircle, XCircle, Clock,
  Database, Star, Laptop
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
  gms_upsell: boolean | null;
  gms_earning: number | null;
  gms_payment_id: string | null;
  total_earning: number | null;
  payout_status: string | null;
  garages?: { name: string; city: string | null } | null;
}

interface MyListingsSectionProps {
  listings: PartnerListing[];
  onStartTask: () => void;
  onUpsell: (listing: PartnerListing) => void;
  onDispute: (listing: PartnerListing) => void;
  partnerId?: string;
}

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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "under_review":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getPayoutStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Paid</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Processing</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getCategoryBadges = (listing: PartnerListing) => {
    const badges = [];
    badges.push({ 
      label: 'Data Collection', 
      icon: Database,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' 
    });
    if (listing.reputation_upsell) {
      badges.push({ 
        label: 'Reputation', 
        icon: Star,
        color: 'bg-violet-500/10 text-violet-600 border-violet-500/30' 
      });
    }
    if (listing.gms_upsell) {
      badges.push({ 
        label: 'GMS Software', 
        icon: Laptop,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' 
      });
    }
    return badges;
  };

  // Stats
  const totalCount = filteredListings.length;
  const approvedCount = filteredListings.filter(l => l.status === "approved").length;
  const pendingCount = filteredListings.filter(l => l.status === "pending" || !l.status).length;
  const rejectedCount = filteredListings.filter(l => l.status === "rejected").length;
  const paidCount = filteredListings.filter(l => l.status === "approved" && l.payout_status === "paid").length;
  const totalEarnings = filteredListings.reduce((sum, l) => sum + (l.total_earning || 0), 0);

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
                  <TableRow>
                    <TableHead className="text-xs">GIN</TableHead>
                    <TableHead className="text-xs">Garage</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Payout</TableHead>
                    <TableHead className="text-xs text-right">Earnings</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.slice(0, 10).map((listing) => {
                    const canUpsell = listing.status === "approved" && (!listing.reputation_upsell || !listing.gms_upsell);
                    const canDispute = listing.status === "rejected";

                    return (
                      <TableRow key={listing.id}>
                        <TableCell className="font-mono text-xs py-2">{listing.gin || "-"}</TableCell>
                        <TableCell className="py-2">
                          <div>
                            <p className="text-xs font-medium truncate max-w-[120px]">{listing.garages?.name || "Processing..."}</p>
                            <p className="text-[10px] text-muted-foreground">{listing.garages?.city || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">{getStatusBadge(listing.status)}</TableCell>
                        <TableCell className="py-2">
                          {listing.status === "approved" ? (
                            getPayoutStatusBadge(listing.payout_status)
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2 font-semibold text-xs text-purple-600">
                          ₹{(listing.total_earning || 0)}
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
                            {canUpsell && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-purple-600 h-6 px-2 text-xs border-purple-300"
                                onClick={() => onUpsell(listing)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Results count */}
        {filteredListings.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Showing {Math.min(filteredListings.length, 10)} of {filteredListings.length} listings
          </p>
        )}
      </CardContent>
    </Card>
  );
}
