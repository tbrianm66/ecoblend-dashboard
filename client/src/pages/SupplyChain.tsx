// ============================================================
// SUPPLY CHAIN & MANUFACTURING INTELLIGENCE MODULE
// Design → Prototype (UK) → Validate → Industrialise → Scale (China) → Distribute
// 6 Tabs: Overview/Control Tower | R&D Prototyping | Manufacturing Intelligence
//         Global Production | Supply Chain Risk | ESG Integration
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Factory, FlaskConical, Globe, ShieldAlert, Leaf, LayoutDashboard,
  Plus, Trash2, Edit2, ChevronRight, Package, Truck, Wrench,
  BarChart2, CheckCircle, AlertTriangle, Clock, TrendingUp,
  MapPin, Users, DollarSign, Activity, Layers, Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend,
} from "recharts";

// ── Colour palette ─────────────────────────────────────────────────────────────
const C = {
  green: "#51AF37", blue: "#3A97D3", amber: "#F49C13",
  red: "#e53e3e", purple: "#805ad5", teal: "#0d9488",
  navy: "#1a2332",
};

const STAGE_COLORS: Record<string, string> = {
  concept: "#94a3b8", design: "#60a5fa", prototype_v1: "#f59e0b",
  prototype_v2: "#f97316", validated: "#22c55e", production_ready: C.green,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8", confirmed: C.blue, in_production: C.amber,
  shipped: C.purple, delivered: C.green, cancelled: C.red,
};

const QA_COLORS: Record<string, string> = {
  pending: "#94a3b8", in_inspection: C.blue, passed: C.green,
  failed: C.red, rework: C.amber,
};

