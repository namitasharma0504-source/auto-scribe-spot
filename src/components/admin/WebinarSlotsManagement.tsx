import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, RefreshCw, Users, Save } from "lucide-react";

interface WebinarSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_full: boolean;
  max_capacity: number | null;
  created_at: string;
  updated_at: string;
  booked_count?: number;
}

export function WebinarSlotsManagement() {
  const [slots, setSlots] = useState<WebinarSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSlots, setEditingSlots] = useState<Record<string, { date: string; start: string; end: string }>>({});
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const { data: slotsData, error } = await supabase
        .from("webinar_slots")
        .select("*")
        .order("slot_date", { ascending: true })
        .limit(2);

      if (error) throw error;

      // Get booked counts for each slot
      const slotsWithCounts = await Promise.all(
        (slotsData || []).map(async (slot) => {
          const { count } = await supabase
            .from("partner_applications")
            .select("*", { count: "exact", head: true })
            .eq("webinar_slot", slot.slot_date);
          
          return { ...slot, booked_count: count || 0 };
        })
      );

      setSlots(slotsWithCounts);
      
      // Initialize editing state
      const editState: Record<string, { date: string; start: string; end: string }> = {};
      slotsWithCounts.forEach((slot) => {
        editState[slot.id] = {
          date: slot.slot_date,
          start: slot.start_time,
          end: slot.end_time,
        };
      });
      setEditingSlots(editState);
    } catch (error: any) {
      console.error("Error fetching webinar slots:", error);
      toast.error("Failed to load webinar slots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSaveSlot = async (slotId: string) => {
    const editData = editingSlots[slotId];
    if (!editData || !editData.date) {
      toast.error("Please select a date");
      return;
    }

    setSavingSlotId(slotId);
    try {
      const { error } = await supabase
        .from("webinar_slots")
        .update({
          slot_date: editData.date,
          start_time: editData.start,
          end_time: editData.end,
        })
        .eq("id", slotId);

      if (error) throw error;

      toast.success("Slot updated successfully");
      fetchSlots();
    } catch (error: any) {
      console.error("Error updating slot:", error);
      toast.error("Failed to update slot");
    } finally {
      setSavingSlotId(null);
    }
  };

  const handleToggleFull = async (slot: WebinarSlot) => {
    try {
      const { error } = await supabase
        .from("webinar_slots")
        .update({ is_full: !slot.is_full })
        .eq("id", slot.id);

      if (error) throw error;

      toast.success(slot.is_full ? "Slot marked as available" : "Slot marked as full");
      fetchSlots();
    } catch (error: any) {
      console.error("Error updating slot:", error);
      toast.error("Failed to update slot");
    }
  };

  const updateEditingSlot = (slotId: string, field: "date" | "start" | "end", value: string) => {
    setEditingSlots((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [field]: value,
      },
    }));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage the 2 webinar slots displayed on the booking page. Edit date, time, and availability.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSlots}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Slots List */}
      {slots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No webinar slots configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please add slots from the database
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {slots.map((slot, index) => {
            const editData = editingSlots[slot.id] || { date: slot.slot_date, start: slot.start_time, end: slot.end_time };
            const hasChanges = editData.date !== slot.slot_date || editData.start !== slot.start_time || editData.end !== slot.end_time;
            
            return (
              <Card key={slot.id} className={slot.is_full ? "border-orange-500/30 bg-orange-500/5" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Slot {index + 1}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{slot.booked_count || 0} booked</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slot.is_full}
                          onCheckedChange={() => handleToggleFull(slot)}
                        />
                        <Label className="text-sm">
                          {slot.is_full ? (
                            <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
                              Slot Full
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                              Available
                            </Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 items-end">
                    {/* Date Input */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        Date
                      </Label>
                      <Input
                        type="date"
                        value={editData.date}
                        onChange={(e) => updateEditingSlot(slot.id, "date", e.target.value)}
                      />
                      {editData.date && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(editData.date), "EEEE, d MMMM yyyy")}
                        </p>
                      )}
                    </div>

                    {/* Start Time */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        Start Time
                      </Label>
                      <Input
                        type="time"
                        value={editData.start}
                        onChange={(e) => updateEditingSlot(slot.id, "start", e.target.value)}
                      />
                      {editData.start && (
                        <p className="text-xs text-muted-foreground">
                          {formatTime(editData.start)}
                        </p>
                      )}
                    </div>

                    {/* End Time */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        End Time
                      </Label>
                      <Input
                        type="time"
                        value={editData.end}
                        onChange={(e) => updateEditingSlot(slot.id, "end", e.target.value)}
                      />
                      {editData.end && (
                        <p className="text-xs text-muted-foreground">
                          {formatTime(editData.end)}
                        </p>
                      )}
                    </div>

                    {/* Save Button */}
                    <div>
                      <Button
                        onClick={() => handleSaveSlot(slot.id)}
                        disabled={!hasChanges || savingSlotId === slot.id}
                        className="w-full"
                      >
                        {savingSlotId === slot.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}