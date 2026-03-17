// ============================================================
// LEGAL CONTRACTS MODULE — EcoBlend VBS Dashboard
// Three tabs: Contracts | Architecture Map | Legal Risk Map
// Brand: EcoBlend — Green #51AF37, Blue #3A97D3, Orange #F49C13, Navy #1a2332
// ============================================================

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  FileText, Plus, CheckCircle2, Clock, AlertTriangle, XCircle,
  Users, Lock, Handshake, Heart, TrendingUp, ChevronDown, ChevronUp,
  Download, Eye, Trash2, Edit3, Upload, Paperclip, Loader2, File,
  Layers, ShieldAlert, Building2, Database, UserCheck, Scale,
  CheckCheck, AlertCircle, Info, RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ContractStatus = "Active" | "Draft" | "Under Review" | "Expired" | "Terminated";
type ContractCategory = "Founder Agreement" | "IP Licence" | "OEM Partnership" | "Charity MoU" | "Investor Term Sheet";
type TabKey = "contracts" | "architecture" | "risk-map";

interface Contract {
  id: string;
  title: string;
  category: ContractCategory;
  ventureId: string;
  counterparty: string;
  counterpartyType: string;
  status: ContractStatus;
  signedDate?: string;
  expiryDate?: string;
  value?: string;
  keyTerms: string[];
  notes: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const VENTURE_OPTIONS = [
  { id: "ecoblend-rd", label: "EcoRace",      color: "#51AF37" },
  { id: "bebus",       label: "BEBUS",         color: "#3A97D3" },
  { id: "tone",        label: "TONE",           color: "#F49C13" },
  { id: "real",        label: "REAL",           color: "#f1c411" },
  { id: "vbs",         label: "VBS (Studio)",   color: "#1a2332" },
];

const CATEGORIES: ContractCategory[] = [
  "Founder Agreement", "IP Licence", "OEM Partnership", "Charity MoU", "Investor Term Sheet"
];

const STATUS_COLOURS: Record<ContractStatus, string> = {
  Active:         "#51AF37",
  Draft:          "#9ca3af",
  "Under Review": "#F49C13",
  Expired:        "#ef4444",
  Terminated:     "#dc2626",
};

const CATEGORY_ICONS: Record<ContractCategory, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  "Founder Agreement":   Users,
  "IP Licence":          Lock,
  "OEM Partnership":     Handshake,
  "Charity MoU":         Heart,
  "Investor Term Sheet": TrendingUp,
};

const CATEGORY_COLOURS: Record<ContractCategory, string> = {
  "Founder Agreement":   "#3A97D3",
  "IP Licence":          "#51AF37",
  "OEM Partnership":     "#F49C13",
  "Charity MoU":         "#ec4899",
  "Investor Term Sheet": "#8b5cf6",
};

// Layer icon mapping
const LAYER_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  "platform-infrastructure": Building2,
  "data-intelligence":       Database,
  "user-commercial":         UserCheck,
  "governance-compliance":   Scale,
};

// Registry status colours
const REG_STATUS_COLOURS: Record<string, string> = {
  Active:          "#51AF37",
  Draft:           "#9ca3af",
  Pending:         "#F49C13",
  "Not Required":  "#6b7280",
  Expired:         "#ef4444",
};

// Risk zone colours
const RISK_ZONE_COLOURS: Record<string, string> = {
  High:   "#ef4444",
  Medium: "#F49C13",
  Low:    "#51AF37",
};