function KpiCard({ label, value, sub, accent, icon: Icon }: {
  label: string; value: string | number; sub?: string; accent?: string; icon?: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-1 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
        {Icon && <Icon size={16} style={{ color: accent || C.navy }} className="opacity-50" />}
      </div>
      <span className="text-3xl font-bold" style={{ color: accent || C.navy, fontFamily: "'Prompt', sans-serif" }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function StatusBadge({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  const color = colorMap[status] || "#94a3b8";
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Digital Thread Pipeline ────────────────────────────────────────────────────
function DigitalThreadPipeline({ stageDistribution }: { stageDistribution: Record<string, number> }) {
  const stages = [
    { key: "concept", label: "Concept", icon: Zap },
    { key: "design", label: "Design", icon: Layers },
    { key: "prototype_v1", label: "Prototype V1", icon: FlaskConical },
    { key: "prototype_v2", label: "Prototype V2", icon: FlaskConical },
    { key: "validated", label: "Validated", icon: CheckCircle },
    { key: "production_ready", label: "Production Ready", icon: Factory },
  ];
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {stages.map((stage, i) => {
        const count = stageDistribution[stage.key] || 0;
        const color = STAGE_COLORS[stage.key];
        const Icon = stage.icon;
        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[90px]">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 relative"
                style={{ borderColor: color, background: count > 0 ? `${color}18` : "#f9fafb" }}>
                <Icon size={18} style={{ color }} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                    style={{ background: color }}>
                    {count}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 text-center leading-tight">{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <ChevronRight size={16} className="text-gray-300 mx-1 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Overview / Control Tower Tab ───────────────────────────────────────────────
function OverviewTab({ ventureId }: { ventureId: string }) {
  const { data: summary, isLoading } = trpc.supplyChain.getControlTowerSummary.useQuery({ ventureId });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading control tower…</div>;
  if (!summary) return <div className="p-8 text-center text-gray-400">No supply chain data yet. Add products to get started.</div>;

  const geoData = [
    { name: "UK (R&D)", value: summary.ukProducts, fill: C.blue },
    { name: "China (Scale)", value: summary.chinaProducts, fill: C.red },
  ];

  const stageChartData = Object.entries(summary.stageDistribution).map(([key, val]) => ({
    name: key.replace(/_/g, " "), value: val, fill: STAGE_COLORS[key],
  }));

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Products" value={summary.totalProducts} sub="in registry" accent={C.navy} icon={Package} />
        <KpiCard label="Active Suppliers" value={summary.activeSuppliers} sub={`of ${summary.totalSuppliers} total`} accent={C.green} icon={Users} />
        <KpiCard label="Mfg Readiness" value={`${summary.avgManufacturingReadiness}%`} sub="avg across products" accent={C.blue} icon={Factory} />
        <KpiCard label="Active Orders" value={summary.activeOrders} sub={`${summary.totalUnitsOrdered.toLocaleString()} units total`} accent={C.amber} icon={Truck} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="High-Risk Suppliers" value={summary.highRiskSuppliers} sub="risk score > 70" accent={summary.highRiskSuppliers > 0 ? C.red : C.green} icon={ShieldAlert} />
        <KpiCard label="Geopolitical Flags" value={summary.geopoliticalFlags} sub="flagged suppliers" accent={summary.geopoliticalFlags > 0 ? C.amber : C.green} icon={Globe} />
        <KpiCard label="Avg ESG Score" value={`${summary.avgEsgScore}/100`} sub="supplier ethical sourcing" accent={C.teal} icon={Leaf} />
        <KpiCard label="Avg Defect Rate" value={`${summary.avgDefectRate}%`} sub="across production orders" accent={summary.avgDefectRate > 5 ? C.red : C.green} icon={Activity} />
      </div>

      {/* Digital Thread */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-bold text-gray-700 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Digital Thread — Design → Prototype → Validate → Scale
        </h3>
        <DigitalThreadPipeline stageDistribution={summary.stageDistribution} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700 mb-4">Product Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageChartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stageChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geography Split */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700 mb-4">Dual Geography Model</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={geoData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => value > 0 ? name : ""}>
                  {geoData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: C.blue }} />
                <div>
                  <p className="text-xs font-semibold text-gray-700">UK — Innovation & Validation</p>
                  <p className="text-xs text-gray-400">R&D, prototyping, lab testing</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: C.red }} />
                <div>
                  <p className="text-xs font-semibold text-gray-700">China — Scale & Production</p>
                  <p className="text-xs text-gray-400">Contract manufacturing, logistics</p>
                </div>
              </div>
              <div className="mt-2 p-3 rounded-lg" style={{ background: "#f0fdf4" }}>
                <p className="text-xs font-semibold" style={{ color: C.green }}>Total Production Cost</p>
                <p className="text-lg font-bold" style={{ color: C.navy }}>
                  £{summary.totalProductionCostGbp.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── R&D Prototyping Tab ────────────────────────────────────────────────────────
function RdPrototypingTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.supplyChain.listProducts.useQuery({ ventureId });
  const { data: prototypes = [] } = trpc.supplyChain.listPrototypes.useQuery({ ventureId });
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showProtoDialog, setShowProtoDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editProto, setEditProto] = useState<any>(null);
  const [productForm, setProductForm] = useState<any>({});
  const [protoForm, setProtoForm] = useState<any>({});

  const upsertProduct = trpc.supplyChain.upsertProduct.useMutation({
    onSuccess: () => { utils.supplyChain.listProducts.invalidate(); utils.supplyChain.getControlTowerSummary.invalidate(); setShowProductDialog(false); toast.success("Product saved"); },
  });
  const deleteProduct = trpc.supplyChain.deleteProduct.useMutation({
    onSuccess: () => { utils.supplyChain.listProducts.invalidate(); utils.supplyChain.getControlTowerSummary.invalidate(); toast.success("Product deleted"); },
  });
  const upsertProto = trpc.supplyChain.upsertPrototype.useMutation({
    onSuccess: () => { utils.supplyChain.listPrototypes.invalidate(); setShowProtoDialog(false); toast.success("Prototype saved"); },
  });
  const deleteProto = trpc.supplyChain.deletePrototype.useMutation({
    onSuccess: () => { utils.supplyChain.listPrototypes.invalidate(); toast.success("Prototype deleted"); },
  });

  const openProductDialog = (p?: any) => {
    setEditProduct(p || null);
    setProductForm(p ? { ...p } : { ventureId });
    setShowProductDialog(true);
  };

  const openProtoDialog = (p?: any, productId?: number) => {
    setEditProto(p || null);
    setProtoForm(p ? { ...p } : { ventureId, productId: productId || (products[0]?.id ?? 0) });
    setShowProtoDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Products */}
      <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Prompt', sans-serif" }}>Product Registry</h3>
            <p className="text-xs text-gray-400">Register composite products and track their development stage</p>
          </div>
          <Button size="sm" onClick={() => openProductDialog()} style={{ background: C.blue }}>
            <Plus size={14} className="mr-1" /> Add Product
          </Button>
        </div>
        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No products registered yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
            {products.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${STAGE_COLORS[p.prototypeStatus ?? "concept"]}18` }}>
                    <Package size={16} style={{ color: STAGE_COLORS[p.prototypeStatus ?? "concept"] }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.materialType?.replace(/_/g, " ")} · {p.manufacturingProcess?.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.prototypeStatus ?? "concept"} colorMap={STAGE_COLORS} />
                  <span className="text-xs font-mono text-gray-400">TRL {p.trlLevel}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: p.productionGeography === "UK" ? `${C.blue}15` : `${C.red}15`, color: p.productionGeography === "UK" ? C.blue : C.red }}>
                    {p.productionGeography}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openProtoDialog(undefined, p.id)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100" title="Add prototype">
                      <FlaskConical size={13} style={{ color: C.teal }} />
                    </button>
                    <button onClick={() => openProductDialog(p)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100">
                      <Edit2 size={13} style={{ color: "#6b7280" }} />
                    </button>
                    <button onClick={() => deleteProduct.mutate({ id: p.id })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50">
                      <Trash2 size={13} style={{ color: C.red }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prototypes */}
      <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Prompt', sans-serif" }}>Prototype Records — UK R&D Layer</h3>
            <p className="text-xs text-gray-400">CAD/CAE status, lab test results, TRL progression, early LCA</p>
          </div>
          <Button size="sm" onClick={() => openProtoDialog()} disabled={products.length === 0} style={{ background: C.teal }}>
            <Plus size={14} className="mr-1" /> Add Prototype
          </Button>
        </div>
        {prototypes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No prototypes logged yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
            {prototypes.map(pr => (
              <div key={pr.id} className="px-6 py-4 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical size={16} style={{ color: C.teal }} />
                    <span className="text-sm font-semibold text-gray-800">
                      {products.find(p => p.id === pr.productId)?.name ?? `Product #${pr.productId}`} — {pr.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={pr.labTestStatus ?? "not_started"} colorMap={{ not_started: "#94a3b8", in_progress: C.blue, passed: C.green, failed: C.red }} />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openProtoDialog(pr)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-100">
                        <Edit2 size={13} style={{ color: "#6b7280" }} />
                      </button>
                      <button onClick={() => deleteProto.mutate({ id: pr.id })} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50">
                        <Trash2 size={13} style={{ color: C.red }} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <p className="text-gray-400 mb-0.5">CAD Status</p>
                    <p className="font-semibold text-gray-700">{pr.cadStatus?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50">
                    <p className="text-gray-400 mb-0.5">TRL Progress</p>
                    <p className="font-semibold text-gray-700">{pr.trlAtStart} → {pr.trlAtEnd}</p>
                  </div>
                  {pr.carbonFootprintKg != null && (
                    <div className="p-2 rounded-lg" style={{ background: "#f0fdf4" }}>
                      <p className="text-gray-400 mb-0.5">Carbon Footprint</p>
                      <p className="font-semibold" style={{ color: C.green }}>{pr.carbonFootprintKg} kg CO₂e</p>
                    </div>
                  )}
                  {pr.structuralIntegrity != null && (
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="text-gray-400 mb-0.5">Structural Integrity</p>
                      <p className="font-semibold text-gray-700">{pr.structuralIntegrity}/100</p>
                    </div>
                  )}
                </div>
                {pr.manufacturingNotes && (
                  <p className="mt-2 text-xs text-gray-500 italic">{pr.manufacturingNotes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Product Name *</Label><Input value={productForm.name || ""} onChange={e => setProductForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={productForm.description || ""} onChange={e => setProductForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Material Type</Label>
                <Select value={productForm.materialType || "carbon_fibre"} onValueChange={v => setProductForm((f: any) => ({ ...f, materialType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["carbon_fibre","glass_fibre","hybrid_composite","aluminium","steel","polymer","bio_composite","ceramic","other"].map(v => (
                      <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Manufacturing Process</Label>
                <Select value={productForm.manufacturingProcess || "composite_layup"} onValueChange={v => setProductForm((f: any) => ({ ...f, manufacturingProcess: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["composite_layup","resin_transfer_moulding","injection_moulding","cnc_machining","3d_printing","casting","forging","assembly","other"].map(v => (
                      <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Prototype Status</Label>
                <Select value={productForm.prototypeStatus || "concept"} onValueChange={v => setProductForm((f: any) => ({ ...f, prototypeStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["concept","design","prototype_v1","prototype_v2","validated","production_ready"].map(v => (
                      <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>TRL Level</Label>
                <Input type="number" min={1} max={9} value={productForm.trlLevel || 1} onChange={e => setProductForm((f: any) => ({ ...f, trlLevel: parseInt(e.target.value) }))} />
              </div>
              <div><Label>Geography</Label>
                <Select value={productForm.productionGeography || "UK"} onValueChange={v => setProductForm((f: any) => ({ ...f, productionGeography: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["UK","China","Both","Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Target Market</Label><Input value={productForm.targetMarket || ""} onChange={e => setProductForm((f: any) => ({ ...f, targetMarket: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertProduct.mutate(productForm)} disabled={!productForm.name} style={{ background: C.blue }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prototype Dialog */}
      <Dialog open={showProtoDialog} onOpenChange={setShowProtoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editProto ? "Edit Prototype" : "Add Prototype"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Product</Label>
                <Select value={String(protoForm.productId || "")} onValueChange={v => setProtoForm((f: any) => ({ ...f, productId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Version</Label><Input value={protoForm.version || "v1"} onChange={e => setProtoForm((f: any) => ({ ...f, version: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CAD Status</Label>
                <Select value={protoForm.cadStatus || "not_started"} onValueChange={v => setProtoForm((f: any) => ({ ...f, cadStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["not_started","in_progress","complete","validated"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Lab Test Status</Label>
                <Select value={protoForm.labTestStatus || "not_started"} onValueChange={v => setProtoForm((f: any) => ({ ...f, labTestStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["not_started","in_progress","passed","failed"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>TRL at Start</Label><Input type="number" min={1} max={9} value={protoForm.trlAtStart || 1} onChange={e => setProtoForm((f: any) => ({ ...f, trlAtStart: parseInt(e.target.value) }))} /></div>
              <div><Label>TRL at End</Label><Input type="number" min={1} max={9} value={protoForm.trlAtEnd || 1} onChange={e => setProtoForm((f: any) => ({ ...f, trlAtEnd: parseInt(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Carbon Footprint (kg CO₂e)</Label><Input type="number" value={protoForm.carbonFootprintKg || ""} onChange={e => setProtoForm((f: any) => ({ ...f, carbonFootprintKg: parseFloat(e.target.value) }))} /></div>
              <div><Label>Structural Integrity (0–100)</Label><Input type="number" min={0} max={100} value={protoForm.structuralIntegrity || ""} onChange={e => setProtoForm((f: any) => ({ ...f, structuralIntegrity: parseFloat(e.target.value) }))} /></div>
            </div>
            <div><Label>Manufacturing Notes</Label><Textarea value={protoForm.manufacturingNotes || ""} onChange={e => setProtoForm((f: any) => ({ ...f, manufacturingNotes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProtoDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertProto.mutate(protoForm)} disabled={!protoForm.productId} style={{ background: C.teal }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Manufacturing Intelligence Tab ─────────────────────────────────────────────
function ManufacturingTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.supplyChain.listProducts.useQuery({ ventureId });
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<any>({});
  const [readinessResult, setReadinessResult] = useState<any>(null);

  const effectiveProductId = selectedProductId ?? (products[0]?.id ?? null);
  const { data: mfg } = trpc.supplyChain.getManufacturing.useQuery(
    { productId: effectiveProductId! },
    { enabled: !!effectiveProductId }
  );

  const upsertMfg = trpc.supplyChain.upsertManufacturing.useMutation({
    onSuccess: () => { utils.supplyChain.getManufacturing.invalidate(); utils.supplyChain.getControlTowerSummary.invalidate(); setShowDialog(false); toast.success("Manufacturing data saved"); },
  });

  const computeReadiness = trpc.supplyChain.computeManufacturingReadiness.useMutation({
    onSuccess: (data) => { setReadinessResult(data); toast.success(`Readiness: ${data.score}% — ${data.readinessLevel}`); },
  });

  const openDialog = () => {
    setForm(mfg ? { ...mfg } : { ventureId, productId: effectiveProductId });
    setShowDialog(true);
  };

  const selectedProduct = products.find(p => p.id === effectiveProductId);

  const radarData = readinessResult ? [
    { subject: "TRL", value: readinessResult.breakdown.trlScore, max: 40 },
    { subject: "CAD/CAE", value: readinessResult.breakdown.cadScore, max: 20 },
    { subject: "Lab Tests", value: readinessResult.breakdown.labScore, max: 20 },
    { subject: "Tooling", value: readinessResult.breakdown.toolScore, max: 10 },
    { subject: "Operations", value: readinessResult.breakdown.operationalScore, max: 10 },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Product Selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Select Product:</Label>
        <Select value={String(effectiveProductId || "")} onValueChange={v => setSelectedProductId(parseInt(v))}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Choose a product" /></SelectTrigger>
          <SelectContent>
            {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openDialog} disabled={!effectiveProductId} style={{ background: C.amber }}>
          <Edit2 size={14} className="mr-1" /> {mfg ? "Edit" : "Add"} Manufacturing Data
        </Button>
      </div>

      {!mfg ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-400 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <Factory size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No manufacturing data for this product yet.</p>
          <p className="text-xs mt-1">Add BOM, cost model, and process details to compute manufacturing readiness.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manufacturing Details */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-800 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Manufacturing Profile — {selectedProduct?.name}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Primary Process</span>
                <span className="font-semibold text-gray-800">{mfg.primaryProcess?.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Unit Cost</span>
                <span className="font-semibold" style={{ color: C.green }}>£{mfg.unitCostGbp?.toFixed(2) ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Target Unit Cost</span>
                <span className="font-semibold text-gray-800">£{mfg.targetUnitCostGbp?.toFixed(2) ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tooling Cost</span>
                <span className="font-semibold text-gray-800">£{mfg.toolingCostGbp?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">MOQ</span>
                <span className="font-semibold text-gray-800">{mfg.moq?.toLocaleString() ?? "—"} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Capacity / Month</span>
                <span className="font-semibold text-gray-800">{mfg.productionCapacityPerMonth?.toLocaleString() ?? "—"} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Lead Time</span>
                <span className="font-semibold text-gray-800">{mfg.leadTimeDays ?? "—"} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tooling Status</span>
                <StatusBadge status={mfg.toolingStatus ?? "not_started"} colorMap={{ not_started: "#94a3b8", in_design: C.blue, ordered: C.amber, received: C.purple, validated: C.green }} />
              </div>
              {/* Readiness Score Bar */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-500">Manufacturing Readiness Score</span>
                  <span className="text-xs font-mono font-bold" style={{ color: C.blue }}>{mfg.manufacturingReadinessScore}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${mfg.manufacturingReadinessScore ?? 0}%`, background: (mfg.manufacturingReadinessScore ?? 0) >= 80 ? C.green : (mfg.manufacturingReadinessScore ?? 0) >= 50 ? C.amber : C.red }} />
                </div>
              </div>
            </div>
          </div>

          {/* Readiness Calculator */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Prompt', sans-serif" }}>Readiness Calculator</h3>
              <Button size="sm" variant="outline" onClick={() => computeReadiness.mutate({
                trlLevel: selectedProduct?.trlLevel ?? 1,
                cadStatus: (mfg.primaryProcess ? "complete" : "not_started") as any,
                labTestStatus: "not_started",
                toolingStatus: (mfg.toolingStatus ?? "not_started") as any,
                supplierCount: 0,
                bomComplete: !!mfg.bomJson,
                esgCompliant: false,
              })} style={{ borderColor: C.blue, color: C.blue }}>
                <Zap size={13} className="mr-1" /> Compute
              </Button>
            </div>
            {readinessResult ? (
              <div className="space-y-3">
                <div className="text-center p-4 rounded-xl" style={{ background: `${C.blue}08` }}>
                  <p className="text-4xl font-bold" style={{ color: C.blue, fontFamily: "'Prompt', sans-serif" }}>{readinessResult.score}%</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: C.navy }}>{readinessResult.readinessLevel}</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar dataKey="value" stroke={C.blue} fill={C.blue} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                Click Compute to calculate manufacturing readiness score
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOM Preview */}
      {mfg?.bomJson && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-800 mb-3" style={{ fontFamily: "'Prompt', sans-serif" }}>Bill of Materials — v{mfg.bomVersion}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                  {["Item", "Material", "Qty", "Unit", "Unit Cost (£)", "Total (£)", "Supplier"].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  try {
                    const items = JSON.parse(mfg.bomJson);
                    return items.map((item: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                        <td className="py-2 px-3 font-medium text-gray-800">{item.name}</td>
                        <td className="py-2 px-3 text-gray-500">{item.material}</td>
                        <td className="py-2 px-3 text-gray-700">{item.qty}</td>
                        <td className="py-2 px-3 text-gray-500">{item.unit}</td>
                        <td className="py-2 px-3 text-gray-700">{item.unitCost?.toFixed(2)}</td>
                        <td className="py-2 px-3 font-semibold" style={{ color: C.navy }}>{(item.qty * item.unitCost)?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-gray-500">{item.supplier}</td>
                      </tr>
                    ));
                  } catch { return <tr><td colSpan={7} className="py-3 px-3 text-gray-400">Invalid BOM format</td></tr>; }
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manufacturing Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Manufacturing Intelligence — {selectedProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Primary Process</Label>
                <Select value={form.primaryProcess || "composite_layup"} onValueChange={v => setForm((f: any) => ({ ...f, primaryProcess: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["composite_layup","resin_transfer_moulding","injection_moulding","cnc_machining","3d_printing","casting","forging","assembly","other"].map(v => (
                      <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Process Complexity (0–100)</Label>
                <Input type="number" min={0} max={100} value={form.processComplexityIndex || 50} onChange={e => setForm((f: any) => ({ ...f, processComplexityIndex: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Unit Cost (£)</Label><Input type="number" value={form.unitCostGbp || ""} onChange={e => setForm((f: any) => ({ ...f, unitCostGbp: parseFloat(e.target.value) }))} /></div>
              <div><Label>Target Unit Cost (£)</Label><Input type="number" value={form.targetUnitCostGbp || ""} onChange={e => setForm((f: any) => ({ ...f, targetUnitCostGbp: parseFloat(e.target.value) }))} /></div>
              <div><Label>Tooling Cost (£)</Label><Input type="number" value={form.toolingCostGbp || ""} onChange={e => setForm((f: any) => ({ ...f, toolingCostGbp: parseFloat(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>MOQ (units)</Label><Input type="number" value={form.moq || 1} onChange={e => setForm((f: any) => ({ ...f, moq: parseInt(e.target.value) }))} /></div>
              <div><Label>Capacity / Month</Label><Input type="number" value={form.productionCapacityPerMonth || ""} onChange={e => setForm((f: any) => ({ ...f, productionCapacityPerMonth: parseInt(e.target.value) }))} /></div>
              <div><Label>Lead Time (days)</Label><Input type="number" value={form.leadTimeDays || ""} onChange={e => setForm((f: any) => ({ ...f, leadTimeDays: parseInt(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tooling Status</Label>
                <Select value={form.toolingStatus || "not_started"} onValueChange={v => setForm((f: any) => ({ ...f, toolingStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["not_started","in_design","ordered","received","validated"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Readiness Score (0–100)</Label>
                <Input type="number" min={0} max={100} value={form.manufacturingReadinessScore || 0} onChange={e => setForm((f: any) => ({ ...f, manufacturingReadinessScore: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div><Label>BOM (JSON array)</Label>
              <Textarea value={form.bomJson || ""} onChange={e => setForm((f: any) => ({ ...f, bomJson: e.target.value }))} rows={4}
                placeholder='[{"name":"Carbon Fibre Sheet","material":"CF","qty":2,"unit":"m²","unitCost":45,"supplier":"Toray"}]' />
            </div>
            <div><Label>Readiness Notes</Label><Textarea value={form.readinessNotes || ""} onChange={e => setForm((f: any) => ({ ...f, readinessNotes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertMfg.mutate(form)} style={{ background: C.amber }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Global Production Tab ──────────────────────────────────────────────────────
function GlobalProductionTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.supplyChain.listProducts.useQuery({ ventureId });
  const { data: suppliers = [] } = trpc.supplyChain.listSuppliers.useQuery({ ventureId });
  const { data: orders = [] } = trpc.supplyChain.listOrders.useQuery({ ventureId });
  const [showDialog, setShowDialog] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const upsertOrder = trpc.supplyChain.upsertOrder.useMutation({
    onSuccess: () => { utils.supplyChain.listOrders.invalidate(); utils.supplyChain.getControlTowerSummary.invalidate(); setShowDialog(false); toast.success("Order saved"); },
  });
  const deleteOrder = trpc.supplyChain.deleteOrder.useMutation({
    onSuccess: () => { utils.supplyChain.listOrders.invalidate(); utils.supplyChain.getControlTowerSummary.invalidate(); toast.success("Order deleted"); },
  });

  const openDialog = (o?: any) => {
    setEditOrder(o || null);
    setForm(o ? { ...o } : { ventureId, quantityOrdered: 100 });
    setShowDialog(true);
  };

  const totalUnits = orders.reduce((s, o) => s + (o.quantityOrdered ?? 0), 0);
  const totalCost = orders.reduce((s, o) => s + (o.totalCostGbp ?? 0), 0);
  const activeOrders = orders.filter(o => ["confirmed","in_production","shipped"].includes(o.status ?? "")).length;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Orders" value={orders.length} sub={`${activeOrders} active`} accent={C.navy} icon={Package} />
        <KpiCard label="Total Units" value={totalUnits.toLocaleString()} sub="ordered across all orders" accent={C.blue} icon={Truck} />
        <KpiCard label="Total Production Cost" value={`£${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="all orders combined" accent={C.green} icon={DollarSign} />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Prompt', sans-serif" }}>Production Orders — Global</h3>
            <p className="text-xs text-gray-400">Pilot and scale orders across UK and China manufacturing partners</p>
          </div>
          <Button size="sm" onClick={() => openDialog()} style={{ background: C.navy }}>
            <Plus size={14} className="mr-1" /> New Order
          </Button>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No production orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                  {["Order Ref","Product","Supplier","Type","Qty","Unit Cost","Total","Geography","Status","QA","Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b hover:bg-gray-50 group" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-3 px-4 font-mono text-gray-600">{o.orderRef || `ORD-${o.id}`}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{products.find(p => p.id === o.productId)?.name ?? `#${o.productId}`}</td>
                    <td className="py-3 px-4 text-gray-500">{suppliers.find(s => s.id === o.supplierId)?.name ?? "—"}</td>
                    <td className="py-3 px-4"><StatusBadge status={o.orderType ?? "pilot"} colorMap={{ pilot: C.blue, scale: C.green, repeat: C.purple }} /></td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{o.quantityOrdered.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-700">£{o.unitCostGbp?.toFixed(2) ?? "—"}</td>
                    <td className="py-3 px-4 font-semibold" style={{ color: C.navy }}>£{o.totalCostGbp?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: o.geography === "China" ? `${C.red}15` : `${C.blue}15`, color: o.geography === "China" ? C.red : C.blue }}>
                        {o.geography}
                      </span>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={o.status ?? "draft"} colorMap={STATUS_COLORS} /></td>
                    <td className="py-3 px-4"><StatusBadge status={o.qaStatus ?? "pending"} colorMap={QA_COLORS} /></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDialog(o)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100">
                          <Edit2 size={11} style={{ color: "#6b7280" }} />
                        </button>
                        <button onClick={() => deleteOrder.mutate({ id: o.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                          <Trash2 size={11} style={{ color: C.red }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editOrder ? "Edit Order" : "New Production Order"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Product *</Label>
                <Select value={String(form.productId || "")} onValueChange={v => setForm((f: any) => ({ ...f, productId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Supplier</Label>
                <Select value={String(form.supplierId || "")} onValueChange={v => setForm((f: any) => ({ ...f, supplierId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Order Type</Label>
                <Select value={form.orderType || "pilot"} onValueChange={v => setForm((f: any) => ({ ...f, orderType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["pilot","scale","repeat"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Geography</Label>
                <Select value={form.geography || "China"} onValueChange={v => setForm((f: any) => ({ ...f, geography: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["UK","China","EU","USA","Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status || "draft"} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","confirmed","in_production","shipped","delivered","cancelled"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Quantity *</Label><Input type="number" value={form.quantityOrdered || 100} onChange={e => setForm((f: any) => ({ ...f, quantityOrdered: parseInt(e.target.value) }))} /></div>
              <div><Label>Unit Cost (£)</Label><Input type="number" value={form.unitCostGbp || ""} onChange={e => setForm((f: any) => ({ ...f, unitCostGbp: parseFloat(e.target.value) }))} /></div>
              <div><Label>Total Cost (£)</Label><Input type="number" value={form.totalCostGbp || ""} onChange={e => setForm((f: any) => ({ ...f, totalCostGbp: parseFloat(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>QA Status</Label>
                <Select value={form.qaStatus || "pending"} onValueChange={v => setForm((f: any) => ({ ...f, qaStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["pending","in_inspection","passed","failed","rework"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Defect Rate (%)</Label><Input type="number" min={0} max={100} value={form.defectRate || 0} onChange={e => setForm((f: any) => ({ ...f, defectRate: parseFloat(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Shipping Method</Label>
                <Select value={form.shippingMethod || "sea"} onValueChange={v => setForm((f: any) => ({ ...f, shippingMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["air","sea","road","rail","courier"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Lead Time (days)</Label><Input type="number" value={form.leadTimeDays || ""} onChange={e => setForm((f: any) => ({ ...f, leadTimeDays: parseInt(e.target.value) }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertOrder.mutate(form)} disabled={!form.productId || !form.quantityOrdered} style={{ background: C.navy }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Supply Chain Risk Tab ──────────────────────────────────────────────────────
function SupplyChainRiskTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: suppliers = [] } = trpc.supplyChain.listSuppliers.useQuery({ ventureId });
  const [showDialog, setShowDialog] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const upsertSupplier = trpc.supplyChain.upsertSupplier.useMutation({
    onSuccess: () => { utils.supplyChain.listSuppliers.invalidate(); utils.supplyChain.getControlTowerSummary.invalidate(); setShowDialog(false); toast.success("Supplier saved"); },
  });
  const deleteSupplier = trpc.supplyChain.deleteSupplier.useMutation({
    onSuccess: () => { utils.supplyChain.listSuppliers.invalidate(); utils.supplyChain.getControlTowerSummary.invalidate(); toast.success("Supplier removed"); },
  });

  const openDialog = (s?: any) => {
    setEditSupplier(s || null);
    setForm(s ? { ...s } : { ventureId });
    setShowDialog(true);
  };

  const riskChartData = suppliers.map(s => ({
    name: s.name.length > 14 ? s.name.slice(0, 14) + "…" : s.name,
    risk: s.riskScore ?? 50,
    quality: s.qualityScore ?? 50,
    esg: s.ethicalSourcingScore ?? 50,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Risk Chart */}
      {suppliers.length > 0 && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-800 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>Supplier Risk Matrix</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskChartData} barSize={14}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="risk" name="Risk Score" fill={C.red} radius={[3, 3, 0, 0]} />
              <Bar dataKey="quality" name="Quality Score" fill={C.blue} radius={[3, 3, 0, 0]} />
              <Bar dataKey="esg" name="ESG Score" fill={C.green} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Prompt', sans-serif" }}>Supplier Network</h3>
            <p className="text-xs text-gray-400">UK and China supplier risk, quality, and ESG scores</p>
          </div>
          <Button size="sm" onClick={() => openDialog()} style={{ background: C.red }}>
            <Plus size={14} className="mr-1" /> Add Supplier
          </Button>
        </div>
        {suppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No suppliers registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                  {["Supplier","Type","Location","Risk","Quality","ESG","Contract","Geo Flag","Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 group" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      {s.contactName && <p className="text-gray-400">{s.contactName}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{s.supplierType?.replace(/_/g, " ")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} style={{ color: s.geography === "China" ? C.red : C.blue }} />
                        <span style={{ color: s.geography === "China" ? C.red : C.blue }} className="font-semibold">{s.geography}</span>
                        {s.city && <span className="text-gray-400">· {s.city}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.riskScore}%`, background: (s.riskScore ?? 0) > 70 ? C.red : (s.riskScore ?? 0) > 40 ? C.amber : C.green }} />
                        </div>
                        <span className="font-mono">{s.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.qualityScore}%`, background: C.blue }} />
                        </div>
                        <span className="font-mono">{s.qualityScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.ethicalSourcingScore}%`, background: C.teal }} />
                        </div>
                        <span className="font-mono">{s.ethicalSourcingScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={s.contractStatus ?? "prospect"} colorMap={{ prospect: "#94a3b8", negotiating: C.amber, active: C.green, paused: C.blue, terminated: C.red }} /></td>
                    <td className="py-3 px-4">
                      {s.geopoliticalRiskFlag ? (
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.red }}>
                          <AlertTriangle size={11} /> Flagged
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openDialog(s)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100">
                          <Edit2 size={11} style={{ color: "#6b7280" }} />
                        </button>
                        <button onClick={() => deleteSupplier.mutate({ id: s.id })} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50">
                          <Trash2 size={11} style={{ color: C.red }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Supplier Name *</Label><Input value={form.name || ""} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={form.supplierType || "contract_manufacturer"} onValueChange={v => setForm((f: any) => ({ ...f, supplierType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["raw_material","component","sub_assembly","contract_manufacturer","tooling","logistics","testing_lab","other"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Geography</Label>
                <Select value={form.geography || "China"} onValueChange={v => setForm((f: any) => ({ ...f, geography: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["UK","China","EU","USA","India","Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>City</Label><Input value={form.city || ""} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input value={form.contactName || ""} onChange={e => setForm((f: any) => ({ ...f, contactName: e.target.value }))} /></div>
              <div><Label>Contact Email</Label><Input type="email" value={form.contactEmail || ""} onChange={e => setForm((f: any) => ({ ...f, contactEmail: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Risk Score (0–100)</Label><Input type="number" min={0} max={100} value={form.riskScore ?? 50} onChange={e => setForm((f: any) => ({ ...f, riskScore: parseInt(e.target.value) }))} /></div>
              <div><Label>Quality Score (0–100)</Label><Input type="number" min={0} max={100} value={form.qualityScore ?? 50} onChange={e => setForm((f: any) => ({ ...f, qualityScore: parseInt(e.target.value) }))} /></div>
              <div><Label>ESG Score (0–100)</Label><Input type="number" min={0} max={100} value={form.ethicalSourcingScore ?? 50} onChange={e => setForm((f: any) => ({ ...f, ethicalSourcingScore: parseInt(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ESG Compliance</Label>
                <Select value={form.esgComplianceStatus || "unknown"} onValueChange={v => setForm((f: any) => ({ ...f, esgComplianceStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["unknown","non_compliant","partial","compliant","certified"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Contract Status</Label>
                <Select value={form.contractStatus || "prospect"} onValueChange={v => setForm((f: any) => ({ ...f, contractStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["prospect","negotiating","active","paused","terminated"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="geoFlag" checked={form.geopoliticalRiskFlag || false} onChange={e => setForm((f: any) => ({ ...f, geopoliticalRiskFlag: e.target.checked }))} />
              <Label htmlFor="geoFlag">Geopolitical Risk Flag</Label>
            </div>
            {form.geopoliticalRiskFlag && (
              <div><Label>Geopolitical Notes</Label><Textarea value={form.geopoliticalNotes || ""} onChange={e => setForm((f: any) => ({ ...f, geopoliticalNotes: e.target.value }))} rows={2} /></div>
            )}
            <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertSupplier.mutate(form)} disabled={!form.name} style={{ background: C.red }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── ESG Integration Tab ────────────────────────────────────────────────────────
function EsgIntegrationTab({ ventureId }: { ventureId: string }) {
  const { data: suppliers = [] } = trpc.supplyChain.listSuppliers.useQuery({ ventureId });
  const { data: prototypes = [] } = trpc.supplyChain.listPrototypes.useQuery({ ventureId });
  const { data: orders = [] } = trpc.supplyChain.listOrders.useQuery({ ventureId });

  const avgEsg = suppliers.length > 0
    ? suppliers.reduce((s, sup) => s + (sup.ethicalSourcingScore ?? 50), 0) / suppliers.length
    : 0;
  const certifiedSuppliers = suppliers.filter(s => s.esgComplianceStatus === "certified").length;
  const compliantSuppliers = suppliers.filter(s => ["compliant","certified"].includes(s.esgComplianceStatus ?? "")).length;
  const totalCarbonFootprint = prototypes.reduce((s, p) => s + (p.carbonFootprintKg ?? 0), 0);
  const avgLcaScore = prototypes.filter(p => p.lcaScore != null).length > 0
    ? prototypes.reduce((s, p) => s + (p.lcaScore ?? 0), 0) / prototypes.filter(p => p.lcaScore != null).length
    : null;

  const esgComplianceData = [
    { name: "Certified", value: certifiedSuppliers, fill: C.green },
    { name: "Compliant", value: compliantSuppliers - certifiedSuppliers, fill: C.teal },
    { name: "Partial", value: suppliers.filter(s => s.esgComplianceStatus === "partial").length, fill: C.amber },
    { name: "Non-Compliant", value: suppliers.filter(s => s.esgComplianceStatus === "non_compliant").length, fill: C.red },
    { name: "Unknown", value: suppliers.filter(s => s.esgComplianceStatus === "unknown").length, fill: "#94a3b8" },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* ESG KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Avg ESG Score" value={`${Math.round(avgEsg)}/100`} sub="supplier ethical sourcing" accent={C.teal} icon={Leaf} />
        <KpiCard label="ESG Compliant" value={compliantSuppliers} sub={`of ${suppliers.length} suppliers`} accent={C.green} icon={CheckCircle} />
        <KpiCard label="Carbon Footprint" value={`${totalCarbonFootprint.toFixed(1)} kg`} sub="CO₂e across prototypes" accent={C.navy} icon={Activity} />
        <KpiCard label="Avg LCA Score" value={avgLcaScore != null ? `${avgLcaScore.toFixed(1)}/100` : "—"} sub="lower = better impact" accent={C.green} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESG Compliance Pie */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-800 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>Supplier ESG Compliance Distribution</h3>
          {esgComplianceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={esgComplianceData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {esgComplianceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Add suppliers to see ESG compliance distribution.</div>
          )}
        </div>

        {/* ESG Framework Reference */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-800 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>ESG Framework Integration</h3>
          <div className="space-y-3">
            {[
              { label: "Life Cycle Assessment (LCA)", desc: "ISO 14040/14044 — environmental impact per product lifecycle", status: prototypes.some(p => p.lcaScore != null) ? "Active" : "Pending", color: C.green },
              { label: "Product Carbon Footprint (PCF)", desc: "GHG Protocol — Scope 1/2/3 emissions tracking", status: prototypes.some(p => p.carbonFootprintKg != null) ? "Active" : "Pending", color: C.teal },
              { label: "Ethical Sourcing", desc: "SA8000 / UN Global Compact — supplier labour standards", status: certifiedSuppliers > 0 ? "Active" : "Pending", color: C.blue },
              { label: "Governance Module Link", desc: "LCSSA Environmental tab — PCF/LCA scores synced", status: "Linked", color: C.purple },
            ].map(item => (
              <div key={item.label} className="flex items-start justify-between p-3 rounded-lg" style={{ background: `${item.color}08` }}>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-3"
                  style={{ background: `${item.color}18`, color: item.color }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prototype LCA Table */}
      {prototypes.some(p => p.lcaScore != null || p.carbonFootprintKg != null) && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-800 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>Prototype Environmental Data</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                  {["Prototype","Version","LCA Score","Carbon Footprint (kg CO₂e)","Lab Test","TRL Progress"].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prototypes.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                    <td className="py-2 px-3 font-medium text-gray-800">Prototype #{p.id}</td>
                    <td className="py-2 px-3 text-gray-500">{p.version}</td>
                    <td className="py-2 px-3">{p.lcaScore != null ? <span className="font-semibold" style={{ color: C.teal }}>{p.lcaScore.toFixed(1)}</span> : "—"}</td>
                    <td className="py-2 px-3">{p.carbonFootprintKg != null ? <span className="font-semibold" style={{ color: C.green }}>{p.carbonFootprintKg.toFixed(2)} kg</span> : "—"}</td>
                    <td className="py-2 px-3"><StatusBadge status={p.labTestStatus ?? "not_started"} colorMap={{ not_started: "#94a3b8", in_progress: C.blue, passed: C.green, failed: C.red }} /></td>
                    <td className="py-2 px-3 font-mono text-gray-700">TRL {p.trlAtStart} → {p.trlAtEnd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Control Tower", icon: LayoutDashboard },
  { id: "rnd", label: "R&D Prototyping", icon: FlaskConical },
  { id: "manufacturing", label: "Manufacturing", icon: Factory },
  { id: "production", label: "Global Production", icon: Globe },
  { id: "risk", label: "Supply Chain Risk", icon: ShieldAlert },
  { id: "esg", label: "ESG Integration", icon: Leaf },
];

export default function SupplyChain() {
  const { ventures } = useVentures();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVentureId, setSelectedVentureId] = useState<string>("");

  const ventureId = selectedVentureId || ventures[0]?.id || "default";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: `${C.navy}12`, color: C.navy }}>
                Supply Chain Intelligence
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">UK R&D → China Scale</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Supply Chain & Manufacturing
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Design → Prototype (UK) → Validate → Industrialise → Scale Production (China) → Distribute → Feedback
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-xs text-gray-500">Venture:</Label>
            <Select value={ventureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ventures.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b px-8" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor: isActive ? C.navy : "transparent",
                  color: isActive ? C.navy : "#6b7280",
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab ventureId={ventureId} />}
      {activeTab === "rnd" && <RdPrototypingTab ventureId={ventureId} />}
      {activeTab === "manufacturing" && <ManufacturingTab ventureId={ventureId} />}
      {activeTab === "production" && <GlobalProductionTab ventureId={ventureId} />}
      {activeTab === "risk" && <SupplyChainRiskTab ventureId={ventureId} />}
      {activeTab === "esg" && <EsgIntegrationTab ventureId={ventureId} />}
    </div>
  );
}
