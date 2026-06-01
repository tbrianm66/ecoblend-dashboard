// ============================================================
// KNOWLEDGE BASE — Document Ingestion & RAG Search
// Allows uploading PDFs, transcripts, and text snippets,
// tagging by domain, and previewing BM25 search results.
// ============================================================

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen,
  Upload,
  Search,
  Trash2,
  FileText,
  Mic,
  Link,
  AlignLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  Layers,
  BookMarked,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const DOMAINS = [
  "VRL", "TRL", "BRL", "IRL", "ESG", "Market",
  "Finance", "Legal", "People", "Brand", "Strategy", "General",
] as const;

type Domain = typeof DOMAINS[number];

const SOURCE_TYPES = [
  { value: "pdf",        label: "PDF Document",       icon: FileText },
  { value: "transcript", label: "Podcast / Interview Transcript", icon: Mic },
  { value: "url",        label: "URL / Web Article",  icon: Link },
  { value: "text",       label: "Plain Text Snippet", icon: AlignLeft },
] as const;

const DOMAIN_COLORS: Record<Domain, string> = {
  VRL:      "#56A837",
  TRL:      "#1d4ed8",
  BRL:      "#7c3aed",
  IRL:      "#0891b2",
  ESG:      "#059669",
  Market:   "#d97706",
  Finance:  "#dc2626",
  Legal:    "#6b7280",
  People:   "#db2777",
  Brand:    "#ea580c",
  Strategy: "#0f766e",
  General:  "#64748b",
};

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "ready")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle size={11} /> Ready
      </span>
    );
  if (status === "processing")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
        <Loader2 size={11} className="animate-spin" /> Processing
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <AlertCircle size={11} /> Error
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      Pending
    </span>
  );
}

// ── Upload Form ───────────────────────────────────────────────────────────────

