/**
 * Institutional Memory System
 * Phase 5 Long-Term — Knowledge codex, founder legacy documentation, decision history
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BookOpen, Plus, Search, Star, Lock, Globe, Trash2,
  Brain, Target, Lightbulb, Users, Layers, Eye, Edit3, X, Save,
} from "lucide-react";

const CATEGORIES = ["Mission","Vision","Principle","Non-Negotiable","Process","Decision","Lesson","Cultural"] as const;
type Category = typeof CATEGORIES[number];

const IMPORTANCE_LEVELS = ["Critical","High","Medium","Low"] as const;
type Importance = typeof IMPORTANCE_LEVELS[number];

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Mission: <Target size={14} />,
  Vision: <Eye size={14} />,
  Principle: <Star size={14} />,
  "Non-Negotiable": <Lock size={14} />,
  Process: <Layers size={14} />,
  Decision: <Brain size={14} />,
  Lesson: <Lightbulb size={14} />,
  Cultural: <Users size={14} />,
};

const CATEGORY_COLORS: Record<Category, string> = {
  Mission: "#51AF37",
  Vision: "#3A97D3",
  Principle: "#F49C13",
  "Non-Negotiable": "#e53e3e",
  Process: "#805ad5",
  Decision: "#2b6cb0",
  Lesson: "#d69e2e",
  Cultural: "#38a169",
};

const IMPORTANCE_COLORS: Record<Importance, string> = {
  Critical: "#e53e3e",
  High: "#F49C13",
  Medium: "#3A97D3",
  Low: "#6b7280",
};

interface MemoryEntry {
  id?: number;
  ventureId: string;
  title: string;
  category: Category;
  content: string;
  tags: string;
  author: string;
  importance: Importance;
  isFounderLegacy: boolean;
  isPublic: boolean;
}

const EMPTY_ENTRY: MemoryEntry = {
  ventureId: "portfolio",
  title: "",
  category: "Mission",
  content: "",
  tags: "",
  author: "Founder",
  importance: "Medium",
  isFounderLegacy: false,
  isPublic: true,
};

export default function InstitutionalMemorySystem({ ventureId }: { ventureId?: string }) {
  const [view, setView] = useState<"library"|"legacy"|"add">("library");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");
  const [filterImportance, setFilterImportance] = useState<Importance | "All">("All");
  const [editEntry, setEditEntry] = useState<MemoryEntry>(EMPTY_ENTRY);
  const [editingId, setEditingId] = useState<number | null>(null);

  const listQuery = trpc.institutionalMemory.list.useQuery({
    ventureId,
    category: filterCategory !== "All" ? filterCategory : undefined,
    search: search.length > 1 ? search : undefined,
  });

  const legacyQuery = trpc.institutionalMemory.getFounderLegacy.useQuery({ ventureId });
  const statsQuery = trpc.institutionalMemory.getStats.useQuery();

  const utils = trpc.useUtils();
  const upsertMutation = trpc.institutionalMemory.upsert.useMutation({
    onSuccess: () => {
      utils.institutionalMemory.list.invalidate();
      utils.institutionalMemory.getFounderLegacy.invalidate();
      utils.institutionalMemory.getStats.invalidate();
      toast.success(editingId ? "Entry updated" : "Entry added to institutional memory");
      setView("library");
      setEditEntry(EMPTY_ENTRY);
      setEditingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.institutionalMemory.delete.useMutation({
    onSuccess: () => {
      utils.institutionalMemory.list.invalidate();
      utils.institutionalMemory.getStats.invalidate();
      toast.success("Entry removed from institutional memory");
    },
  });

  const entries = listQuery.data ?? [];
  const stats = statsQuery.data;
  const legacy = legacyQuery.data;

  const handleEdit = (entry: any) => {
    setEditEntry({
      id: entry.id,
      ventureId: entry.venture_id ?? "portfolio",
      title: entry.title,
      category: entry.category as Category,
      content: entry.content,
      tags: entry.tags ?? "",
      author: entry.author ?? "Founder",
      importance: entry.importance as Importance,
      isFounderLegacy: Boolean(entry.is_founder_legacy),
      isPublic: Boolean(entry.is_public),
    });
    setEditingId(entry.id);
    setView("add");
  };

  const handleSave = () => {
    if (!editEntry.title.trim() || !editEntry.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    upsertMutation.mutate({
      id: editingId ?? undefined,
      ventureId: editEntry.ventureId,
      title: editEntry.title,
      category: editEntry.category,
      content: editEntry.content,
      tags: editEntry.tags,
      author: editEntry.author,
      importance: editEntry.importance,
      isFounderLegacy: editEntry.isFounderLegacy,
      isPublic: editEntry.isPublic,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Institutional Memory System
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Codify founder intent, principles, and organisational knowledge for mission continuity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mr-2">
              <span className="flex items-center gap-1">
                <BookOpen size={12} className="text-green-600" />
                {stats.total} entries
              </span>
              <span className="flex items-center gap-1">
                <Star size={12} className="text-amber-500" />
                {stats.founderLegacyCount} founder legacy
              </span>
              <span className="flex items-center gap-1">
                <Lock size={12} className="text-red-500" />
                {stats.criticalCount} critical
              </span>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => { setView(view === "legacy" ? "library" : "legacy"); }}
            style={{ borderColor: "#F49C13", color: "#F49C13" }}
          >
            <Star size={12} /> Founder Legacy
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => { setEditEntry(EMPTY_ENTRY); setEditingId(null); setView("add"); }}
            style={{ background: "#51AF37" }}
          >
            <Plus size={12} /> Add Entry
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {view === "add" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">
              {editingId ? "Edit Memory Entry" : "Add to Institutional Memory"}
            </h3>
            <button onClick={() => { setView("library"); setEditEntry(EMPTY_ENTRY); setEditingId(null); }}>
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Title *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ borderColor: "#e5e7eb" }}
                placeholder="e.g., Our Mission Will Never Be Compromised for Profit"
                value={editEntry.title}
                onChange={(e) => setEditEntry(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                value={editEntry.category}
                onChange={(e) => setEditEntry(prev => ({ ...prev, category: e.target.value as Category }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Importance</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                value={editEntry.importance}
                onChange={(e) => setEditEntry(prev => ({ ...prev, importance: e.target.value as Importance }))}
              >
                {IMPORTANCE_LEVELS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Content *</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                style={{ borderColor: "#e5e7eb" }}
                rows={5}
                placeholder="Document this knowledge, principle, or decision in detail..."
                value={editEntry.content}
                onChange={(e) => setEditEntry(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Tags (comma-separated)</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                placeholder="e.g., mission, values, non-negotiable"
                value={editEntry.tags}
                onChange={(e) => setEditEntry(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Author</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5e7eb" }}
                value={editEntry.author}
                onChange={(e) => setEditEntry(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>
            <div className="col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editEntry.isFounderLegacy}
                  onChange={(e) => setEditEntry(prev => ({ ...prev, isFounderLegacy: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <Star size={13} className="text-amber-500" /> Mark as Founder Legacy
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editEntry.isPublic}
                  onChange={(e) => setEditEntry(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <Globe size={13} className="text-green-600" /> Visible to all team members
                </span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { setView("library"); setEditEntry(EMPTY_ENTRY); setEditingId(null); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              style={{ background: "#51AF37" }}
            >
              <Save size={12} /> {upsertMutation.isPending ? "Saving..." : "Save to Memory"}
            </Button>
          </div>
        </div>
      )}

      {/* Founder Legacy View */}
      {view === "legacy" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "vision", label: "Vision", icon: <Eye size={14} />, color: "#3A97D3" },
            { key: "nonNegotiables", label: "Non-Negotiables", icon: <Lock size={14} />, color: "#e53e3e" },
            { key: "principles", label: "Core Principles", icon: <Star size={14} />, color: "#F49C13" },
            { key: "cultural", label: "Cultural DNA", icon: <Users size={14} />, color: "#38a169" },
          ].map(({ key, label, icon, color }) => {
            const items = (legacy as any)?.[key] ?? [];
            return (
              <div key={key} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ color }}>{icon}</span>
                  <h3 className="text-sm font-bold text-gray-900">{label}</h3>
                  <Badge variant="outline" className="text-xs ml-auto" style={{ borderColor: color, color }}>
                    {items.length}
                  </Badge>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No {label.toLowerCase()} documented yet</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="p-3 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                        <p className="text-xs font-semibold text-gray-800 mb-1">{item.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Library View */}
      {view === "library" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ borderColor: "#e5e7eb" }}
                placeholder="Search institutional memory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              {(["All", ...CATEGORIES] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    borderColor: filterCategory === cat ? "#51AF37" : "#e5e7eb",
                    background: filterCategory === cat ? "#51AF3715" : "white",
                    color: filterCategory === cat ? "#51AF37" : "#6b7280",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Entries Grid */}
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading institutional memory...</div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-500">No entries yet</p>
              <p className="text-xs text-gray-400 mt-1">Start documenting your organisation's institutional knowledge</p>
              <Button size="sm" className="mt-4 gap-1.5" onClick={() => setView("add")} style={{ background: "#51AF37" }}>
                <Plus size={12} /> Add First Entry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {entries.map((entry: any) => {
                const cat = entry.category as Category;
                const imp = entry.importance as Importance;
                const catColor = CATEGORY_COLORS[cat] ?? "#6b7280";
                const impColor = IMPORTANCE_COLORS[imp] ?? "#6b7280";
                return (
                  <div
                    key={entry.id}
                    className="bg-white rounded-xl border p-4 shadow-sm group"
                    style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${catColor}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: catColor }}>{CATEGORY_ICONS[cat]}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${catColor}15`, color: catColor }}>
                          {cat}
                        </span>
                        {entry.is_founder_legacy ? (
                          <Star size={12} className="text-amber-500" />
                        ) : null}
                        {!entry.is_public ? (
                          <Lock size={12} className="text-gray-400" />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <Edit3 size={11} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Remove this entry from institutional memory?")) {
                              deleteMutation.mutate({ id: entry.id });
                            }
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50"
                        >
                          <Trash2 size={11} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{entry.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-3 mb-2">{entry.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${impColor}15`, color: impColor }}>
                          {imp}
                        </span>
                        {entry.tags && entry.tags.split(",").slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{entry.author}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
