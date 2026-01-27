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
import { Calendar, Clock, Plus, Trash2, RefreshCw, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    slot_date: "",
    start_time: "16:00",
    end_time: "17:00",
    max_capacity: "",
  });

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const { data: slotsData, error } = await supabase
        .from("webinar_slots")
        .select("*")
        .order("slot_date", { ascending: true });

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

  const handleAddSlot = async () => {
    if (!newSlot.slot_date) {
      toast.error("Please select a date");
      return;
    }

    try {
      const { error } = await supabase.from("webinar_slots").insert({
        slot_date: newSlot.slot_date,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        max_capacity: newSlot.max_capacity ? parseInt(newSlot.max_capacity) : null,
        is_full: false,
      });

      if (error) throw error;

      toast.success("Webinar slot added successfully");
      setIsAddDialogOpen(false);
      setNewSlot({ slot_date: "", start_time: "16:00", end_time: "17:00", max_capacity: "" });
      fetchSlots();
    } catch (error: any) {
      console.error("Error adding slot:", error);
      toast.error("Failed to add webinar slot");
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

  const handleUpdateTime = async (slotId: string, field: "start_time" | "end_time", value: string) => {
    try {
      const { error } = await supabase
        .from("webinar_slots")
        .update({ [field]: value })
        .eq("id", slotId);

      if (error) throw error;

      toast.success("Time updated successfully");
      fetchSlots();
    } catch (error: any) {
      console.error("Error updating time:", error);
      toast.error("Failed to update time");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from("webinar_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      toast.success("Webinar slot deleted");
      fetchSlots();
    } catch (error: any) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete slot");
    }
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
            Manage webinar dates, times, and slot availability for partner orientation sessions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSlots}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Webinar Slot</DialogTitle>
                <DialogDescription>
                  Create a new webinar date and time for partner orientation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newSlot.slot_date}
                    onChange={(e) => setNewSlot({ ...newSlot, slot_date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Capacity (optional)</Label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={newSlot.max_capacity}
                    onChange={(e) => setNewSlot({ ...newSlot, max_capacity: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSlot}>Add Slot</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Slots List */}
      {slots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No webinar slots configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first slot to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slots.map((slot) => (
            <Card key={slot.id} className={slot.is_full ? "border-orange-500/30 bg-orange-500/5" : ""}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Date & Day */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {format(new Date(slot.slot_date), "EEEE")}
                      </p>
                      <p className="text-muted-foreground">
                        {format(new Date(slot.slot_date), "d MMMM yyyy")}
                      </p>
                    </div>
                  </div>

                  {/* Time Inputs */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => handleUpdateTime(slot.id, "start_time", e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => handleUpdateTime(slot.id, "end_time", e.target.value)}
                      className="w-28"
                    />
                  </div>

                  {/* Booked Count */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {slot.booked_count || 0} booked
                      {slot.max_capacity && ` / ${slot.max_capacity}`}
                    </span>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center gap-3">
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

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webinar Slot?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the slot for {format(new Date(slot.slot_date), "d MMMM yyyy")}.
                            Existing bookings will not be affected but new bookings won't be possible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
