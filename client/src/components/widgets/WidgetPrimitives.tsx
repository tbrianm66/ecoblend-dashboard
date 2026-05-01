/**
 * Shared Widget Primitives
 * Reusable sub-components for all specialised widget cards.
 * Design: Precision Industrial — white/gray-50 bg, green #51AF37 accent, Prompt font headings
 */
import React from "react";
import { Loader2, AlertTriangle, BookOpen, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── WidgetLoadingState ───────────────────────────────────────────────────────
export function WidgetLoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
      <Loader2 size={16} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}

// ─── WidgetErrorState ─────────────────────────────────────────────────────────
export function WidgetErrorState({ message = "Failed to load data." }: { message?: string }) {
  return (
    <div className="flex items-start gap-2 py-4 px-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── WidgetEmptyState ─────────────────────────────────────────────────────────
export function WidgetEmptyState({
  title = "All clear",
  description = "No items to action right now.",
  icon,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        {icon || <Info size={18} />}
      </div>
      <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Prompt', sans-serif" }}>
        {title}
      </p>
      <p className="text-xs text-gray-400 max-w-[220px]">{description}</p>
    </div>
  );
}

// ─── WidgetNoVentureState ─────────────────────────────────────────────────────
export function WidgetNoVentureState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <Info size={18} />
      </div>
      <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Prompt', sans-serif" }}>
        No venture selected
      </p>
      <p className="text-xs text-gray-400 max-w-[220px]">
        Select a venture to see contextual guidance.
      </p>
    </div>
  );
}

// ─── WidgetActionButton ───────────────────────────────────────────────────────
export function WidgetActionButton({
  label,
  onClick,
  variant = "outline",
  size = "sm",
  icon,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "xs";
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className="gap-1.5 text-xs"
      style={
        variant === "default"
          ? { background: "#51AF37", borderColor: "#51AF37", color: "#fff" }
          : { borderColor: "#51AF37", color: "#51AF37" }
      }
    >
      {icon}
      {label}
    </Button>
  );
}

// ─── RecommendedPlaybookLink ──────────────────────────────────────────────────
export function RecommendedPlaybookLink({
  playbook,
  onOpen,
}: {
  playbook: { id: string; title: string; category?: string; related_module?: string };
  onOpen: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(playbook.id)}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-green-200 transition-colors text-left group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <BookOpen size={13} className="shrink-0 text-green-600" />
        <span className="text-xs font-medium text-gray-700 truncate group-hover:text-green-700">
          {playbook.title}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {playbook.category && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-400">
            {playbook.category}
          </Badge>
        )}
        <ChevronRight size={12} className="text-gray-300 group-hover:text-green-500" />
      </div>
    </button>
  );
}

// ─── WidgetProgressBar ────────────────────────────────────────────────────────
export function WidgetProgressBar({
  value,
  max = 100,
  color = "#51AF37",
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs font-mono text-gray-500">{pct}%</span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── WidgetSectionHeader ──────────────────────────────────────────────────────
export function WidgetSectionHeader({
  title,
  badge,
  badgeColor,
  icon,
}: {
  title: string;
  badge?: string | number;
  badgeColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-500">{icon}</span>}
        <h3
          className="text-sm font-bold text-gray-800"
          style={{ fontFamily: "'Prompt', sans-serif" }}
        >
          {title}
        </h3>
      </div>
      {badge !== undefined && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: `${badgeColor || "#51AF37"}18`,
            color: badgeColor || "#51AF37",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── WidgetBlockerItem ────────────────────────────────────────────────────────
export function WidgetBlockerItem({
  text,
  severity = "warning",
}: {
  text: string;
  severity?: "error" | "warning" | "info";
}) {
  const colors = {
    error: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", dot: "#ef4444" },
    warning: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", dot: "#F49C13" },
    info: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", dot: "#3A97D3" },
  };
  const c = colors[severity];
  return (
    <div className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border ${c.bg} ${c.border}`}>
      <span
        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
        style={{ background: c.dot }}
      />
      <span className={`text-xs ${c.text}`}>{text}</span>
    </div>
  );
}
