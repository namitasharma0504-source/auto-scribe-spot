import { useState, useMemo } from "react";
import { 
  Building2, Search, Calendar as CalendarIcon, Filter, 
  ChevronDown, Plus, Play, Database, Star, Laptop, Flag,
  CheckCircle, XCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function MyListingsSection({ 
  listings, 
  onStartTask, 
  onUpsell, 
  onDispute 
}: MyListingsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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

      return searchMatch && statusMatch && categoryMatch && dateMatch;
    });
  }, [listings, searchQuery, statusFilter, categoryFilter, dateRange]);

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
  const totalEarnings = filteredListings.reduce((sum, l) => sum + (l.total_earning || 0), 0);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || categoryFilter !== "all" || dateRange;

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              My Listed Garages
            </CardTitle>
            <CardDescription>
              View and manage all garages you have listed
            </CardDescription>
          </div>
          <Button 
            onClick={onStartTask}
            className="gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
          >
            <Plus className="w-4 h-4" /> Add New Listing
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by garage name, city, or GIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range Picker */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM")} - {format(dateRange.to, "dd MMM yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy")
                  )
                ) : (
                  <span className="text-muted-foreground">Filter by date</span>
                )}
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
                numberOfMonths={2}
              />
              <div className="p-3 border-t flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setDateRange(undefined);
                    setIsCalendarOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="data_only">Data Collection Only</SelectItem>
              <SelectItem value="reputation">Reputation Upsell</SelectItem>
              <SelectItem value="gms">GMS Software Upsell</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-lg font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-lg font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-lg font-bold text-red-600">{rejectedCount}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 text-center">
            <p className="text-lg font-bold text-purple-600">₹{totalEarnings.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Earnings</p>
          </div>
        </div>

        {/* Listings Table */}
        {filteredListings.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            {listings.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4">Start adding garages to earn money!</p>
                <Button onClick={onStartTask} className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                  <Play className="w-4 h-4 mr-2" /> Start Your First Task
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No listings match your filters</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GIN</TableHead>
                  <TableHead>Garage Details</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => {
                  const canUpsell = listing.status === "approved" && (!listing.reputation_upsell || !listing.gms_upsell);
                  const canDispute = listing.status === "rejected";

                  return (
                    <TableRow key={listing.id}>
                      <TableCell className="font-mono text-sm">{listing.gin || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{listing.garages?.name || "Processing..."}</p>
                          <p className="text-xs text-muted-foreground">{listing.garages?.city || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {listing.submitted_at ? (
                          <div className="text-sm">
                            <p className="font-medium">{format(new Date(listing.submitted_at), "dd MMM yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(listing.submitted_at), "hh:mm a")}</p>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {getCategoryBadges(listing).map((badge, idx) => (
                            <Badge key={idx} variant="outline" className={`text-xs ${badge.color}`}>
                              <badge.icon className="w-3 h-3 mr-1" />
                              {badge.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell className="font-semibold text-purple-600">
                        ₹{(listing.total_earning || 0).toFixed(0)}
                      </TableCell>
                      <TableCell>{getPayoutStatusBadge(listing.payout_status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canDispute && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-orange-600 hover:text-orange-700 h-7 px-2"
                              onClick={() => onDispute(listing)}
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              Dispute
                            </Button>
                          )}
                          {canUpsell && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-purple-600 hover:text-purple-700 h-7 px-2 border-purple-300"
                              onClick={() => onUpsell(listing)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Upsell
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

        {/* Results count */}
        {filteredListings.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredListings.length} of {listings.length} listings
          </p>
        )}
      </CardContent>
    </Card>
  );
}
