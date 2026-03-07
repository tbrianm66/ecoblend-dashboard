// ============================================================
// ECOBLEND — MilestoneEditModal
// Inline milestone checklist editor for venture cards.
// ============================================================

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Venture, Milestone } from "@/lib/data";
import { useVentures } from "@/contexts/VentureContext";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MilestoneEditModalProps {
  venture: Venture;
  open: boolean;
  onClose: () => void;
}

export default function MilestoneEditModal({ venture, open, onClose }: MilestoneEditModalProps) {
  const { updateAllMilestones, ventures } = useVentures();
  const liveVenture = ventures.find(v => v.id === venture.id) ?? venture;
  const [milestones, setMilestones] = useState<Milestone[]>([...liveVenture.milestones]);
  const [newLabel, setNewLabel] = useState("");

  const handleToggle = (index: number) => {
    setMilestones(prev => prev.map((m, i) => i === index ? { ...m, completed: !m.completed } : m));
  };

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    setMilestones(prev => [
      ...prev,
      { label, completed: false, date: new Date().toISOString().split("T")[0] },
    ]);
    setNewLabel("");
  };

  const handleRemove = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateAllMilestones(venture.id, milestones);
    toast.success(`Milestones saved for ${venture.name}`);
    onClose();
  };

  const completed = milestones.filter(m => m.completed).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: venture.color }} />
            {venture.name} — Milestones
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{completed} of {total} completed</span>
            <span className="font-mono font-semibold" style={{ color: venture.color }}>{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: venture.color }}
            />
          </div>
        </div>

        {/* Milestone list */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {milestones.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all"
              style={{
                borderColor: m.completed ? `${venture.color}40` : "#e5e7eb",
                background: m.completed ? `${venture.color}08` : "white",
              }}
            >
              <button
                onClick={() => handleToggle(i)}
                className="flex-shrink-0 transition-colors"
                style={{ color: m.completed ? venture.color : "#d1d5db" }}
              >
                {m.completed ? <CheckCircle2 size={17} /> : <Circle size={17} />}
              </button>
              <span
                className="flex-1 text-sm leading-snug"
                style={{
                  color: m.completed ? "#9ca3af" : "#1c1c1e",
                  textDecoration: m.completed ? "line-through" : "none",
                }}
              >
                {m.label}
              </span>
              {m.date && (
                <span className="text-xs text-gray-300 font-mono flex-shrink-0">{m.date}</span>
              )}
              <button
                onClick={() => handleRemove(i)}
                className="flex-shrink-0 text-gray-200 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {milestones.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">
              No milestones yet. Add one below.
            </div>
          )}
        </div>

        {/* Add new milestone */}
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Add a new milestone..."
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newLabel.trim()}
            className="flex-shrink-0"
            style={{ background: venture.color, color: "white", border: "none" }}
          >
            <Plus size={14} />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            style={{ background: venture.color, color: "white", border: "none" }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
