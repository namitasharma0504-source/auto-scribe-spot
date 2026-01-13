import { useState } from "react";
import { Database, Star, Laptop, CheckCircle2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskOption {
  id: "data_collection" | "reputation_sales" | "gms_sales";
  title: string;
  description: string;
  icon: React.ReactNode;
  earning: string;
  color: string;
}

const taskOptions: TaskOption[] = [
  {
    id: "data_collection",
    title: "Data Collection",
    description: "Collect garage visiting cards, upload photos & location, add garage details online",
    icon: <Database className="w-6 h-6" />,
    earning: "₹20 per listing",
    color: "emerald",
  },
  {
    id: "reputation_sales",
    title: "Reputation Management",
    description: "Pitch to garage owners, help claim their listing, close subscription deals",
    icon: <Star className="w-6 h-6" />,
    earning: "₹450 per sale (30%)",
    color: "purple",
  },
  {
    id: "gms_sales",
    title: "GMS Software Sales",
    description: "Demo software to owners, help with onboarding, close software deals",
    icon: <Laptop className="w-6 h-6" />,
    earning: "₹1,800 per sale (30%)",
    color: "blue",
  },
];

interface StartTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTask: (selectedTasks: string[]) => void;
}

export function StartTaskModal({ open, onOpenChange, onStartTask }: StartTaskModalProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>(["data_collection"]);

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleStart = () => {
    if (selectedTasks.length === 0) return;
    onStartTask(selectedTasks);
    onOpenChange(false);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; icon: string }> = {
      emerald: {
        bg: isSelected ? "bg-emerald-500/10" : "bg-muted/30",
        border: isSelected ? "border-emerald-500" : "border-border",
        icon: "text-emerald-600",
      },
      purple: {
        bg: isSelected ? "bg-purple-500/10" : "bg-muted/30",
        border: isSelected ? "border-purple-500" : "border-border",
        icon: "text-purple-600",
      },
      blue: {
        bg: isSelected ? "bg-blue-500/10" : "bg-muted/30",
        border: isSelected ? "border-blue-500" : "border-border",
        icon: "text-blue-600",
      },
    };
    return colors[color] || colors.emerald;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Start Your Task</DialogTitle>
          <DialogDescription>
            Select one or more tasks to begin. You can upsell additional services at the same garage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {taskOptions.map((task) => {
            const isSelected = selectedTasks.includes(task.id);
            const colors = getColorClasses(task.color, isSelected);

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${colors.bg} ${colors.border}`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? colors.bg : "bg-muted"}`}>
                  <span className={colors.icon}>{task.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{task.title}</h3>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm font-medium">
                    <IndianRupee className="w-3 h-3" />
                    <span className={colors.icon}>{task.earning}</span>
                  </div>
                </div>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                />
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={selectedTasks.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Start Task{selectedTasks.length > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
