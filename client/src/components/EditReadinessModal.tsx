// ============================================================
// ECOBLEND — EditReadinessModal
// Inline editor for VRL stage, VRL %, TRL level, TRL %
// ============================================================

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VRL_STAGES, TRL_LEVELS, Venture } from "@/lib/data";
import { useVentures } from "@/contexts/VentureContext";
import { toast } from "sonner";
import { TrendingUp, FlaskConical, Save, RotateCcw } from "lucide-react";

interface Props {
  venture: Venture;
  open: boolean;
  onClose: () => void;
}

export default function EditReadinessModal({ venture, open, onClose }: Props) {
  const { updateVentureReadiness } = useVentures();
  const [vrl, setVrl] = useState(venture.vrl);
  const [vrlPct, setVrlPct] = useState(venture.vrlPercent);
  const [trl, setTrl] = useState(venture.trl);
  const [trlPct, setTrlPct] = useState(venture.trlPercent);

  const handleSave = () => {
    updateVentureReadiness(venture.id, vrl, vrlPct, trl, trlPct);
    toast.success(`${venture.name} readiness updated`, {
      description: `VRL ${vrl} (${vrlPct}%) · TRL ${trl} (${trlPct}%)`,
    });
    onClose();
  };

  const handleReset = () => {
    setVrl(venture.vrl);
    setVrlPct(venture.vrlPercent);
    setTrl(venture.trl);
    setTrlPct(venture.trlPercent);
  };

  const vrlStage = VRL_STAGES.find(s => s.id === vrl);
  const trlLevel = TRL_LEVELS.find(l => l.id === trl);
  const wouldBeReady = vrl >= 3 && trl >= 6;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: venture.color }} />
            Edit Readiness — {venture.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* VRL Section */}
          <div className="rounded-xl p-4 space-y-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} style={{ color: "#22c55e" }} />
              <span className="text-sm font-bold" style={{ color: "#15803d" }}>Venture Readiness Level (VRL)</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Stage</label>
              <Select value={String(vrl)} onValueChange={v => setVrl(Number(v))}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VRL_STAGES.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      VRL {s.id} — {s.label} <span className="text-xs text-gray-400 ml-1">({s.tasks})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vrlStage && (
                <p className="text-xs text-gray-500 mt-1.5">{vrlStage.description}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">
                Progress through Stage {vrl} — <span style={{ color: "#22c55e" }}>{vrlPct}%</span>
              </label>
              <Slider
                min={0} max={100} step={5}
                value={[vrlPct]}
                onValueChange={([v]) => setVrlPct(v)}
                className="w-full"
              />
            </div>
          </div>

          {/* TRL Section */}
          <div className="rounded-xl p-4 space-y-4" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={15} style={{ color: "#1d4ed8" }} />
              <span className="text-sm font-bold" style={{ color: "#1e40af" }}>Technology Readiness Level (TRL)</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Level</label>
              <Select value={String(trl)} onValueChange={v => setTrl(Number(v))}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRL_LEVELS.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      TRL {l.id} — {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trlLevel && (
                <p className="text-xs text-gray-500 mt-1.5">{trlLevel.description}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">
                Progress through TRL {trl} — <span style={{ color: "#1d4ed8" }}>{trlPct}%</span>
              </label>
              <Slider
                min={0} max={100} step={5}
                value={[trlPct]}
                onValueChange={([v]) => setTrlPct(v)}
                className="w-full"
              />
            </div>
          </div>

          {/* Investment readiness indicator */}
          <div className={`rounded-lg p-3 text-xs font-medium flex items-center gap-2 ${wouldBeReady ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
            <span className={`w-2 h-2 rounded-full ${wouldBeReady ? "bg-green-500" : "bg-gray-300"}`} />
            {wouldBeReady
              ? "This venture will be marked Investment Ready (VRL ≥ 3 and TRL ≥ 6)"
              : `Investment Ready requires VRL ≥ 3 and TRL ≥ 6 (currently VRL ${vrl}, TRL ${trl})`}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw size={13} /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5" style={{ background: venture.color, color: "white" }}>
            <Save size={13} /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
