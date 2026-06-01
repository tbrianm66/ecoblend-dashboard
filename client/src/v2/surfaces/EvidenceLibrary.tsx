import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { evidence } from "../mock/data";
import { useRole } from "../context/RoleContext";
import { SurfaceHeader } from "../components/SurfaceHeader";
import { confidenceTier } from "../components/ConfidenceBadge";

const reviewCls: Record<string, string> = {
  verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "in review": "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  disputed: "bg-red-100 text-red-800 border-red-200",
};

function ConfDot({ v }: { v: number }) {
  const tier = confidenceTier(v);
  const c = tier === "strong" ? "bg-emerald-500" : tier === "moderate" ? "bg-amber-500" : "bg-red-500";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${c}`} />
      <span className="tabular-nums">{v}%</span>
    </span>
  );
}

export default function EvidenceLibrary() {
  const { ventureId } = useRole();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = Array.from(new Set(evidence.map((e) => e.category)));
  const rows = evidence
    .filter((e) => e.ventureId === ventureId)
    .filter((e) => category === "all" || e.category === category)
    .filter((e) => e.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <SurfaceHeader
        title="Evidence Library"
        description="Every readiness score traces back to classified, credibility-rated evidence."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search evidence…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evidence</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Review</TableHead>
                <TableHead className="text-right">Credibility</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead className="text-right">Impact</TableHead>
                <TableHead className="text-right">Ver.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium leading-tight">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.source} · {e.uploadedAt}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{e.category}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e.linkedModule}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{e.owner}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${reviewCls[e.reviewStatus]}`}>
                      {e.reviewStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{e.credibility}%</TableCell>
                  <TableCell className="text-right text-sm">
                    <div className="flex justify-end">
                      <ConfDot v={e.confidence} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">+{e.scoreImpact}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">v{e.version}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No evidence matches your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