// Risk status colours
const RISK_STATUS_COLOURS: Record<string, string> = {
  Open:       "#ef4444",
  Monitoring: "#F49C13",
  Mitigated:  "#51AF37",
  Closed:     "#9ca3af",
};

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: "c1",
    title: "EcoRace — Founder IP Assignment & ESOP Agreement",
    category: "Founder Agreement",
    ventureId: "ecoblend-rd",
    counterparty: "EcoRace Founding Team",
    counterpartyType: "Internal Founders",
    status: "Active",
    signedDate: "2025-09-01",
    expiryDate: "2029-09-01",
    value: "20% ESOP Pool",
    keyTerms: [
      "All IP created during employment assigned to EcoRace Ltd",
      "4-year vesting schedule with 12-month cliff",
      "Non-compete clause: 24 months post-departure",
      "Stipend: £2,200/month for 6 months during validation phase",
      "Equity: 20% ESOP pool distributed across founding team",
    ],
    notes: "Core founding agreement covering IP assignment, equity vesting, and stipend terms for the EcoRace founding team.",
  },
  {
    id: "c2",
    title: "EcoRace → BEBUS Exclusive Field-of-Use IP Licence",
    category: "IP Licence",
    ventureId: "bebus",
    counterparty: "BEBUS Ltd",
    counterpartyType: "Spin-off Venture",
    status: "Active",
    signedDate: "2025-10-15",
    expiryDate: "2035-10-15",
    value: "3% Net Revenue Royalty",
    keyTerms: [
      "Exclusive licence for eco-transport material formulations in EU & UK",
      "EcoRace retains full IP ownership",
      "3% net revenue royalty payable quarterly",
      "Sub-licensing to OEM customers permitted with prior written consent",
      "Termination clause: 12 months notice or immediate on insolvency",
    ],
    notes: "Exclusive field-of-use licence granting BEBUS the right to commercialise EcoBlend's eco-transport IP in the EU and UK markets.",
  },
  {
    id: "c3",
    title: "BEBUS — Volvo Group OEM Development Partnership",
    category: "OEM Partnership",
    ventureId: "bebus",
    counterparty: "Volvo Group AB",
    counterpartyType: "OEM Customer",
    status: "Under Review",
    value: "£1.2M over 3 years",
    keyTerms: [
      "Joint development of sustainable composite body panels",
      "BEBUS supplies material formulations and technical support",
      "Volvo retains manufacturing rights; BEBUS retains IP",
      "Minimum order commitment: £400k/year",
      "Exclusivity: 18 months in heavy transport segment",
    ],
    notes: "Strategic OEM partnership for co-development of sustainable composite materials for Volvo's heavy transport fleet.",
  },
  {
    id: "c4",
    title: "TONE — Music Declares Emergency MoU",
    category: "Charity MoU",
    ventureId: "tone",
    counterparty: "Music Declares Emergency",
    counterpartyType: "Nominated Charity",
    status: "Active",
    signedDate: "2025-11-01",
    expiryDate: "2027-11-01",
    value: "5% Net Profit Pledge",
    keyTerms: [
      "TONE pledges 5% of net annual profit to Music Declares Emergency",
      "Joint brand campaigns on eco-entertainment sustainability",
      "Annual impact report to be co-published",
      "Music Declares Emergency to provide advisory input on TONE's MMC",
      "Renewable annually by mutual agreement",
    ],
    notes: "Formal MoU establishing TONE's nominated charity relationship with Music Declares Emergency.",
  },
  {
    id: "c5",
    title: "REAL — Sport & Sustainability Alliance MoU",
    category: "Charity MoU",
    ventureId: "real",
    counterparty: "Sport & Sustainability International",
    counterpartyType: "Nominated Charity",
    status: "Draft",
    keyTerms: [
      "REAL pledges 5% of net annual profit to SSI programmes",
      "Joint research on sustainable sports protection materials",
      "SSI to provide access to athlete testing network",
      "Co-branded sustainability certification for REAL products",
    ],
    notes: "Draft MoU for REAL's nominated charity. Awaiting final sign-off from SSI legal team.",
  },
  {
    id: "c6",
    title: "EcoBlend VBS — Seed Investment Term Sheet",
    category: "Investor Term Sheet",
    ventureId: "vbs",
    counterparty: "EcoBlend VBS Seed Investors",
    counterpartyType: "Investors",
    status: "Under Review",
    value: "£500k Seed Round",
    keyTerms: [
      "Pre-money valuation: £2.5M",
      "Investment: £500k for 16.7% equity",
      "Investor rights: Board observer seat, pro-rata rights",
      "Anti-dilution: Weighted average broad-based",
      "Liquidation preference: 1x non-participating",
      "Drag-along: 75% shareholder approval required",
    ],
    notes: "Seed round term sheet for EcoBlend VBS. Currently under review by both parties.",
  },
];