function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle]               = useState("");
  const [author, setAuthor]             = useState("");
  const [year, setYear]                 = useState("");
  const [description, setDescription]  = useState("");
  const [tags, setTags]                 = useState("");
  const [sourceType, setSourceType]     = useState<string>("pdf");
  const [domain, setDomain]             = useState<Domain>("General");
  const [text, setText]                 = useState("");
  const [sourceUrl, setSourceUrl]       = useState("");
  const [file, setFile]                 = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const createDoc  = trpc.knowledgeBase.createDocument.useMutation();
  const ingestDoc  = trpc.knowledgeBase.uploadAndIngest.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("Please enter a document title"); return; }
    if (sourceType === "pdf" && !file) { toast.error("Please select a PDF file"); return; }
    if ((sourceType === "text" || sourceType === "transcript") && !text.trim()) {
      toast.error("Please paste the text content"); return;
    }

    setUploading(true);
    try {
      // Step 1: Create document record
      const { id: documentId } = await createDoc.mutateAsync({
        title: title.trim(),
        sourceType: sourceType as any,
        domain,
        author: author.trim() || undefined,
        publishedYear: year ? parseInt(year) : undefined,
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
      });

      // Step 2: Upload & ingest
      if (sourceType === "pdf" && file) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((d, b) => d + String.fromCharCode(b), "")
        );
        await ingestDoc.mutateAsync({
          documentId,
          fileBase64: base64,
          filename: file.name,
        });
      } else {
        await ingestDoc.mutateAsync({
          documentId,
          text: text.trim(),
        });
      }

      toast.success(`"${title}" ingested successfully`);
      // Reset form
      setTitle(""); setAuthor(""); setYear(""); setDescription("");
      setTags(""); setText(""); setSourceUrl(""); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const sourceIcon = SOURCE_TYPES.find(s => s.value === sourceType)?.icon ?? FileText;
  const SourceIcon = sourceIcon;

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2 mb-5">
        <Upload size={16} style={{ color: "#56A837" }} />
        <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Add Document to Knowledge Base
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Type */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Source Type
          </label>
          <div className="flex flex-wrap gap-2">
            {SOURCE_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSourceType(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  sourceType === value
                    ? "border-[#56A837] bg-[#56A83715] text-[#56A837]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Title *
          </label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. The Lean Startup — Eric Ries"
            className="text-sm"
          />
        </div>

        {/* Domain */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Domain
          </label>
          <Select value={domain} onValueChange={v => setDomain(v as Domain)}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map(d => (
                <SelectItem key={d} value={d}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ background: DOMAIN_COLORS[d] }}
                    />
                    {d}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Author */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Author
          </label>
          <Input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="e.g. Eric Ries"
            className="text-sm"
          />
        </div>

        {/* Year */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Published Year
          </label>
          <Input
            value={year}
            onChange={e => setYear(e.target.value)}
            placeholder="e.g. 2011"
            type="number"
            min={1900}
            max={2030}
            className="text-sm"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tags (comma-separated)
          </label>
          <Input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. MVP, pivot, build-measure-learn"
            className="text-sm"
          />
        </div>

        {/* Source URL (for url type) */}
        {sourceType === "url" && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              URL
            </label>
            <Input
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
            />
          </div>
        )}

        {/* Description */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Description (optional)
          </label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief summary of the document's relevance to EcoComp"
            className="text-sm"
          />
        </div>

        {/* File upload (PDF) */}
        {sourceType === "pdf" && (
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              PDF File *
            </label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-[#56A837] transition-colors"
              style={{ borderColor: file ? "#56A837" : "#e5e7eb" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={16} style={{ color: "#56A837" }} />
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <div>
                  <Upload size={20} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Click to select a PDF file</p>
                  <p className="text-xs text-gray-400 mt-1">Max 16 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}

        {/* Text area (transcript / text) */}
        {(sourceType === "text" || sourceType === "transcript") && (
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              {sourceType === "transcript" ? "Transcript Text *" : "Text Content *"}
            </label>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={
                sourceType === "transcript"
                  ? "Paste the full podcast or interview transcript here…"
                  : "Paste the text content here…"
              }
              rows={8}
              className="text-sm font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              {text.split(/\s+/).filter(Boolean).length.toLocaleString()} words
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-5">
        <Button
          onClick={handleSubmit}
          disabled={uploading}
          style={{ background: "#56A837", color: "white" }}
          className="gap-2"
        >
          {uploading ? (
            <><Loader2 size={14} className="animate-spin" /> Processing…</>
          ) : (
            <><Upload size={14} /> Ingest Document</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Document Row ──────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  onDelete,
}: {
  doc: any;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const chunksQuery = trpc.knowledgeBase.getChunks.useQuery(
    { documentId: doc.id },
    { enabled: expanded }
  );
  const deleteMutation = trpc.knowledgeBase.deleteDocument.useMutation({
    onSuccess: () => { toast.success("Document deleted"); onDelete(); },
    onError: (e) => toast.error(e.message),
  });

  const domainColor = DOMAIN_COLORS[doc.domain as Domain] ?? "#64748b";

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-start justify-between p-4 gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${domainColor}15` }}
          >
            <BookMarked size={14} style={{ color: domainColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: "'Prompt', sans-serif" }}>
                {doc.title}
              </span>
              <Badge
                variant="outline"
                className="text-xs flex-shrink-0"
                style={{ borderColor: domainColor, color: domainColor, background: `${domainColor}10` }}
              >
                {doc.domain}
              </Badge>
              <StatusBadge status={doc.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              {doc.author && <span>{doc.author}</span>}
              {doc.publishedYear && <span>{doc.publishedYear}</span>}
              {doc.chunkCount > 0 && (
                <span className="flex items-center gap-1">
                  <Layers size={10} /> {doc.chunkCount} chunks
                </span>
              )}
              {doc.wordCount > 0 && (
                <span>{doc.wordCount.toLocaleString()} words</span>
              )}
              {doc.tags && (
                <span className="text-gray-300">{doc.tags}</span>
              )}
            </div>
            {doc.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{doc.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {doc.status === "ready" && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
              title="Preview chunks"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`Delete "${doc.title}"?`)) deleteMutation.mutate({ id: doc.id });
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete document"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Chunk preview */}
      {expanded && (
        <div className="border-t px-4 pb-4" style={{ borderColor: "#f3f4f6" }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">
            Chunks ({chunksQuery.data?.length ?? 0})
          </p>
          {chunksQuery.isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" /> Loading…
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chunksQuery.data?.slice(0, 5).map((chunk) => (
                <div
                  key={chunk.id}
                  className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed"
                >
                  <span className="text-gray-400 font-mono mr-2">[{chunk.chunkIndex + 1}]</span>
                  {chunk.content.slice(0, 300)}
                  {chunk.content.length > 300 && "…"}
                </div>
              ))}
              {(chunksQuery.data?.length ?? 0) > 5 && (
                <p className="text-xs text-gray-400 text-center py-1">
                  + {(chunksQuery.data?.length ?? 0) - 5} more chunks
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Search Panel ──────────────────────────────────────────────────────────────

function SearchPanel() {
  const [query, setQuery]   = useState("");
  const [domain, setDomain] = useState<string>("all");
  const [topK, setTopK]     = useState(5);
  const [submitted, setSubmitted] = useState("");

  const searchQuery = trpc.knowledgeBase.search.useQuery(
    {
      query: submitted,
      domain: domain === "all" ? undefined : domain,
      topK,
    },
    { enabled: submitted.length > 0 }
  );

  const handleSearch = () => {
    if (!query.trim()) return;
    setSubmitted(query.trim());
  };

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2 mb-5">
        <Search size={16} style={{ color: "#3B85BA" }} />
        <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Search Knowledge Base
        </h3>
        <span className="text-xs text-gray-400 ml-1">— preview what the AI will retrieve</span>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="e.g. disruptive innovation value network"
          className="text-sm flex-1"
        />
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="w-36 text-sm">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(topK)} onValueChange={v => setTopK(Number(v))}>
          <SelectTrigger className="w-24 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[3, 5, 10].map(k => (
              <SelectItem key={k} value={String(k)}>Top {k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleSearch}
          style={{ background: "#3B85BA", color: "white" }}
          className="gap-1.5"
        >
          <Search size={14} /> Search
        </Button>
      </div>

      {searchQuery.isLoading && submitted && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 size={14} className="animate-spin" /> Searching…
        </div>
      )}

      {searchQuery.data && searchQuery.data.length === 0 && submitted && (
        <div className="text-sm text-gray-400 py-4 text-center">
          No matching chunks found. Try different keywords or add more documents.
        </div>
      )}

      {searchQuery.data && searchQuery.data.length > 0 && (
        <div className="space-y-3">
          {searchQuery.data.map((result, i) => {
            const domainColor = DOMAIN_COLORS[result.domain as Domain] ?? "#64748b";
            const source = [
              result.documentTitle,
              result.author ? `by ${result.author}` : null,
              result.publishedYear ? `(${result.publishedYear})` : null,
            ].filter(Boolean).join(" ");
            return (
              <div
                key={i}
                className="rounded-lg border p-4"
                style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${domainColor}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">[{i + 1}]</span>
                    <span className="text-xs font-semibold text-gray-600">{source}</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: domainColor, color: domainColor, background: `${domainColor}10` }}
                    >
                      {result.domain}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    score: {result.score.toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {result.content.slice(0, 400)}
                  {result.content.length > 400 && "…"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KnowledgeBase() {
  const utils = trpc.useUtils();

  const statsQuery = trpc.knowledgeBase.getStats.useQuery();
  const docsQuery  = trpc.knowledgeBase.listDocuments.useQuery();

  const refresh = useCallback(() => {
    utils.knowledgeBase.listDocuments.invalidate();
    utils.knowledgeBase.getStats.invalidate();
  }, [utils]);

  const stats = statsQuery.data ?? { documentCount: 0, totalChunks: 0, totalWords: 0, domainCount: 0 };

  // Group documents by domain
  const docsByDomain = (docsQuery.data ?? []).reduce<Record<string, any[]>>((acc, doc) => {
    const d = doc.domain ?? "General";
    if (!acc[d]) acc[d] = [];
    acc[d].push(doc);
    return acc;
  }, {});

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
                RAG Engine
              </span>
            </div>
            <h1
              className="text-2xl font-bold text-gray-900 mb-1"
              style={{ fontFamily: "'Prompt', sans-serif" }}
            >
              Knowledge Base
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Upload academic papers, textbooks, podcast transcripts, and industry reports.
              The AI retrieves relevant passages from this library when generating market intelligence,
              experiment designs, interview summaries, and VRL stage-gate reviews.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: "Documents", value: stats.documentCount, icon: BookOpen, color: "#56A837" },
            { label: "Chunks Indexed", value: stats.totalChunks.toLocaleString(), icon: Layers, color: "#3B85BA" },
            { label: "Words Indexed", value: stats.totalWords > 0 ? `${(stats.totalWords / 1000).toFixed(0)}k` : "0", icon: AlignLeft, color: "#7c3aed" },
            { label: "Domains Covered", value: stats.domainCount, icon: Database, color: "#d97706" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${color}15` }}
              >
                <Icon size={13} style={{ color }} />
              </div>
              <div>
                <div className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  {value}
                </div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Upload Form */}
        <UploadForm onSuccess={refresh} />

        {/* Search Panel */}
        <SearchPanel />

        {/* Document Library */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: "'Prompt', sans-serif" }}
            >
              Document Library
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              {docsQuery.data?.length ?? 0} documents
            </span>
          </div>

          {docsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading library…
            </div>
          ) : (docsQuery.data?.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No documents yet</p>
              <p className="text-xs mt-1">Upload your first PDF, transcript, or text snippet above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(docsByDomain).sort().map(([domain, docs]) => {
                const color = DOMAIN_COLORS[domain as Domain] ?? "#64748b";
                return (
                  <div key={domain}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ background: color }}
                      />
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color }}
                      >
                        {domain}
                      </span>
                      <span className="text-xs text-gray-400">({docs.length})</span>
                    </div>
                    <div className="space-y-2">
                      {docs.map(doc => (
                        <DocumentRow key={doc.id} doc={doc} onDelete={refresh} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
