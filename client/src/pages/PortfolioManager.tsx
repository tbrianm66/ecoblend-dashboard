/**
 * PortfolioManager — Venture → Portfolio → Offering hierarchy
 * Sprint 61: Each venture has multiple portfolios; each portfolio has multiple offerings.
 * Offerings are independent execution units with their own workflows, data, and analytics.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  Package,
  BarChart3,
  Pencil,
  Trash2,
  ExternalLink,
  TrendingUp,
  Zap,
} from "lucide-react";

// ── Color palette for portfolios ──────────────────────────────────────────────
const PORTFOLIO_COLORS = [
  "#56A837", "#3B85BA", "#F69111", "#E05C5C", "#8B5CF6",
  "#06B6D4", "#F59E0B", "#10B981", "#EF4444", "#6366F1",
];

const OFFERING_STATUS_COLORS: Record<string, string> = {
  Concept: "#6b7280",
  Development: "#F69111",
  Pilot: "#3B85BA",
  Live: "#56A837",
  Scaling: "#8B5CF6",
  Sunset: "#E05C5C",
};

const OFFERING_TYPE_ICONS: Record<string, string> = {
  "Physical Product": "📦",
  "Digital Product": "💻",
  "Service": "🛠️",
  "SaaS": "☁️",
  "Subscription": "🔄",
  "Marketplace": "🏪",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Portfolio = {
  id: string;
  ventureId: string;
  name: string;
  description?: string | null;
  portfolioType?: string | null;
  status?: string | null;
  color?: string | null;
  sortOrder?: number | null;
};

type Offering = {
  id: string;
  portfolioId: string;
  ventureId: string;
  name: string;
  description?: string | null;
  offeringType?: string | null;
  offeringStatus?: string | null;
  trl?: number | null;
  brlScore?: number | null;
  revenueModel?: string | null;
  targetSegment?: string | null;
  pricePoint?: string | null;
  color?: string | null;
  tags?: string | null;
};

// ── Portfolio Form ─────────────────────────────────────────────────────────────
function PortfolioForm({
  ventureId,
  initial,
  onClose,
}: {
  ventureId: string;
  initial?: Portfolio | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [portfolioType, setPortfolioType] = useState<string>(initial?.portfolioType ?? "Mixed");
  const [status, setStatus] = useState<string>(initial?.status ?? "Active");
  const [color, setColor] = useState(initial?.color ?? PORTFOLIO_COLORS[0]);

  const upsert = trpc.portfoliosOfferings.portfolios.upsert.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.portfolios.list.invalidate({ ventureId });
      toast.success(initial ? "Portfolio updated" : "Portfolio created");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. EcoBlend Consumer Products" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Portfolio Type</Label>
          <Select value={portfolioType} onValueChange={setPortfolioType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Product", "Service", "Licensing", "Platform", "Mixed"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Active", "Pre-Launch", "Archived"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Colour</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {PORTFOLIO_COLORS.map((c) => (
            <button
              key={c}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ background: c, borderColor: color === c ? "#1a2332" : "transparent" }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() =>
            upsert.mutate({
              id: initial?.id,
              ventureId,
              name,
              description,
              portfolioType: portfolioType as any,
              status: status as any,
              color,
            })
          }
          disabled={!name.trim() || upsert.isPending}
        >
          {upsert.isPending ? "Saving…" : initial ? "Update Portfolio" : "Create Portfolio"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Offering Form ─────────────────────────────────────────────────────────────
function OfferingForm({
  portfolioId,
  ventureId,
  initial,
  onClose,
}: {
  portfolioId: string;
  ventureId: string;
  initial?: Offering | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [offeringType, setOfferingType] = useState<string>(initial?.offeringType ?? "Physical Product");
  const [offeringStatus, setOfferingStatus] = useState<string>(initial?.offeringStatus ?? "Concept");
  const [revenueModel, setRevenueModel] = useState<string>(initial?.revenueModel ?? "B2B");
  const [targetSegment, setTargetSegment] = useState(initial?.targetSegment ?? "");
  const [pricePoint, setPricePoint] = useState(initial?.pricePoint ?? "");
  const [trl, setTrl] = useState<string>(String(initial?.trl ?? "1"));
  const [brlScore, setBrlScore] = useState<string>(String(initial?.brlScore ?? "0"));
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [color, setColor] = useState(initial?.color ?? PORTFOLIO_COLORS[2]);

  const upsert = trpc.portfoliosOfferings.offerings.upsert.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.offerings.list.invalidate({ portfolioId });
      toast.success(initial ? "Offering updated" : "Offering created");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. EcoBlend Pro Shampoo Bar" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Offering Type</Label>
          <Select value={offeringType} onValueChange={setOfferingType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Physical Product", "Digital Product", "Service", "SaaS", "Subscription", "Marketplace"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={offeringStatus} onValueChange={setOfferingStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Concept", "Development", "Pilot", "Live", "Scaling", "Sunset"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Revenue Model</Label>
          <Select value={revenueModel} onValueChange={setRevenueModel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["B2B", "D2C", "B2B2C", "Marketplace", "Licensing", "Freemium"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target Segment</Label>
          <Input value={targetSegment} onChange={(e) => setTargetSegment(e.target.value)} placeholder="e.g. Eco-conscious millennials" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>TRL (1–9)</Label>
          <Input type="number" min={1} max={9} value={trl} onChange={(e) => setTrl(e.target.value)} />
        </div>
        <div>
          <Label>BRL Score (0–100)</Label>
          <Input type="number" min={0} max={100} value={brlScore} onChange={(e) => setBrlScore(e.target.value)} />
        </div>
        <div>
          <Label>Price Point</Label>
          <Input value={pricePoint} onChange={(e) => setPricePoint(e.target.value)} placeholder="e.g. £12.99" />
        </div>
      </div>
      <div>
        <Label>Tags (comma-separated)</Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. sustainable, haircare, plastic-free" />
      </div>
      <div>
        <Label>Colour</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {PORTFOLIO_COLORS.map((c) => (
            <button
              key={c}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ background: c, borderColor: color === c ? "#1a2332" : "transparent" }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() =>
            upsert.mutate({
              id: initial?.id,
              portfolioId,
              ventureId,
              name,
              description,
              offeringType: offeringType as any,
              offeringStatus: offeringStatus as any,
              revenueModel: revenueModel as any,
              targetSegment,
              pricePoint,
              trl: parseInt(trl) || 1,
              brlScore: parseInt(brlScore) || 0,
              tags,
              color,
            })
          }
          disabled={!name.trim() || upsert.isPending}
        >
          {upsert.isPending ? "Saving…" : initial ? "Update Offering" : "Create Offering"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Offering Card ─────────────────────────────────────────────────────────────
function OfferingCard({
  offering,
  onEdit,
  onDelete,
  onDrillDown,
}: {
  offering: Offering;
  onEdit: () => void;
  onDelete: () => void;
  onDrillDown: () => void;
}) {
  const statusColor = OFFERING_STATUS_COLORS[offering.offeringStatus ?? "Concept"] ?? "#6b7280";
  const typeIcon = OFFERING_TYPE_ICONS[offering.offeringType ?? ""] ?? "📦";

  return (
    <div
      className="bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 group cursor-pointer"
      style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${offering.color ?? "#56A837"}` }}
      onClick={onDrillDown}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcon}</span>
          <div>
            <p className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {offering.name}
            </p>
            <p className="text-xs text-gray-400">{offering.offeringType ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${statusColor}18`, color: statusColor }}
          >
            {offering.offeringStatus ?? "Concept"}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
          >
            <Pencil size={11} className="text-gray-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
          >
            <Trash2 size={11} className="text-red-400" />
          </button>
        </div>
      </div>

      {offering.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{offering.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400">
        {offering.revenueModel && (
          <span className="flex items-center gap-1">
            <TrendingUp size={10} />
            {offering.revenueModel}
          </span>
        )}
        {offering.trl && (
          <span className="flex items-center gap-1">
            <Zap size={10} />
            TRL {offering.trl}
          </span>
        )}
        {offering.brlScore !== null && offering.brlScore !== undefined && (
          <span className="flex items-center gap-1">
            <BarChart3 size={10} />
            BRL {offering.brlScore}%
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-blue-400 hover:text-blue-600">
          <ExternalLink size={10} />
          Detail
        </span>
      </div>

      {offering.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {offering.tags.split(",").slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Portfolio Section ─────────────────────────────────────────────────────────
function PortfolioSection({
  portfolio,
  onEditPortfolio,
  onDeletePortfolio,
}: {
  portfolio: Portfolio;
  onEditPortfolio: (p: Portfolio) => void;
  onDeletePortfolio: (id: string) => void;
}) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(true);
  const [showAddOffering, setShowAddOffering] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);

  const utils = trpc.useUtils();
  const { data: offerings = [], isLoading } = trpc.portfoliosOfferings.offerings.list.useQuery({
    portfolioId: portfolio.id,
  });

  const deleteOffering = trpc.portfoliosOfferings.offerings.delete.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.offerings.list.invalidate({ portfolioId: portfolio.id });
      toast.success("Offering removed");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: "#e5e7eb" }}
    >
      {/* Portfolio header */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderLeft: `4px solid ${portfolio.color ?? "#56A837"}` }}
          >
            <div className="flex items-center gap-3">
              {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              <Layers size={16} style={{ color: portfolio.color ?? "#56A837" }} />
              <div>
                <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  {portfolio.name}
                </span>
                {portfolio.portfolioType && (
                  <span className="ml-2 text-xs text-gray-400">{portfolio.portfolioType}</span>
                )}
              </div>
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: portfolio.color ?? "#56A837",
                  color: portfolio.color ?? "#56A837",
                  background: `${portfolio.color ?? "#56A837"}10`,
                }}
              >
                {portfolio.status ?? "Active"}
              </Badge>
              <span className="text-xs text-gray-400 font-mono">
                {offerings.length} offering{offerings.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => setShowAddOffering(true)}
              >
                <Plus size={12} /> Add Offering
              </Button>
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100"
                onClick={() => onEditPortfolio(portfolio)}
              >
                <Pencil size={13} className="text-gray-400" />
              </button>
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"
                onClick={() => onDeletePortfolio(portfolio.id)}
              >
                <Trash2 size={13} className="text-red-400" />
              </button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 pt-3">
            {portfolio.description && (
              <p className="text-xs text-gray-500 mb-4">{portfolio.description}</p>
            )}
            {isLoading ? (
              <div className="text-xs text-gray-400 py-4 text-center">Loading offerings…</div>
            ) : offerings.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-xl" style={{ borderColor: "#e5e7eb" }}>
                <Package size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400 mb-3">No offerings yet</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddOffering(true)}>
                  <Plus size={13} className="mr-1" /> Add First Offering
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {offerings.map((o) => (
                  <OfferingCard
                    key={o.id}
                    offering={o as Offering}
                    onEdit={() => setEditingOffering(o as Offering)}
                    onDelete={() => {
                      if (confirm(`Delete offering "${o.name}"?`)) {
                        deleteOffering.mutate({ id: o.id });
                      }
                    }}
                    onDrillDown={() => navigate(`/offering/${o.id}`)}
                  />
                ))}
                <button
                  className="rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-gray-400 hover:border-gray-300 transition-colors min-h-[100px]"
                  style={{ borderColor: "#e5e7eb" }}
                  onClick={() => setShowAddOffering(true)}
                >
                  <Plus size={20} />
                  <span className="text-xs">Add Offering</span>
                </button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Add Offering Dialog */}
      <Dialog open={showAddOffering} onOpenChange={setShowAddOffering}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Offering in {portfolio.name}</DialogTitle>
          </DialogHeader>
          <OfferingForm
            portfolioId={portfolio.id}
            ventureId={portfolio.ventureId}
            onClose={() => setShowAddOffering(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Offering Dialog */}
      <Dialog open={!!editingOffering} onOpenChange={(o) => !o && setEditingOffering(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Offering</DialogTitle>
          </DialogHeader>
          {editingOffering && (
            <OfferingForm
              portfolioId={portfolio.id}
              ventureId={portfolio.ventureId}
              initial={editingOffering}
              onClose={() => setEditingOffering(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PortfolioManager() {
  const { ventures } = useVentures();
  const [selectedVentureId, setSelectedVentureId] = useState<string>(
    ventures[0]?.id ?? ""
  );
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);

  const utils = trpc.useUtils();
  const { data: portfolios = [], isLoading } = trpc.portfoliosOfferings.portfolios.list.useQuery(
    { ventureId: selectedVentureId },
    { enabled: !!selectedVentureId }
  );

  const deletePortfolio = trpc.portfoliosOfferings.portfolios.delete.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.portfolios.list.invalidate({ ventureId: selectedVentureId });
      toast.success("Portfolio deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedVenture = ventures.find((v) => v.id === selectedVentureId);
  const totalOfferings = 0; // computed below after offerings load

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "#56A83715", color: "#56A837" }}
              >
                Portfolio Architecture
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Portfolio & Offering Manager
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Each venture contains multiple portfolios; each portfolio contains independent execution units (offerings).
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            style={{ background: "#56A837" }}
            onClick={() => setShowAddPortfolio(true)}
            disabled={!selectedVentureId}
          >
            <Plus size={14} /> New Portfolio
          </Button>
        </div>

        {/* Venture selector */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-gray-500 font-medium">Venture:</span>
          <div className="flex gap-2 flex-wrap">
            {ventures.map((v) => (
              <button
                key={v.id}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                style={{
                  borderColor: selectedVentureId === v.id ? (v.color ?? "#56A837") : "#e5e7eb",
                  background: selectedVentureId === v.id ? `${v.color ?? "#56A837"}12` : "white",
                  color: selectedVentureId === v.id ? (v.color ?? "#56A837") : "#6b7280",
                }}
                onClick={() => setSelectedVentureId(v.id)}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Summary row */}
        {selectedVenture && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Portfolios</p>
                <p className="text-2xl font-bold" style={{ color: "#56A837", fontFamily: "'Prompt', sans-serif" }}>
                  {portfolios.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active Portfolios</p>
                <p className="text-2xl font-bold" style={{ color: "#3B85BA", fontFamily: "'Prompt', sans-serif" }}>
                  {portfolios.filter((p) => p.status === "Active").length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Venture</p>
                <p className="text-sm font-bold text-gray-700" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  {selectedVenture.name}
                </p>
                <p className="text-xs text-gray-400">{selectedVenture.sector ?? "—"}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio list */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading portfolios…</div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl" style={{ borderColor: "#e5e7eb" }}>
            <Layers size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium mb-1">No portfolios yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Create your first portfolio to start organising offerings for {selectedVenture?.name ?? "this venture"}.
            </p>
            <Button onClick={() => setShowAddPortfolio(true)} style={{ background: "#56A837" }}>
              <Plus size={14} className="mr-1" /> Create First Portfolio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolios.map((p) => (
              <PortfolioSection
                key={p.id}
                portfolio={p as Portfolio}
                onEditPortfolio={setEditingPortfolio}
                onDeletePortfolio={(id) => {
                  if (confirm("Delete this portfolio and all its offerings?")) {
                    deletePortfolio.mutate({ id });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Portfolio Dialog */}
      <Dialog open={showAddPortfolio} onOpenChange={setShowAddPortfolio}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Portfolio for {selectedVenture?.name}</DialogTitle>
          </DialogHeader>
          <PortfolioForm
            ventureId={selectedVentureId}
            onClose={() => setShowAddPortfolio(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Portfolio Dialog */}
      <Dialog open={!!editingPortfolio} onOpenChange={(o) => !o && setEditingPortfolio(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
          </DialogHeader>
          {editingPortfolio && (
            <PortfolioForm
              ventureId={editingPortfolio.ventureId}
              initial={editingPortfolio}
              onClose={() => setEditingPortfolio(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