const STORAGE_KEY = "ecoblend-contracts-v1";

function loadContracts(): Contract[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_CONTRACTS;
  } catch {
    return INITIAL_CONTRACTS;
  }
}

function saveContracts(contracts: Contract[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Document Upload Panel ─────────────────────────────────────────────────────
function DocumentPanel({ contractId, contractTitle, catColor }: { contractId: string; contractTitle: string; catColor: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const utils = trpc.useUtils();
  const { data: docs = [], isLoading } = trpc.contracts.getDocuments.useQuery({ contractId });

  const uploadMutation = trpc.contracts.uploadDocument.useMutation({
    onSuccess: () => { utils.contracts.getDocuments.invalidate({ contractId }); toast.success("Document uploaded successfully"); setUploading(false); },
    onError: (err) => { toast.error(`Upload failed: ${err.message}`); setUploading(false); },
  });

  const deleteMutation = trpc.contracts.deleteDocument.useMutation({
    onSuccess: () => { utils.contracts.getDocuments.invalidate({ contractId }); toast.success("Document removed"); },
    onError: (err) => { toast.error(`Delete failed: ${err.message}`); },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Maximum size is 10 MB."); return; }
    const ALLOWED = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain","image/png","image/jpeg"];
    if (!ALLOWED.includes(file.type)) { toast.error("Unsupported file type."); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({ contractId, contractTitle, fileName: file.name, mimeType: file.type, fileSizeBytes: file.size, base64Data: base64, uploadedBy: "Dashboard User" });
    };
    reader.onerror = () => { toast.error("Failed to read file"); setUploading(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5" style={{ fontFamily: "'Nunito', sans-serif" }}>
          <Paperclip size={11} />
          Attachments {docs.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-white text-xs" style={{ background: catColor }}>{docs.length}</span>}
        </div>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: `${catColor}12`, color: catColor, fontFamily: "'Nunito', sans-serif" }}>
          {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
          {uploading ? "Uploading…" : "Attach File"}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleFileChange} />
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 size={12} className="animate-spin" /> Loading…</div>
      ) : docs.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg py-4 text-center cursor-pointer hover:opacity-80" style={{ borderColor: `${catColor}30` }} onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} style={{ color: catColor, margin: "0 auto 4px" }} />
          <p className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>Drop a PDF or DOCX here, or click to browse</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border" style={{ borderColor: "#e5e7eb", background: "white" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${catColor}12` }}>
                <File size={14} style={{ color: catColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>{doc.fileName}</div>
                <div className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>{formatFileSize(doc.fileSizeBytes)} · {new Date(doc.createdAt).toLocaleDateString("en-GB")}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100"><Eye size={13} style={{ color: "#6b7280" }} /></a>
                <a href={doc.fileUrl} download={doc.fileName} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100"><Download size={13} style={{ color: "#6b7280" }} /></a>
                <button onClick={() => deleteMutation.mutate({ id: doc.id })} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"><Trash2 size={13} style={{ color: "#ef4444" }} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ContractCard ─────────────────────────────────────────────────────────────
function ContractCard({ contract, onUpdate, onDelete }: { contract: Contract; onUpdate: (c: Contract) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const CategoryIcon = CATEGORY_ICONS[contract.category];
  const catColor = CATEGORY_COLOURS[contract.category];
  const venture = VENTURE_OPTIONS.find(v => v.id === contract.ventureId);

  const cycleStatus = () => {
    const order: ContractStatus[] = ["Draft", "Under Review", "Active", "Expired", "Terminated"];
    const next = order[(order.indexOf(contract.status) + 1) % order.length];
    onUpdate({ ...contract, status: next });
    toast.success(`${contract.title.substring(0, 30)}… → ${next}`);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${catColor}` }}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${catColor}12` }}>
            <CategoryIcon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: catColor, fontFamily: "'Nunito', sans-serif" }}>{contract.category}</span>
              {venture && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${venture.color}15`, color: venture.color, fontFamily: "'Nunito', sans-serif" }}>{venture.label}</span>}
            </div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug" style={{ fontFamily: "'Prompt', sans-serif" }}>{contract.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>{contract.counterparty}</span>
              {contract.value && <span className="text-xs font-semibold text-gray-700" style={{ fontFamily: "'Nunito', sans-serif" }}>· {contract.value}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={cycleStatus} className="text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
              style={{ background: `${STATUS_COLOURS[contract.status]}15`, color: STATUS_COLOURS[contract.status], fontFamily: "'Nunito', sans-serif", border: `1px solid ${STATUS_COLOURS[contract.status]}30` }}>
              {contract.status}
            </button>
            <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
          <div className="flex gap-6 flex-wrap">
            {contract.signedDate && <div><div className="text-xs text-gray-400 mb-0.5">Signed</div><div className="text-sm font-semibold text-gray-700">{contract.signedDate}</div></div>}
            {contract.expiryDate && <div><div className="text-xs text-gray-400 mb-0.5">Expires</div><div className="text-sm font-semibold text-gray-700">{contract.expiryDate}</div></div>}
            <div><div className="text-xs text-gray-400 mb-0.5">Counterparty Type</div><div className="text-sm font-semibold text-gray-700">{contract.counterpartyType}</div></div>
          </div>
          {contract.keyTerms.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Key Terms</div>
              <ul className="space-y-1">
                {contract.keyTerms.map((term, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: catColor }} />
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contract.notes && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Notes</div>
              <p className="text-xs text-gray-600 leading-relaxed">{contract.notes}</p>
            </div>
          )}
          <DocumentPanel contractId={contract.id} contractTitle={contract.title} catColor={catColor} />
          <div className="flex gap-2 pt-1">
            <button onClick={() => onDelete(contract.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Contract Dialog ───────────────────────────────────────────────────────
function AddContractDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: Contract) => void }) {
  const [form, setForm] = useState({ title: "", category: "Founder Agreement" as ContractCategory, ventureId: "ecoblend-rd", counterparty: "", counterpartyType: "", status: "Draft" as ContractStatus, signedDate: "", expiryDate: "", value: "", keyTerms: "", notes: "" });

  const handleAdd = () => {
    if (!form.title || !form.counterparty) { toast.error("Please fill in title and counterparty"); return; }
    const contract: Contract = { id: `c${Date.now()}`, title: form.title, category: form.category, ventureId: form.ventureId, counterparty: form.counterparty, counterpartyType: form.counterpartyType, status: form.status, signedDate: form.signedDate || undefined, expiryDate: form.expiryDate || undefined, value: form.value || undefined, keyTerms: form.keyTerms.split("\n").map(t => t.trim()).filter(Boolean), notes: form.notes };
    onAdd(contract);
    toast.success("Contract added successfully");
    onClose();
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px", fontFamily: "'Nunito', sans-serif", outline: "none", background: "#fafafa" };
  const labelStyle = { display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#9ca3af", marginBottom: "4px", fontFamily: "'Nunito', sans-serif" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle style={{ fontFamily: "'Prompt', sans-serif", color: "#1a2332" }}>Add New Contract</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><label style={labelStyle}>Contract Title *</label><input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. BEBUS — Founder IP Assignment" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>Category *</label><select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ContractCategory }))}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={labelStyle}>Venture *</label><select style={inputStyle} value={form.ventureId} onChange={e => setForm(f => ({ ...f, ventureId: e.target.value }))}>{VENTURE_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>Counterparty *</label><input style={inputStyle} value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} placeholder="e.g. Volvo Group AB" /></div>
            <div><label style={labelStyle}>Counterparty Type</label><input style={inputStyle} value={form.counterpartyType} onChange={e => setForm(f => ({ ...f, counterpartyType: e.target.value }))} placeholder="e.g. OEM Customer" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label style={labelStyle}>Status</label><select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContractStatus }))}>{(["Draft","Under Review","Active","Expired","Terminated"] as ContractStatus[]).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={labelStyle}>Signed Date</label><input style={inputStyle} type="date" value={form.signedDate} onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))} /></div>
            <div><label style={labelStyle}>Expiry Date</label><input style={inputStyle} type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} /></div>
          </div>
          <div><label style={labelStyle}>Contract Value / Terms</label><input style={inputStyle} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. £500k Seed Round" /></div>
          <div><label style={labelStyle}>Key Terms (one per line)</label><textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.keyTerms} onChange={e => setForm(f => ({ ...f, keyTerms: e.target.value }))} placeholder="4-year vesting schedule&#10;Non-compete: 24 months&#10;Royalty: 3% net revenue" /></div>
          <div><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional context or commentary..." /></div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} style={{ background: "#51AF37", color: "white", fontFamily: "'Nunito', sans-serif", flex: 1 }}>Add Contract</Button>
            <Button variant="outline" onClick={onClose} style={{ fontFamily: "'Nunito', sans-serif" }}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Architecture Map Tab ──────────────────────────────────────────────────────
function ArchitectureMapTab() {
  const { data: layers = [], isLoading: layersLoading } = trpc.contracts.getLayers.useQuery();
  const { data: registry = [], isLoading: registryLoading } = trpc.contracts.getContractRegistry.useQuery({});
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editOwner, setEditOwner] = useState<string>("");

  const updateMutation = trpc.contracts.updateContractStatus.useMutation({
    onSuccess: () => {
      utils.contracts.getContractRegistry.invalidate({});
      toast.success("Contract status updated");
      setEditingId(null);
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  if (layersLoading || registryLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={24} style={{ color: "#51AF37" }} /></div>;
  }

  // Summary counts
  const totalContracts = registry.length;
  const activeCount = registry.filter(r => r.status === "Active").length;
  const draftCount = registry.filter(r => r.status === "Draft").length;
  const pendingCount = registry.filter(r => r.status === "Pending").length;
  const criticalCount = registry.filter(r => r.riskLevel === "Critical").length;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Contract Types", value: totalContracts, color: "#1a2332" },
          { label: "Active", value: activeCount, color: "#51AF37" },
          { label: "Draft", value: draftCount, color: "#9ca3af" },
          { label: "Pending", value: pendingCount, color: "#F49C13" },
          { label: "Critical Risk", value: criticalCount, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${s.color}` }}>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Prompt', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Four-layer architecture */}
      {layers.map(layer => {
        const LayerIcon = LAYER_ICONS[layer.layerKey] ?? Layers;
        const layerContracts = registry.filter(r => r.layerKey === layer.layerKey);
        return (
          <div key={layer.layerKey} className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderLeft: `5px solid ${layer.color ?? "#3A97D3"}` }}>
            {/* Layer header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: "#f3f4f6", background: `${layer.color ?? "#3A97D3"}06` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${layer.color ?? "#3A97D3"}15` }}>
                  <LayerIcon size={18} style={{ color: layer.color ?? "#3A97D3" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{layer.name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${layer.color ?? "#3A97D3"}15`, color: layer.color ?? "#3A97D3", fontFamily: "'Nunito', sans-serif" }}>
                      {layerContracts.length} contracts
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>{layer.description}</p>
                </div>
              </div>
            </div>

            {/* Contract type rows */}
            <div className="divide-y" style={{ borderColor: "#f9fafb" }}>
              {layerContracts.map(ct => (
                <div key={ct.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'Nunito', sans-serif" }}>{ct.contractType}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{
                        background: ct.riskLevel === "Critical" ? "#fef2f2" : ct.riskLevel === "High" ? "#fff7ed" : ct.riskLevel === "Medium" ? "#fffbeb" : "#f0fdf4",
                        color: ct.riskLevel === "Critical" ? "#dc2626" : ct.riskLevel === "High" ? "#ea580c" : ct.riskLevel === "Medium" ? "#d97706" : "#16a34a",
                        fontFamily: "'Nunito', sans-serif",
                      }}>
                        {ct.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>{ct.useCase}</p>
                    {ct.owner && <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>Owner: {ct.owner}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editingId === ct.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs rounded-lg border px-2 py-1"
                          style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                        >
                          {["Active","Draft","Pending","Not Required","Expired"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input
                          className="text-xs rounded-lg border px-2 py-1 w-28"
                          style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                          placeholder="Owner"
                          value={editOwner}
                          onChange={e => setEditOwner(e.target.value)}
                        />
                        <button
                          onClick={() => updateMutation.mutate({ id: ct.id, status: editStatus as any, owner: editOwner || undefined })}
                          className="text-xs font-semibold px-2 py-1 rounded-lg text-white"
                          style={{ background: "#51AF37" }}
                        >
                          {updateMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <CheckCheck size={12} />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600"><XCircle size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${REG_STATUS_COLOURS[ct.status ?? "Draft"]}15`, color: REG_STATUS_COLOURS[ct.status ?? "Draft"], fontFamily: "'Nunito', sans-serif", border: `1px solid ${REG_STATUS_COLOURS[ct.status ?? "Draft"]}30` }}>
                          {ct.status}
                        </span>
                        <button onClick={() => { setEditingId(ct.id); setEditStatus(ct.status ?? "Draft"); setEditOwner(ct.owner ?? ""); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                          <Edit3 size={12} style={{ color: "#6b7280" }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Legal Risk Map Tab ────────────────────────────────────────────────────────
function LegalRiskMapTab() {
  const { data: risks = [], isLoading } = trpc.contracts.getLegalRiskMap.useQuery();
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editOwner, setEditOwner] = useState<string>("");

  const updateMutation = trpc.contracts.updateRiskStatus.useMutation({
    onSuccess: () => {
      utils.contracts.getLegalRiskMap.invalidate();
      toast.success("Risk status updated");
      setEditingId(null);
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={24} style={{ color: "#51AF37" }} /></div>;
  }

  const highRisks = risks.filter(r => r.riskZone === "High");
  const mediumRisks = risks.filter(r => r.riskZone === "Medium");
  const openCount = risks.filter(r => r.status === "Open").length;
  const mitigatedCount = risks.filter(r => r.status === "Mitigated").length;
  const monitoringCount = risks.filter(r => r.status === "Monitoring").length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Risk Areas", value: risks.length, color: "#1a2332", icon: ShieldAlert },
          { label: "Open", value: openCount, color: "#ef4444", icon: AlertCircle },
          { label: "Monitoring", value: monitoringCount, color: "#F49C13", icon: RefreshCw },
          { label: "Mitigated", value: mitigatedCount, color: "#51AF37", icon: CheckCircle2 },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${s.color}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} style={{ color: s.color }} />
                <span className="text-xs text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Prompt', sans-serif" }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* High Risk Zone callout */}
      {highRisks.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: "#fca5a5", background: "#fef2f2" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: "#dc2626" }} />
            <span className="text-sm font-bold text-red-700" style={{ fontFamily: "'Prompt', sans-serif" }}>High Risk Zones ({highRisks.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {highRisks.map(r => (
              <span key={r.id} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#fecaca", color: "#dc2626", fontFamily: "'Nunito', sans-serif" }}>
                {r.riskArea}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk items */}
      <div className="space-y-4">
        {risks.map(risk => (
          <div key={risk.id} className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${RISK_ZONE_COLOURS[risk.riskZone ?? "Medium"]}` }}>
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${RISK_ZONE_COLOURS[risk.riskZone ?? "Medium"]}12` }}>
                  <ShieldAlert size={16} style={{ color: RISK_ZONE_COLOURS[risk.riskZone ?? "Medium"] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: RISK_ZONE_COLOURS[risk.riskZone ?? "Medium"], fontFamily: "'Nunito', sans-serif" }}>
                      {risk.riskZone} Risk
                    </span>
                    {risk.linkedLayer && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#f3f4f6", color: "#6b7280", fontFamily: "'Nunito', sans-serif" }}>
                        {risk.linkedLayer.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{risk.riskArea}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>{risk.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingId === risk.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs rounded-lg border px-2 py-1"
                        style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value)}
                      >
                        {["Open","Monitoring","Mitigated","Closed"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        className="text-xs rounded-lg border px-2 py-1 w-24"
                        style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif" }}
                        placeholder="Owner"
                        value={editOwner}
                        onChange={e => setEditOwner(e.target.value)}
                      />
                      <button
                        onClick={() => updateMutation.mutate({ id: risk.id, status: editStatus as any, owner: editOwner || undefined })}
                        className="text-xs font-semibold px-2 py-1 rounded-lg text-white"
                        style={{ background: "#51AF37" }}
                      >
                        {updateMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <CheckCheck size={12} />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600"><XCircle size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${RISK_STATUS_COLOURS[risk.status ?? "Open"]}15`, color: RISK_STATUS_COLOURS[risk.status ?? "Open"], fontFamily: "'Nunito', sans-serif", border: `1px solid ${RISK_STATUS_COLOURS[risk.status ?? "Open"]}30` }}>
                        {risk.status}
                      </span>
                      <button onClick={() => { setEditingId(risk.id); setEditStatus(risk.status ?? "Open"); setEditOwner(risk.owner ?? ""); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                        <Edit3 size={12} style={{ color: "#6b7280" }} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mitigation */}
              {risk.mitigation && (
                <div className="mt-3 ml-12 p-3 rounded-lg" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={12} style={{ color: "#16a34a", marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div className="text-xs font-bold text-green-700 mb-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>Mitigation Strategy</div>
                      <p className="text-xs text-green-700 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>{risk.mitigation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked contracts */}
              {risk.linkedContracts && (
                <div className="mt-2 ml-12">
                  <div className="text-xs text-gray-400 mb-1.5" style={{ fontFamily: "'Nunito', sans-serif" }}>Linked Contracts:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(JSON.parse(risk.linkedContracts) as string[]).map((c, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#e0f2fe", color: "#0369a1", fontFamily: "'Nunito', sans-serif" }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {risk.owner && (
                <div className="mt-2 ml-12 text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>Owner: <span className="font-semibold text-gray-600">{risk.owner}</span></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
        <Info size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs text-amber-700 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
          <strong>Legal Risk Map Disclaimer:</strong> This risk map is a management and tracking tool only. All risk assessments should be reviewed by qualified legal counsel. The EcoBlend VBS platform does not provide legal advice.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LegalContracts() {
  const [contracts, setContracts] = useState<Contract[]>(loadContracts);
  const [activeTab, setActiveTab] = useState<TabKey>("contracts");
  const [filterCategory, setFilterCategory] = useState<ContractCategory | "All">("All");
  const [filterVenture, setFilterVenture] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "All">("All");
  const [addOpen, setAddOpen] = useState(false);

  const persist = (updated: Contract[]) => { setContracts(updated); saveContracts(updated); };
  const handleUpdate = (updated: Contract) => persist(contracts.map(c => c.id === updated.id ? updated : c));
  const handleDelete = (id: string) => persist(contracts.filter(c => c.id !== id));
  const handleAdd = (c: Contract) => persist([...contracts, c]);

  const filtered = contracts.filter(c => {
    if (filterCategory !== "All" && c.category !== filterCategory) return false;
    if (filterVenture !== "all" && c.ventureId !== filterVenture) return false;
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    return true;
  });

  const activeCount = contracts.filter(c => c.status === "Active").length;
  const draftCount = contracts.filter(c => c.status === "Draft").length;
  const reviewCount = contracts.filter(c => c.status === "Under Review").length;
  const expiredCount = contracts.filter(c => c.status === "Expired" || c.status === "Terminated").length;

  const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
    { key: "contracts",    label: "Contracts",         icon: FileText },
    { key: "architecture", label: "Architecture Map",  icon: Layers },
    { key: "risk-map",     label: "Legal Risk Map",    icon: ShieldAlert },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} style={{ color: "#51AF37" }} />
              <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>Governance · Legal</span>
            </div>
            <h1 className="vos-page-title mb-1">Legal Contracts</h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Four-layer contract architecture — Platform Infrastructure, Data & Intelligence, User & Commercial, and Governance & Compliance.
            </p>
          </div>
          {activeTab === "contracts" && (
            <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2 text-xs" size="sm" style={{ background: "#51AF37", color: "white" }}>
              <Plus size={13} /> Add Contract
            </Button>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mt-5 border-b" style={{ borderColor: "#e5e7eb" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px"
                style={{
                  borderColor: isActive ? "#51AF37" : "transparent",
                  color: isActive ? "#51AF37" : "#6b7280",
                  fontFamily: "'Nunito', sans-serif",
                  background: "transparent",
                }}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* ── Contracts Tab ── */}
        {activeTab === "contracts" && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active", value: activeCount, sub: "contracts", color: "#51AF37", icon: CheckCircle2 },
                { label: "Under Review", value: reviewCount, sub: "pending sign-off", color: "#F49C13", icon: Clock },
                { label: "Draft", value: draftCount, sub: "in progress", color: "#9ca3af", icon: Edit3 },
                { label: "Expired / Terminated", value: expiredCount, sub: "closed", color: "#ef4444", icon: XCircle },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="vos-metric" style={{ borderTop: `3px solid ${stat.color}` }}>
                    <div className="flex items-center gap-1.5 mb-1"><Icon size={12} style={{ color: stat.color }} /><span className="vos-metric-label">{stat.label}</span></div>
                    <span className="vos-metric-value" style={{ color: stat.color }}>{stat.value}</span>
                    <span className="vos-metric-sub">{stat.sub}</span>
                  </div>
                );
              })}
            </div>

            {/* Category summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {CATEGORIES.map(cat => {
                const count = contracts.filter(c => c.category === cat).length;
                const Icon = CATEGORY_ICONS[cat];
                const color = CATEGORY_COLOURS[cat];
                return (
                  <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? "All" : cat)}
                    className="bg-white rounded-xl border p-4 shadow-sm text-left transition-all hover:shadow-md"
                    style={{ borderColor: filterCategory === cat ? color : "#e5e7eb", borderTop: `3px solid ${color}`, background: filterCategory === cat ? `${color}05` : "white" }}>
                    <Icon size={16} />
                    <div className="text-lg font-bold mt-2" style={{ color, fontFamily: "'Prompt', sans-serif" }}>{count}</div>
                    <div className="text-xs text-gray-500 leading-tight mt-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>{cat}</div>
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>Filter:</span>
              <select className="text-xs rounded-lg border px-3 py-1.5 cursor-pointer" style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif", background: "white" }} value={filterVenture} onChange={e => setFilterVenture(e.target.value)}>
                <option value="all">All Ventures</option>
                {VENTURE_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <select className="text-xs rounded-lg border px-3 py-1.5 cursor-pointer" style={{ borderColor: "#e5e7eb", fontFamily: "'Nunito', sans-serif", background: "white" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as ContractStatus | "All")}>
                <option value="All">All Statuses</option>
                {(["Active","Under Review","Draft","Expired","Terminated"] as ContractStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {(filterCategory !== "All" || filterVenture !== "all" || filterStatus !== "All") && (
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#f3f4f6", color: "#6b7280", fontFamily: "'Nunito', sans-serif" }} onClick={() => { setFilterCategory("All"); setFilterVenture("all"); setFilterStatus("All"); }}>
                  Clear filters
                </button>
              )}
              <span className="text-xs text-gray-400 ml-auto" style={{ fontFamily: "'Nunito', sans-serif" }}>{filtered.length} of {contracts.length} contracts</span>
            </div>

            {/* Contract list */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>No contracts match the current filters.</div>
              ) : (
                filtered.map(contract => <ContractCard key={contract.id} contract={contract} onUpdate={handleUpdate} onDelete={handleDelete} />)
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
              <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs text-amber-700 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
                <strong>Legal Disclaimer:</strong> This module is a management and tracking tool only. All contracts should be reviewed, drafted, and executed by qualified legal counsel. The EcoBlend VBS platform does not provide legal advice.
              </p>
            </div>
          </>
        )}

        {/* ── Architecture Map Tab ── */}
        {activeTab === "architecture" && <ArchitectureMapTab />}

        {/* ── Legal Risk Map Tab ── */}
        {activeTab === "risk-map" && <LegalRiskMapTab />}
      </div>

      <AddContractDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
    </div>
  );
}
