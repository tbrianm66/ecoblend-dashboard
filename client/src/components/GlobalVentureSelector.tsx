// ============================================================
// ECOBLEND OS — GlobalVentureSelector
// Sidebar venture picker — shows the active venture and a
// dropdown of all accessible ventures.
// ============================================================

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";

const STATUS_COLORS: Record<string, string> = {
  Active: "#51AF37",
  Scaling: "#3A97D3",
  "Pre-Launch": "#F49C13",
  Paused: "#6b7280",
  Archived: "#374151",
};

export default function GlobalVentureSelector() {
  const { selectedVenture, availableVentures, setSelectedVentureId, loading } =
    useSelectedVenture();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (loading) {
    return (
      <div
        className="mx-3 my-2 px-3 py-2 rounded-lg flex items-center gap-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Loader2 size={12} className="animate-spin" style={{ color: "rgba(255,255,255,0.35)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif" }}>
          Loading ventures…
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mx-3 my-2">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150"
        style={{
          background: open ? "rgba(81,175,55,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(81,175,55,0.35)" : "rgba(255,255,255,0.09)"}`,
        }}
        title="Switch active venture"
      >
        {/* Venture colour dot */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: selectedVenture?.color
              ? selectedVenture.color
              : selectedVenture?.status
              ? STATUS_COLORS[selectedVenture.status] ?? "#6b7280"
              : "#6b7280",
          }}
        />
        <span
          className="flex-1 text-left text-xs font-semibold truncate"
          style={{
            color: selectedVenture ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {selectedVenture ? selectedVenture.name : "Select venture…"}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: "rgba(255,255,255,0.35)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden"
          style={{
            background: "#1e2d42",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {availableVentures.length === 0 ? (
            <div
              className="flex items-center gap-2 px-3 py-3"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <Building2 size={13} />
              <span className="text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                No ventures available
              </span>
            </div>
          ) : (
            availableVentures.map((v) => {
              const isSelected = v.id === selectedVenture?.id;
              const statusColor = v.color ?? STATUS_COLORS[v.status ?? ""] ?? "#6b7280";
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVentureId(v.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-all duration-100"
                  style={{
                    background: isSelected ? "rgba(81,175,55,0.12)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: statusColor }}
                  />
                  <span
                    className="flex-1 text-left text-xs font-medium truncate"
                    style={{
                      color: isSelected ? "#51AF37" : "rgba(255,255,255,0.75)",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {v.name}
                  </span>
                  {v.status && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        background: `${statusColor}18`,
                        color: statusColor,
                        fontSize: "9px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {v.status}
                    </span>
                  )}
                  {isSelected && (
                    <CheckCircle2 size={12} style={{ color: "#51AF37", shrink: 0 }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
