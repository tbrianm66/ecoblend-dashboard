// ============================================================
// MARKET INTELLIGENCE PAGE
// Design: Precision Industrial — TAM/SAM/SOM + Competitor Matrix
// Features: AI-generated market analysis, competitor cards,
//           per-venture filtering, manual entry
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";

import {
  Sparkles, Plus, Trash2, TrendingUp, Globe, ExternalLink,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  BarChart3, Users2, Zap, Shield
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatMoney(val: number | null | undefined, unit = "£M") {
  if (!val) return "—";
  if (val >= 1000) return `${(val / 1000).toFixed(1)}B ${unit.replace("M", "")}`;
  return `${val.toLocaleString()} ${unit}`;
}

const THREAT_COLORS: Record<string, string> = {
  High: "#ef4444", Medium: "#F69111", Low: "#56A837",
};
const STAGE_COLORS: Record<string, string> = {
  Startup: "#8b5cf6", "Scale-up": "#3b82f6", Established: "#0ea5e9",
  Enterprise: "#1d4ed8", Unknown: "#9ca3af",
};
const TYPE_LABELS: Record<string, string> = {
  Direct: "Direct", Indirect: "Indirect", Substitute: "Substitute", Potential: "Potential",
};

// ── TAM/SAM/SOM Funnel Visual ─────────────────────────────────────────────────
function MarketFunnel({ tam, sam, som, unit }: { tam: number; sam: number; som: number; unit: string }) {
  const maxVal = Math.max(tam, 1);
  const levels = [
    { label: "TAM", value: tam, color: "#3B85BA", desc: "Total Addressable Market", pct: 100 },
    { label: "SAM", value: sam, color: "#56A837", desc: "Serviceable Addressable Market", pct: Math.round((sam / maxVal) * 100) },
    { label: "SOM", value: som, color: "#F69111", desc: "Serviceable Obtainable Market", pct: Math.round((som / maxVal) * 100) },
  ];
  return (
    <div className="flex flex-col gap-2 w-full">
      {levels.map((l) => (
        <div key={l.label} className="flex items-center gap-3">
          <span className="text-xs font-bold w-8 shrink-0" style={{ color: l.color }}>{l.label}</span>
          <div className="flex-1 h-8 rounded-lg overflow-hidden bg-gray-100 relative">
            <div
              className="h-full rounded-lg transition-all duration-700 flex items-center pl-3"
              style={{ width: `${Math.max(l.pct, 5)}%`, background: l.color }}
            >
              <span className="text-white text-xs font-bold whitespace-nowrap">
                {formatMoney(l.value, unit)}
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-400 w-32 shrink-0">{l.desc}</span>
        </div>
      ))}
    </div>
  );
}

// ── Market Analysis Card ──────────────────────────────────────────────────────
function MarketCard({ item, ventureColor, onDelete }: { item: any; ventureColor: string; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${ventureColor}` }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{item.marketName}</h3>
              {item.aiGenerated && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#8b5cf615", color: "#8b5cf6" }}>
                  <Sparkles size={10} /> AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Globe size={11} /> {item.geography || "Global"}</span>
              <span>{item.marketYear || "2025"} → {item.forecastYear || "2030"}</span>
              {item.cagr > 0 && (
                <span className="flex items-center gap-1 font-semibold" style={{ color: "#56A837" }}>
                  <TrendingUp size={11} /> {item.cagr}% CAGR
                </span>
              )}
            </div>
          </div>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <MarketFunnel tam={item.tamValue || 0} sam={item.samValue || 0} som={item.somValue || 0} unit={item.tamUnit || "£M"} />

        {item.sourceName && (
          <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
            <span>Source:</span>
            {item.sourceUrl ? (
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5" style={{ color: "#3B85BA" }}>
                {item.sourceName} <ExternalLink size={9} />
              </a>
            ) : (
              <span>{item.sourceName}</span>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? "Hide details" : "Show drivers & barriers"}
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {item.keyDrivers && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                  <Zap size={10} style={{ color: "#56A837" }} /> Growth Drivers
                </div>
                <ul className="space-y-1">
                  {item.keyDrivers.split(",").map((d: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: "#56A837" }} />
                      {d.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.keyBarriers && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                  <Shield size={10} style={{ color: "#ef4444" }} /> Barriers
                </div>
                <ul className="space-y-1">
                  {item.keyBarriers.split(",").map((b: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#F69111" }} />
                      {b.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.notes && (
              <div className="col-span-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mt-1">
                {item.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Competitor Card ───────────────────────────────────────────────────────────
function CompetitorCard({ comp, onDelete }: { comp: any; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const threatColor = THREAT_COLORS[comp.threatLevel] || "#9ca3af";
  const stageColor = STAGE_COLORS[comp.stage] || "#9ca3af";
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${threatColor}` }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{comp.name}</span>
              {comp.aiGenerated && (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#8b5cf615", color: "#8b5cf6" }}>
                  <Sparkles size={9} /> AI
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stageColor}15`, color: stageColor }}>
                {comp.stage || "Unknown"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${threatColor}15`, color: threatColor }}>
                {comp.threatLevel || "Medium"} threat
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {TYPE_LABELS[comp.competitorType] || "Direct"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {comp.hq && <span className="flex items-center gap-1"><Globe size={10} /> {comp.hq}</span>}
              {comp.founded && <span>Est. {comp.founded}</span>}
              {comp.revenueEstimate && <span>Rev: {comp.revenueEstimate}</span>}
              {comp.fundingRaised && <span>Funding: {comp.fundingRaised}</span>}
              {comp.website && (
                <a href={comp.website.startsWith("http") ? comp.website : `https://${comp.website}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-0.5 hover:underline" style={{ color: "#3B85BA" }}>
                  Website <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors ml-2">
            <Trash2 size={14} />
          </button>
        </div>

        {comp.productDescription && (
          <p className="text-xs text-gray-600 mb-2">{comp.productDescription}</p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? "Hide SWOT" : "Show strengths, weaknesses & differentiator"}
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {comp.strengths && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-green-700 mb-1">Strengths</div>
                <p className="text-xs text-green-800">{comp.strengths}</p>
              </div>
            )}
            {comp.weaknesses && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-700 mb-1">Weaknesses</div>
                <p className="text-xs text-red-800">{comp.weaknesses}</p>
              </div>
            )}
            {comp.differentiator && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-700 mb-1">Our Differentiator</div>
                <p className="text-xs text-blue-800">{comp.differentiator}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Market Analysis Dialog ────────────────────────────────────────────────
function AddMarketDialog({ open, onClose, ventureId, onSuccess }: { open: boolean; onClose: () => void; ventureId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({ marketName: "", geography: "Global", tamValue: "", samValue: "", somValue: "", cagr: "", marketYear: "2025", forecastYear: "2030", sourceName: "", sourceUrl: "", keyDrivers: "", keyBarriers: "", notes: "" });
  const addMutation = trpc.market.add.useMutation({
    onSuccess: () => { toast.success("Market analysis added"); onSuccess(); onClose(); },
    onError: () => toast.error("Failed to add market analysis"),
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Market Analysis</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Market Name *</label>
            <Input placeholder="e.g. Global Eco-Materials Market" value={form.marketName} onChange={e => set("marketName", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Geography</label>
              <Input placeholder="Global" value={form.geography} onChange={e => set("geography", e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">CAGR (%)</label>
              <Input type="number" placeholder="8.5" value={form.cagr} onChange={e => set("cagr", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">TAM (£M)</label>
              <Input type="number" placeholder="50000" value={form.tamValue} onChange={e => set("tamValue", e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">SAM (£M)</label>
              <Input type="number" placeholder="5000" value={form.samValue} onChange={e => set("samValue", e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">SOM (£M)</label>
              <Input type="number" placeholder="250" value={form.somValue} onChange={e => set("somValue", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Base Year</label>
              <Input type="number" placeholder="2025" value={form.marketYear} onChange={e => set("marketYear", e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Forecast Year</label>
              <Input type="number" placeholder="2030" value={form.forecastYear} onChange={e => set("forecastYear", e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Source Name</label>
            <Input placeholder="Grand View Research, Statista..." value={form.sourceName} onChange={e => set("sourceName", e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Source URL</label>
            <Input placeholder="https://..." value={form.sourceUrl} onChange={e => set("sourceUrl", e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Key Growth Drivers (comma-separated)</label>
            <Input placeholder="Net-zero mandates, ESG investment growth, Circular economy legislation" value={form.keyDrivers} onChange={e => set("keyDrivers", e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Key Barriers (comma-separated)</label>
            <Input placeholder="High R&D costs, Incumbent supply chains, Regulatory uncertainty" value={form.keyBarriers} onChange={e => set("keyBarriers", e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
            <Textarea rows={2} placeholder="Summary notes..." value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.marketName || addMutation.isPending} onClick={() => addMutation.mutate({
            ventureId,
            marketName: form.marketName,
            geography: form.geography || undefined,
            tamValue: form.tamValue ? Number(form.tamValue) : undefined,
            samValue: form.samValue ? Number(form.samValue) : undefined,
            somValue: form.somValue ? Number(form.somValue) : undefined,
            cagr: form.cagr ? Number(form.cagr) : undefined,
            marketYear: form.marketYear ? Number(form.marketYear) : undefined,
            forecastYear: form.forecastYear ? Number(form.forecastYear) : undefined,
            sourceName: form.sourceName || undefined,
            sourceUrl: form.sourceUrl || undefined,
            keyDrivers: form.keyDrivers || undefined,
            keyBarriers: form.keyBarriers || undefined,
            notes: form.notes || undefined,
          })}>
            {addMutation.isPending ? "Saving..." : "Add Analysis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Competitor Dialog ─────────────────────────────────────────────────────
function AddCompetitorDialog({ open, onClose, ventureId, onSuccess }: { open: boolean; onClose: () => void; ventureId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", website: "", hq: "", founded: "", stage: "Unknown", competitorType: "Direct", productDescription: "", strengths: "", weaknesses: "", differentiator: "", revenueEstimate: "", fundingRaised: "", threatLevel: "Medium", notes: "" });
  const addMutation = trpc.competitors.add.useMutation({
    onSuccess: () => { toast.success("Competitor added"); onSuccess(); onClose(); },
    onError: () => toast.error("Failed to add competitor"),
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Competitor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Company Name *</label>
            <Input placeholder="Competitor name" value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Website</label>
              <Input placeholder="competitor.com" value={form.website} onChange={e => set("website", e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">HQ Location</label>
              <Input placeholder="London, UK" value={form.hq} onChange={e => set("hq", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Founded</label>
              <Input type="number" placeholder="2018" value={form.founded} onChange={e => set("founded", e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Stage</label>
              <Select value={form.stage} onValueChange={v => set("stage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Startup","Scale-up","Established","Enterprise","Unknown"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Threat</label>
              <Select value={form.threatLevel} onValueChange={v => set("threatLevel", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low","Medium","High"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Competitor Type</label>
            <Select value={form.competitorType} onValueChange={v => set("competitorType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Direct","Indirect","Substitute","Potential"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Product / Service Description</label>
            <Textarea rows={2} placeholder="What do they offer?" value={form.productDescription} onChange={e => set("productDescription", e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Strengths</label>
            <Textarea rows={2} placeholder="Key strengths..." value={form.strengths} onChange={e => set("strengths", e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Weaknesses</label>
            <Textarea rows={2} placeholder="Key weaknesses..." value={form.weaknesses} onChange={e => set("weaknesses", e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Our Differentiator vs This Competitor</label>
            <Textarea rows={2} placeholder="How do we differ?" value={form.differentiator} onChange={e => set("differentiator", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Revenue Estimate</label>
              <Input placeholder="£5M–£20M" value={form.revenueEstimate} onChange={e => set("revenueEstimate", e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Funding Raised</label>
              <Input placeholder="£2M Series A" value={form.fundingRaised} onChange={e => set("fundingRaised", e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.name || addMutation.isPending} onClick={() => addMutation.mutate({
            ventureId,
            name: form.name,
            website: form.website || undefined,
            hq: form.hq || undefined,
            founded: form.founded ? Number(form.founded) : undefined,
            stage: form.stage as any,
            competitorType: form.competitorType as any,
            productDescription: form.productDescription || undefined,
            strengths: form.strengths || undefined,
            weaknesses: form.weaknesses || undefined,
            differentiator: form.differentiator || undefined,
            revenueEstimate: form.revenueEstimate || undefined,
            fundingRaised: form.fundingRaised || undefined,
            threatLevel: form.threatLevel as any,
            notes: form.notes || undefined,
          })}>
            {addMutation.isPending ? "Saving..." : "Add Competitor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketIntelligence() {
  const { ventures } = useVentures();
  const portfolioVentures = ventures.filter(v => !v.isInternalLab);
  const [selectedVentureId, setSelectedVentureId] = useState(portfolioVentures[0]?.id ?? "ecoblend");
  const [activeTab, setActiveTab] = useState<"market" | "competitors">("market");
  const [showAddMarket, setShowAddMarket] = useState(false);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);

  const selectedVenture = portfolioVentures.find(v => v.id === selectedVentureId);

  const utils = trpc.useUtils();

  // Market data
  const { data: marketData = [], isLoading: marketLoading } = trpc.market.listForVenture.useQuery({ ventureId: selectedVentureId });
  const deleteMarket = trpc.market.delete.useMutation({
    onSuccess: () => { utils.market.listForVenture.invalidate({ ventureId: selectedVentureId }); toast.success("Removed"); },
  });
  const generateMarketAI = trpc.market.generateAI.useMutation({
    onSuccess: (res) => {
      utils.market.listForVenture.invalidate({ ventureId: selectedVentureId });
      toast.success(`AI generated market analysis for ${selectedVenture?.name}`);
    },
    onError: () => toast.error("AI generation failed"),
  });

  // Competitor data
  const { data: competitorData = [], isLoading: compLoading } = trpc.competitors.listForVenture.useQuery({ ventureId: selectedVentureId });
  const deleteCompetitor = trpc.competitors.delete.useMutation({
    onSuccess: () => { utils.competitors.listForVenture.invalidate({ ventureId: selectedVentureId }); toast.success("Removed"); },
  });
  const generateCompAI = trpc.competitors.generateAI.useMutation({
    onSuccess: (res) => {
      utils.competitors.listForVenture.invalidate({ ventureId: selectedVentureId });
      toast.success(`AI identified ${res.count} competitors for ${selectedVenture?.name}`);
    },
    onError: () => toast.error("AI generation failed"),
  });

  // Summary stats across all ventures
  const { data: allMarket = [] } = trpc.market.listAll.useQuery();
  const { data: allCompetitors = [] } = trpc.competitors.listAll.useQuery();
  const totalTAM = useMemo(() => allMarket.reduce((s, m) => s + (m.tamValue || 0), 0), [allMarket]);
  const highThreatCount = useMemo(() => allCompetitors.filter(c => c.threatLevel === "High").length, [allCompetitors]);

  const handleGenerateMarket = () => {
    if (!selectedVenture) return;
    generateMarketAI.mutate({
      ventureId: selectedVentureId,
      ventureName: selectedVenture.name,
      sector: selectedVenture.sector,
      description: selectedVenture.description || selectedVenture.tagline,
    });
  };

  const handleGenerateCompetitors = () => {
    if (!selectedVenture) return;
    generateCompAI.mutate({
      ventureId: selectedVentureId,
      ventureName: selectedVenture.name,
      sector: selectedVenture.sector,
      description: selectedVenture.description || selectedVenture.tagline,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="vos-page-title">Market Intelligence</h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
            <p className="text-sm text-gray-500 mt-1">TAM/SAM/SOM analysis and competitive landscape per venture</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center px-4 py-2 bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-lg font-bold" style={{ color: "#3B85BA", fontFamily: "'Prompt', sans-serif" }}>{formatMoney(totalTAM)}</div>
              <div className="text-xs text-gray-400">Total TAM tracked</div>
            </div>
            <div className="text-center px-4 py-2 bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-lg font-bold" style={{ color: "#ef4444", fontFamily: "'Prompt', sans-serif" }}>{highThreatCount}</div>
              <div className="text-xs text-gray-400">High-threat competitors</div>
            </div>
            <div className="text-center px-4 py-2 bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-lg font-bold" style={{ color: "#56A837", fontFamily: "'Prompt', sans-serif" }}>{allCompetitors.length}</div>
              <div className="text-xs text-gray-400">Competitors mapped</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Venture selector + tab switcher */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {portfolioVentures.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVentureId(v.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  borderColor: selectedVentureId === v.id ? v.color : "#e5e7eb",
                  background: selectedVentureId === v.id ? `${v.color}15` : "white",
                  color: selectedVentureId === v.id ? v.color : "#6b7280",
                }}
              >
                {v.logo && <img src={v.logo} alt="" loading="lazy" className="w-4 h-4 object-contain rounded" style={{ background: v.logoBg || "#f9fafb" }} />}
                {v.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1 p-1 rounded-xl bg-gray-100">
            {(["market", "competitors"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                style={{
                  background: activeTab === tab ? (selectedVenture?.color || "#56A837") : "transparent",
                  color: activeTab === tab ? "white" : "#6b7280",
                }}
              >
                {tab === "market" ? "Market Size" : "Competitors"}
              </button>
            ))}
          </div>
        </div>

        {/* Market Size Tab */}
        {activeTab === "market" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Market Analysis — {selectedVenture?.name}
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={handleGenerateMarket}
                  disabled={generateMarketAI.isPending}
                  style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
                >
                  <Sparkles size={13} />
                  {generateMarketAI.isPending ? "Generating..." : "AI Generate"}
                </Button>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowAddMarket(true)}
                  style={{ background: selectedVenture?.color || "#56A837" }}>
                  <Plus size={13} /> Add Analysis
                </Button>
              </div>
            </div>

            {marketLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Loading market data...</div>
            ) : marketData.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: "#e5e7eb" }}>
                <BarChart3 size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-semibold mb-1">No market analysis yet</p>
                <p className="text-xs text-gray-400 mb-4">Use AI Generate to create a market analysis from the venture description, or add manually.</p>
                <Button size="sm" onClick={handleGenerateMarket} disabled={generateMarketAI.isPending}
                  style={{ background: "#8b5cf6" }} className="gap-1.5 text-xs text-white">
                  <Sparkles size={13} /> {generateMarketAI.isPending ? "Generating..." : "AI Generate Market Analysis"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {marketData.map(item => (
                  <MarketCard
                    key={item.id}
                    item={item}
                    ventureColor={selectedVenture?.color || "#56A837"}
                    onDelete={() => deleteMarket.mutate({ id: item.id })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === "competitors" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  Competitive Landscape — {selectedVenture?.name}
                </h2>
                {competitorData.length > 0 && (
                  <div className="flex gap-3 mt-1">
                    {["High","Medium","Low"].map(level => {
                      const count = competitorData.filter(c => c.threatLevel === level).length;
                      return count > 0 ? (
                        <span key={level} className="text-xs flex items-center gap-1" style={{ color: THREAT_COLORS[level] }}>
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: THREAT_COLORS[level] }} />
                          {count} {level} threat
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={handleGenerateCompetitors}
                  disabled={generateCompAI.isPending}
                  style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
                >
                  <Sparkles size={13} />
                  {generateCompAI.isPending ? "Identifying..." : "AI Identify Competitors"}
                </Button>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowAddCompetitor(true)}
                  style={{ background: selectedVenture?.color || "#56A837" }}>
                  <Plus size={13} /> Add Competitor
                </Button>
              </div>
            </div>

            {compLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Loading competitors...</div>
            ) : competitorData.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: "#e5e7eb" }}>
                <Users2 size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-semibold mb-1">No competitors mapped yet</p>
                <p className="text-xs text-gray-400 mb-4">Use AI to identify competitors from the venture description, or add them manually.</p>
                <Button size="sm" onClick={handleGenerateCompetitors} disabled={generateCompAI.isPending}
                  style={{ background: "#8b5cf6" }} className="gap-1.5 text-xs text-white">
                  <Sparkles size={13} /> {generateCompAI.isPending ? "Identifying..." : "AI Identify Competitors"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {competitorData.map(comp => (
                  <CompetitorCard
                    key={comp.id}
                    comp={comp}
                    onDelete={() => deleteCompetitor.mutate({ id: comp.id })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddMarketDialog
        open={showAddMarket}
        onClose={() => setShowAddMarket(false)}
        ventureId={selectedVentureId}
        onSuccess={() => utils.market.listForVenture.invalidate({ ventureId: selectedVentureId })}
      />
      <AddCompetitorDialog
        open={showAddCompetitor}
        onClose={() => setShowAddCompetitor(false)}
        ventureId={selectedVentureId}
        onSuccess={() => utils.competitors.listForVenture.invalidate({ ventureId: selectedVentureId })}
      />
    </div>
  );
}
