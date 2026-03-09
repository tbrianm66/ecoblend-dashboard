// ============================================================
// FOUNDER PROFILES — Capability Score & Equity Management
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, User, Award, Briefcase, TrendingUp, Percent, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const VENTURES = [
  { id: "ecoblend-rd", name: "EcoBlend R&D", color: "#51AF37" },
  { id: "ecoblend",    name: "EcoBlend",     color: "#51AF37" },
  { id: "bebus",       name: "BEBUS",        color: "#3A97D3" },
  { id: "tone",        name: "TONE",         color: "#F49C13" },
  { id: "real",        name: "REAL",         color: "#ef4444" },
  { id: "pipe",        name: "PIPE",         color: "#0ea5e9" },
];

function capabilityScore(founder: any): number {
  const domain = founder.domainExpertiseScore ?? 0;
  const exp = founder.experienceScore ?? 0;
  const commit = founder.commitmentScore ?? 0;
  // Weighted: domain 40%, experience 35%, commitment 25%
  return Math.round((domain * 0.4 + exp * 0.35 + commit * 0.25) * 10) / 10;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(value / 10) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-semibold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function FounderCard({
  founder,
  ventureColor,
  onEdit,
  onDelete,
}: {
  founder: any;
  ventureColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = capabilityScore(founder);
  const scoreColor = score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${ventureColor}` }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: ventureColor }}>
              {(founder.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{founder.name}</div>
              {founder.role && <div className="text-xs text-gray-400">{founder.role}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>{score}</div>
            <div className="text-xs text-gray-400">/ 10 FCS</div>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <ScoreBar label="Domain Expertise" value={founder.domainExpertiseScore ?? 0} color="#3b82f6" />
          <ScoreBar label="Experience" value={founder.experienceScore ?? 0} color="#8b5cf6" />
          <ScoreBar label="Commitment" value={founder.commitmentScore ?? 0} color="#f59e0b" />
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {founder.equityPct != null && (
            <span className="flex items-center gap-1">
              <Percent size={10} /> {founder.equityPct}% equity
            </span>
          )}
          {founder.esopAllocated && (
            <span className="px-1.5 py-0.5 rounded" style={{ background: "#f0fdf4", color: "#16a34a" }}>ESOP</span>
          )}
          {founder.linkedIn && (
            <a href={founder.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">LinkedIn</a>
          )}
        </div>

        {founder.background && (
          <button
            className="flex items-center gap-1 text-xs text-gray-400 mt-2 hover:text-gray-600"
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Background
          </button>
        )}
        {expanded && founder.background && (
          <p className="text-xs text-gray-600 mt-2 p-2 rounded bg-gray-50">{founder.background}</p>
        )}

        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={onEdit}>
            <Edit2 size={10} /> Edit
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7 text-red-400 border-red-200 hover:bg-red-50" onClick={onDelete}>
            <Trash2 size={10} /> Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  name: "", role: "", background: "",
  domainExpertiseScore: 5, experienceScore: 5, commitmentScore: 5,
  equityPct: 0, esopAllocated: false, linkedIn: "",
};

export default function FounderProfiles() {
  const utils = trpc.useUtils();
  const [selectedVenture, setSelectedVenture] = useState("ecoblend");
  const [showAdd, setShowAdd] = useState(false);
  const [editingFounder, setEditingFounder] = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const venture = VENTURES.find(v => v.id === selectedVenture);
  const { data: founders = [], isLoading } = trpc.founders.list.useQuery({ ventureId: selectedVenture });

  const addMutation = trpc.founders.add.useMutation({
    onSuccess: () => {
      utils.founders.list.invalidate({ ventureId: selectedVenture });
      setShowAdd(false);
      setForm({ ...EMPTY_FORM });
      toast.success("Founder profile added");
    },
    onError: () => toast.error("Failed to add founder"),
  });

  const updateMutation = trpc.founders.update.useMutation({
    onSuccess: () => {
      utils.founders.list.invalidate({ ventureId: selectedVenture });
      setEditingFounder(null);
      toast.success("Founder profile updated");
    },
    onError: () => toast.error("Failed to update founder"),
  });

  const deleteMutation = trpc.founders.delete.useMutation({
    onSuccess: () => { utils.founders.list.invalidate({ ventureId: selectedVenture }); toast.success("Founder removed"); },
    onError: () => toast.error("Failed to remove founder"),
  });

  const openEdit = (founder: any) => {
    setEditingFounder(founder);
    setForm({
      name: founder.name ?? "",
      role: founder.role ?? "",
      background: founder.background ?? "",
      domainExpertiseScore: founder.domainExpertiseScore ?? 5,
      experienceScore: founder.experienceScore ?? 5,
      commitmentScore: founder.commitmentScore ?? 5,
      equityPct: founder.equityPct ?? 0,
      esopAllocated: founder.esopAllocated ?? false,
      linkedIn: founder.linkedIn ?? "",
    });
  };

  const avgFcs = founders.length > 0
    ? Math.round((founders.reduce((s, f) => s + capabilityScore(f), 0) / founders.length) * 10) / 10
    : 0;
  const totalEquity = founders.reduce((s, f) => s + (f.equityPct ?? 0), 0);

  const FormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label>
          <Input placeholder="e.g. Roland Acheampong" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Role</label>
          <Input placeholder="e.g. CEO / Co-Founder" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Background</label>
        <Textarea placeholder="Professional background and relevant experience" value={form.background} onChange={e => setForm(f => ({ ...f, background: e.target.value }))} rows={2} />
      </div>
      <div className="p-3 rounded-lg bg-gray-50 space-y-3">
        <p className="text-xs font-semibold text-gray-600">Founder Capability Score (FCS)</p>
        {[
          { key: "domainExpertiseScore", label: "Domain Expertise (40%)", hint: "How deep is their knowledge in this sector?" },
          { key: "experienceScore", label: "Experience (35%)", hint: "Track record of building ventures or relevant roles?" },
          { key: "commitmentScore", label: "Commitment (25%)", hint: "Full-time availability and dedication to this venture?" },
        ].map(({ key, label, hint }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs font-semibold text-gray-500">{label}</label>
              <span className="text-sm font-bold text-blue-600">{(form as any)[key]}/10</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">{hint}</p>
            <input
              type="range" min={0} max={10} step={1}
              value={(form as any)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
              className="w-full accent-blue-600"
            />
          </div>
        ))}
        <div className="flex items-center justify-between p-2 rounded" style={{ background: "#dbeafe" }}>
          <span className="text-xs font-semibold text-blue-700">Calculated FCS</span>
          <span className="text-lg font-bold text-blue-700">
            {Math.round((form.domainExpertiseScore * 0.4 + form.experienceScore * 0.35 + form.commitmentScore * 0.25) * 10) / 10}/10
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Equity %</label>
          <Input type="number" min={0} max={100} step={0.5} value={form.equityPct} onChange={e => setForm(f => ({ ...f, equityPct: parseFloat(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">LinkedIn URL</label>
          <Input placeholder="https://linkedin.com/in/..." value={form.linkedIn} onChange={e => setForm(f => ({ ...f, linkedIn: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="esop"
          checked={form.esopAllocated}
          onChange={e => setForm(f => ({ ...f, esopAllocated: e.target.checked }))}
          className="accent-green-600"
        />
        <label htmlFor="esop" className="text-xs text-gray-600">ESOP allocated</label>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                People
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Founder Profiles
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track founder capability scores, equity allocation, and ESOP status across all ventures.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "#1d4ed8", color: "white" }}
            onClick={() => { setShowAdd(true); setForm({ ...EMPTY_FORM }); }}
          >
            <Plus size={13} /> Add Founder
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { label: "Founders", value: founders.length, color: "#1d4ed8" },
            { label: "Avg FCS", value: `${avgFcs}/10`, color: avgFcs >= 7 ? "#10b981" : avgFcs >= 5 ? "#f59e0b" : "#ef4444" },
            { label: "Equity Allocated", value: `${totalEquity}%`, color: totalEquity <= 100 ? "#10b981" : "#ef4444" },
          ].map(k => (
            <div key={k.label} className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</div>
              <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Venture selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {VENTURES.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVenture(v.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={selectedVenture === v.id
                ? { background: v.color, color: "white", borderColor: v.color }
                : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              {v.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : founders.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
            <User size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No founder profiles for {venture?.name} yet.</p>
            <p className="text-xs text-gray-300 mt-1">Add founder profiles to calculate the team's Founder Capability Score.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {founders.map(founder => (
              <FounderCard
                key={founder.id}
                founder={founder}
                ventureColor={venture?.color ?? "#3A97D3"}
                onEdit={() => openEdit(founder)}
                onDelete={() => deleteMutation.mutate({ id: founder.id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User size={16} style={{ color: "#1d4ed8" }} />
              Add Founder — {venture?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <FormFields />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                size="sm"
                style={{ background: "#1d4ed8", color: "white" }}
                disabled={!form.name || addMutation.isPending}
                onClick={() => addMutation.mutate({ ventureId: selectedVenture, ...form })}
              >
                {addMutation.isPending ? "Adding..." : "Add Founder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingFounder && (
        <Dialog open={!!editingFounder} onOpenChange={() => setEditingFounder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 size={16} style={{ color: "#1d4ed8" }} />
                Edit Founder — {editingFounder.name}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <FormFields />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setEditingFounder(null)}>Cancel</Button>
                <Button
                  size="sm"
                  style={{ background: "#1d4ed8", color: "white" }}
                  disabled={!form.name || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: editingFounder.id, ...form })}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
