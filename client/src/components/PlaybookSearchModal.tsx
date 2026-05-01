/**
 * PlaybookSearchModal — Full-text search across all published playbooks.
 * Supports filtering by module and category.
 */
import { useState, useMemo } from "react";
import { Search, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

interface PlaybookSearchModalProps {
  module?: string;
  onSelect: (playbookId: string) => void;
  onClose: () => void;
}

export default function PlaybookSearchModal({ module, onSelect, onClose }: PlaybookSearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: categories } = trpc.contextual.getPlaybookCategories.useQuery();
  const { data: results, isLoading } = trpc.contextual.searchPlaybooks.useQuery(
    { query: query || "  ", module, category: selectedCategory, limit: 15 },
    { enabled: query.length >= 2 }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-[560px] max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <Search size={18} className="text-gray-400" />
          <Input
            placeholder="Search playbooks by title, purpose, or content..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-1.5 px-5 py-2 border-b overflow-x-auto" style={{ borderColor: "#f1f5f9" }}>
            <Badge
              variant={!selectedCategory ? "default" : "outline"}
              className="cursor-pointer text-xs whitespace-nowrap"
              onClick={() => setSelectedCategory(undefined)}
            >
              All
            </Badge>
            {categories.map((cat: any) => (
              <Badge
                key={cat.category}
                variant={selectedCategory === cat.category ? "default" : "outline"}
                className="cursor-pointer text-xs whitespace-nowrap"
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? undefined : cat.category)}
              >
                {cat.category} ({cat.count})
              </Badge>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <BookOpen size={32} className="mb-3 opacity-50" />
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="animate-pulse text-sm">Searching...</div>
            </div>
          ) : results && results.length > 0 ? (
            <div className="py-2">
              {results.map((pb: any) => (
                <button
                  key={pb.id}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                  onClick={() => onSelect(pb.id)}
                >
                  <BookOpen size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#51AF37" }} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">{pb.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pb.purpose}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-xs">{pb.category}</Badge>
                      {pb.related_module && (
                        <span className="text-xs text-gray-400">{pb.related_module}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm">No playbooks found for "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
