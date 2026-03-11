// ── Semantic Scholar API Service ──────────────────────────────────────────────
// Free API — no key required for basic queries (up to 100 req/5 min)
// Docs: https://api.semanticscholar.org/graph/v1

const S2_BASE = "https://api.semanticscholar.org/graph/v1";

// Fields to request from Semantic Scholar
const PAPER_FIELDS = "paperId,externalIds,title,authors,abstract,year,citationCount,url,openAccessPdf";

export interface S2Paper {
  paperId: string;
  externalIds?: { DOI?: string; ArXiv?: string };
  title: string;
  authors: Array<{ authorId: string; name: string }>;
  abstract?: string;
  year?: number;
  citationCount?: number;
  url?: string;
  openAccessPdf?: { url: string };
}

export interface NormalisedPaper {
  externalId: string;       // DOI if available, else S2 paperId
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  citationCount: number;
  publishedYear: number | null;
  source: "semantic_scholar";
}

// ── Keyword Extraction ────────────────────────────────────────────────────────
// Simple stop-word removal + de-duplication for MVP keyword extraction
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","as","is","was","are","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "not","no","nor","so","yet","both","either","neither","each","few","more",
  "most","other","some","such","than","then","that","this","these","those",
  "we","our","they","their","it","its","he","she","his","her","i","my","you",
  "your","what","which","who","how","when","where","why","all","any","both",
  "design","develop","create","build","implement","test","evaluate","study",
  "using","based","approach","method","system","process","results","data",
]);

export function extractKeywords(text: string, maxKeywords = 6): string {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  // De-duplicate and take top N by length (longer = more specific)
  const unique = Array.from(new Set(words)).sort((a, b) => b.length - a.length);
  return unique.slice(0, maxKeywords).join(" ");
}

// ── Search Semantic Scholar ───────────────────────────────────────────────────
export async function searchSemanticScholar(
  query: string,
  limit = 5
): Promise<NormalisedPaper[]> {
  const url = `${S2_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${PAPER_FIELDS}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "EcoBlend-VBS/1.0 (academic-validation)" },
  });

  if (!res.ok) {
    throw new Error(`Semantic Scholar API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: S2Paper[]; error?: string };

  if (!json.data) return [];

  return json.data
    .filter(p => p.title && p.paperId)
    .map(p => normalise(p));
}

// ── Fetch a single paper by DOI or S2 ID ─────────────────────────────────────
export async function fetchPaperById(id: string): Promise<NormalisedPaper | null> {
  const url = `${S2_BASE}/paper/${encodeURIComponent(id)}?fields=${PAPER_FIELDS}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "EcoBlend-VBS/1.0 (academic-validation)" },
  });
  if (!res.ok) return null;
  const p = (await res.json()) as S2Paper;
  if (!p.paperId) return null;
  return normalise(p);
}

// ── Normalise S2 response to our internal format ──────────────────────────────
function normalise(p: S2Paper): NormalisedPaper {
  const doi = p.externalIds?.DOI;
  const externalId = doi ? `doi:${doi}` : `s2:${p.paperId}`;
  const paperUrl = p.openAccessPdf?.url ?? p.url ?? `https://www.semanticscholar.org/paper/${p.paperId}`;

  return {
    externalId,
    title: p.title,
    authors: p.authors?.map(a => a.name) ?? [],
    abstract: p.abstract ?? "",
    url: paperUrl,
    citationCount: p.citationCount ?? 0,
    publishedYear: p.year ?? null,
    source: "semantic_scholar",
  };
}
