import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, IndianRupee, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface DailyEarning {
  date: string;
  dataCollection: number;
  reputationSales: number;
  gmsSales: number;
  listingsCount: number;
  reputationCount: number;
  gmsCount: number;
  isPaid: boolean;
}

interface EarningsCalendarProps {
  earnings: DailyEarning[];
  onDayClick?: (date: Date, earning: DailyEarning | undefined) => void;
}

export function EarningsCalendar({ earnings, onDayClick }: EarningsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad to start week on Sunday
  const startPadding = monthStart.getDay();
  const paddedDays = [...Array(startPadding).fill(null), ...monthDays];

  const earningsMap = useMemo(() => {
    const map = new Map<string, DailyEarning>();
    earnings.forEach((e) => {
      map.set(e.date, e);
    });
    return map;
  }, [earnings]);

  const getEarningForDay = (date: Date): DailyEarning | undefined => {
    const key = format(date, "yyyy-MM-dd");
    return earningsMap.get(key);
  };

  const getTotalForDay = (earning: DailyEarning | undefined): number => {
    if (!earning) return 0;
    return earning.dataCollection + earning.reputationSales + earning.gmsSales;
  };

  const monthTotal = useMemo(() => {
    return earnings
      .filter((e) => {
        const date = new Date(e.date);
        return isSameMonth(date, currentMonth);
      })
      .reduce((sum, e) => sum + e.dataCollection + e.reputationSales + e.gmsSales, 0);
  }, [earnings, currentMonth]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-500" />
            Earnings Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-muted-foreground">Monthly Total:</span>
          <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-3 py-1">
            <IndianRupee className="w-3 h-3 mr-1" />
            {monthTotal.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, index) => {
            if (!day) {
              return <div key={`pad-${index}`} className="h-16" />;
            }

            const earning = getEarningForDay(day);
            const total = getTotalForDay(earning);
            const isToday = isSameDay(day, new Date());
            const hasEarning = total > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDayClick?.(day, earning)}
                className={`
                  h-16 p-1 rounded-lg border text-left transition-all hover:shadow-md
                  ${isToday ? "border-purple-400 bg-purple-50" : "border-border"}
                  ${hasEarning ? "bg-gradient-to-br from-purple-50 to-violet-50" : "bg-card"}
                  ${earning?.isPaid ? "ring-2 ring-purple-300" : ""}
                `}
              >
                <span className={`text-xs font-medium ${isToday ? "text-purple-600" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </span>
                {hasEarning && (
                  <div className="mt-1">
                    <span className="text-xs font-bold text-purple-600 block">
                      ₹{total.toLocaleString()}
                    </span>
                    {earning && (
                      <div className="flex gap-0.5 mt-0.5">
                        {earning.listingsCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-purple-400" title={`${earning.listingsCount} listings`} />
                        )}
                        {earning.reputationCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-purple-500" title={`${earning.reputationCount} reputation sales`} />
                        )}
                        {earning.gmsCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" title={`${earning.gmsCount} GMS sales`} />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-400" />
            Data Collection
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            Reputation
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            GMS Software
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded ring-2 ring-purple-300" />
            Paid
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
