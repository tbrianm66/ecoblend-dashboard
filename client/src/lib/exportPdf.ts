// ============================================================
// ECOBLEND — PDF Export Utility
// Generates a formatted portfolio report using a print-ready
// HTML page opened in a new window, then triggers browser print.
// ============================================================

import { Venture, VRL_STAGES, TRL_LEVELS } from "@/lib/data";

function riskColor(level: string) {
  if (level === "High") return "#ef4444";
  if (level === "Medium") return "#f59e0b";
  return "#22c55e";
}

function statusColor(status: string) {
  if (status === "Active") return "#22c55e";
  if (status === "Scaling") return "#1d4ed8";
  if (status === "Pre-Launch") return "#f59e0b";
  return "#6b7280";
}

export function exportPortfolioPdf(ventures: Venture[]) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const avgVrl = ventures.length ? (ventures.reduce((a, v) => a + v.vrl, 0) / ventures.length).toFixed(1) : "—";
  const avgTrl = ventures.length ? (ventures.reduce((a, v) => a + v.trl, 0) / ventures.length).toFixed(1) : "—";
  const totalMilestones = ventures.reduce((a, v) => a + v.milestones.length, 0);
  const completedMilestones = ventures.reduce((a, v) => a + v.milestones.filter(m => m.completed).length, 0);
  const investmentReady = ventures.filter(v => v.investmentReady).length;

  const ventureRows = ventures.map(v => {
    const vrlStage = VRL_STAGES[v.vrl - 1];
    const trlLevel = TRL_LEVELS[v.trl - 1];
    const milestonePct = v.milestones.length
      ? Math.round((v.milestones.filter(m => m.completed).length / v.milestones.length) * 100)
      : 0;

    const riskRows = v.risks.map(r => `
      <tr>
        <td style="padding:6px 10px;font-size:11px;color:#374151;">${r.domain}</td>
        <td style="padding:6px 10px;font-size:11px;">
          <span style="background:${riskColor(r.level)}20;color:${riskColor(r.level)};padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;">${r.level}</span>
        </td>
        <td style="padding:6px 10px;font-size:11px;color:#6b7280;">${r.mitigation}</td>
      </tr>
    `).join("");

    const milestoneItems = v.milestones.map(m => `
      <li style="font-size:11px;color:${m.completed ? "#9ca3af" : "#374151"};text-decoration:${m.completed ? "line-through" : "none"};margin-bottom:3px;">
        ${m.completed ? "✓" : "○"} ${m.label}${m.date ? ` <span style="color:#d1d5db;font-size:10px;">(${m.date})</span>` : ""}
      </li>
    `).join("");

    return `
      <div style="page-break-inside:avoid;margin-bottom:28px;border:1px solid #e5e7eb;border-left:4px solid ${v.color};border-radius:8px;overflow:hidden;">
        <!-- Venture header -->
        <div style="background:#f9fafb;padding:14px 18px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:16px;font-weight:700;color:${v.color};">${v.name}</span>
            <span style="margin-left:8px;font-size:10px;padding:2px 8px;border-radius:9999px;border:1px solid ${v.color};color:${v.color};">${v.channel}</span>
            <span style="margin-left:6px;font-size:10px;padding:2px 8px;border-radius:9999px;background:${statusColor(v.status)}15;color:${statusColor(v.status)};">${v.status}</span>
          </div>
          <div style="font-size:11px;color:#6b7280;">${v.sector}</div>
        </div>
        <div style="padding:14px 18px;">
          <p style="font-size:11px;color:#6b7280;margin:0 0 12px;">${v.tagline}</p>

          <!-- Readiness scores -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
            <div style="background:#f0fdf4;border-radius:6px;padding:10px 14px;">
              <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#22c55e;margin-bottom:4px;">VRL — Venture Readiness</div>
              <div style="font-size:18px;font-weight:700;color:#1c1c1e;font-family:monospace;">Stage ${v.vrl}/4</div>
              <div style="font-size:10px;color:#6b7280;">${vrlStage?.label} · ${v.vrlPercent}% through stage</div>
            </div>
            <div style="background:#eff6ff;border-radius:6px;padding:10px 14px;">
              <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1d4ed8;margin-bottom:4px;">TRL — Technology Readiness</div>
              <div style="font-size:18px;font-weight:700;color:#1c1c1e;font-family:monospace;">Level ${v.trl}/9</div>
              <div style="font-size:10px;color:#6b7280;">${trlLevel?.label} · ${v.trlPercent}% through level</div>
            </div>
          </div>

          <!-- Investment readiness -->
          <div style="margin-bottom:14px;padding:8px 12px;border-radius:6px;background:${v.investmentReady ? "#f0fdf4" : "#fafafa"};border:1px solid ${v.investmentReady ? "#bbf7d0" : "#e5e7eb"};">
            <span style="font-size:10px;font-weight:600;color:${v.investmentReady ? "#22c55e" : "#9ca3af"};">
              ${v.investmentReady ? "✓ INVESTMENT READY" : "○ Not yet investment ready (requires VRL 3+ and TRL 6+)"}
            </span>
          </div>

          <!-- Milestones -->
          <div style="margin-bottom:14px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#374151;margin-bottom:8px;">
              Milestones — ${v.milestones.filter(m => m.completed).length}/${v.milestones.length} completed (${milestonePct}%)
            </div>
            <ul style="list-style:none;padding:0;margin:0;">${milestoneItems}</ul>
          </div>

          <!-- Risk register -->
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#374151;margin-bottom:8px;">Risk Register</div>
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:6px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #e5e7eb;">Domain</th>
                  <th style="padding:6px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #e5e7eb;">Level</th>
                  <th style="padding:6px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #e5e7eb;">Mitigation</th>
                </tr>
              </thead>
              <tbody>${riskRows}</tbody>
            </table>
          </div>

          <!-- BMC / MMC -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
            <div style="background:#f9fafb;border-radius:6px;padding:10px 14px;">
              <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">Business Model Canvas</div>
              <div style="font-size:11px;color:#374151;">${v.bmc}</div>
            </div>
            <div style="background:#f9fafb;border-radius:6px;padding:10px 14px;">
              <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">Mission Model Canvas</div>
              <div style="font-size:11px;color:#374151;">${v.mmc}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>EcoBlend Portfolio Report — ${date}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; color: #1c1c1e; background: white; padding: 32px; max-width: 900px; margin: 0 auto; }
        @media print {
          body { padding: 16px; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <!-- Cover -->
      <div style="border-bottom:3px solid #22c55e;padding-bottom:20px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#22c55e;margin-bottom:6px;">EcoBlend VBS</div>
            <h1 style="font-size:26px;font-weight:700;color:#1c1c1e;margin-bottom:4px;">EcoBlend Portfolio Report</h1>
            <p style="font-size:12px;color:#6b7280;">Dual-Readiness Intelligence: VRL & TRL across all active ventures</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#9ca3af;">Generated</div>
            <div style="font-size:13px;font-weight:600;color:#374151;font-family:monospace;">${date}</div>
          </div>
        </div>
      </div>

      <!-- Portfolio KPIs -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px;">
        <div style="background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#22c55e;margin-bottom:4px;">Ventures</div>
          <div style="font-size:22px;font-weight:700;color:#1c1c1e;font-family:monospace;">${ventures.length}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#22c55e;margin-bottom:4px;">Avg VRL</div>
          <div style="font-size:22px;font-weight:700;color:#1c1c1e;font-family:monospace;">${avgVrl}</div>
        </div>
        <div style="background:#eff6ff;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#1d4ed8;margin-bottom:4px;">Avg TRL</div>
          <div style="font-size:22px;font-weight:700;color:#1c1c1e;font-family:monospace;">${avgTrl}</div>
        </div>
        <div style="background:#fffbeb;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#f59e0b;margin-bottom:4px;">Milestones</div>
          <div style="font-size:22px;font-weight:700;color:#1c1c1e;font-family:monospace;">${completedMilestones}/${totalMilestones}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#22c55e;margin-bottom:4px;">Inv. Ready</div>
          <div style="font-size:22px;font-weight:700;color:#1c1c1e;font-family:monospace;">${investmentReady}</div>
        </div>
      </div>

      <!-- Venture detail sections -->
      <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#374151;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">
        Venture Detail Reports
      </h2>
      ${ventureRows}

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:10px;color:#9ca3af;">© 2026 EcoRace Studio · EcoBlend Analytics Platform · MVP v1.0</div>
        <div style="font-size:10px;color:#9ca3af;font-family:monospace;">© 2026 EcoRace Studio · Confidential</div>
      </div>

      <!-- Print button (hidden when printing) -->
      <div class="no-print" style="margin-top:24px;text-align:center;">
        <button onclick="window.print()" style="background:#22c55e;color:white;border:none;padding:10px 28px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">
          Print / Save as PDF
        </button>
      </div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ── Investor Pack Export ──────────────────────────────────────────────────────
// Generates a formatted Investor Due Diligence Pack combining:
//   • Portfolio Investment Readiness summary
//   • VRL/TRL progress table per venture
//   • Legal Contracts summary (from localStorage)
// ─────────────────────────────────────────────────────────────────────────────

interface ContractSummary {
  id: string;
  title: string;
  category: string;
  ventureId: string;
  counterparty: string;
  status: string;
  value?: string;
  signedDate?: string;
  expiryDate?: string;
}

function loadContractsForExport(): ContractSummary[] {
  try {
    const stored = localStorage.getItem("ecoblend-contracts-v1");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const VENTURE_LABELS: Record<string, string> = {
  "ecoblend-rd": "EcoBlend R&D",
  bebus: "BEBUS",
  tone: "TONE",
  real: "REAL",
  vbs: "VBS (Studio)",
};

const CONTRACT_STATUS_COLOURS: Record<string, string> = {
  Active:         "#51AF37",
  Draft:          "#9ca3af",
  "Under Review": "#F49C13",
  Expired:        "#ef4444",
  Terminated:     "#dc2626",
};

export function exportInvestorPack(ventures: Venture[]) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const contracts = loadContractsForExport();

  // ── Investment Readiness Summary ──────────────────────────────────────────
  const investmentRows = ventures.map(v => {
    const vrlStage = VRL_STAGES[v.vrl - 1];
    const trlLevel = TRL_LEVELS[v.trl - 1];
    const ready = v.investmentReady;
    const vrlPct = Math.round(((v.vrl - 1) / 4 + v.vrlPercent / 400) * 100);
    const trlPct = Math.round(((v.trl - 1) / 9 + v.trlPercent / 900) * 100);

    return `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${v.color};">${v.name}</td>
        <td style="padding:10px 12px;font-size:11px;color:#374151;">${v.channel}</td>
        <td style="padding:10px 12px;font-size:11px;">
          <div style="font-weight:600;color:#1a2332;">Stage ${v.vrl}/4</div>
          <div style="font-size:10px;color:#9ca3af;">${vrlStage?.label}</div>
          <div style="margin-top:4px;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${vrlPct}%;background:#51AF37;border-radius:2px;"></div>
          </div>
        </td>
        <td style="padding:10px 12px;font-size:11px;">
          <div style="font-weight:600;color:#1a2332;">Level ${v.trl}/9</div>
          <div style="font-size:10px;color:#9ca3af;">${trlLevel?.label}</div>
          <div style="margin-top:4px;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${trlPct}%;background:#3A97D3;border-radius:2px;"></div>
          </div>
        </td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:10px;font-weight:700;background:${ready ? "#f0fdf4" : "#f9fafb"};color:${ready ? "#51AF37" : "#9ca3af"};border:1px solid ${ready ? "#bbf7d0" : "#e5e7eb"};">
            ${ready ? "✓ Ready" : "Not Yet"}
          </span>
        </td>
        <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${v.nominatedCharity}</td>
      </tr>
    `;
  }).join("");

  // ── Legal Contracts Summary ───────────────────────────────────────────────
  const contractRows = contracts.map(c => {
    const statusColor = CONTRACT_STATUS_COLOURS[c.status] || "#9ca3af";
    const ventureName = VENTURE_LABELS[c.ventureId] || c.ventureId;
    return `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:9px 12px;font-size:11px;font-weight:600;color:#1a2332;">${c.title}</td>
        <td style="padding:9px 12px;font-size:10px;color:#6b7280;">${c.category}</td>
        <td style="padding:9px 12px;font-size:10px;color:#6b7280;">${ventureName}</td>
        <td style="padding:9px 12px;font-size:10px;color:#374151;">${c.counterparty}</td>
        <td style="padding:9px 12px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}30;">
            ${c.status}
          </span>
        </td>
        <td style="padding:9px 12px;font-size:10px;color:#374151;">${c.value || "—"}</td>
        <td style="padding:9px 12px;font-size:10px;color:#9ca3af;">${c.expiryDate || "—"}</td>
      </tr>
    `;
  }).join("");

  // ── Portfolio KPIs ────────────────────────────────────────────────────────
  const avgVrl = ventures.length ? (ventures.reduce((a, v) => a + v.vrl, 0) / ventures.length).toFixed(1) : "—";
  const avgTrl = ventures.length ? (ventures.reduce((a, v) => a + v.trl, 0) / ventures.length).toFixed(1) : "—";
  const investmentReady = ventures.filter(v => v.investmentReady).length;
  const activeContracts = contracts.filter(c => c.status === "Active").length;
  const totalMilestones = ventures.reduce((a, v) => a + v.milestones.length, 0);
  const completedMilestones = ventures.reduce((a, v) => a + v.milestones.filter(m => m.completed).length, 0);
  const milestonePct = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>EcoBlend Investor Pack — ${date}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Prompt:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Nunito', sans-serif; color: #1a2332; background: white; padding: 36px; max-width: 960px; margin: 0 auto; }
        h1, h2, h3 { font-family: 'Prompt', sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
        @media print {
          body { padding: 16px; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>

      <!-- ── Cover Page ── -->
      <div style="border-bottom:4px solid #51AF37;padding-bottom:24px;margin-bottom:32px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#51AF37;margin-bottom:8px;">
              © 2026 EcoRace Studio · Confidential
            </div>
            <h1 style="font-size:30px;font-weight:700;color:#1a2332;margin-bottom:6px;line-height:1.2;">
              Investor Due Diligence Pack
            </h1>
            <p style="font-size:13px;color:#6b7280;max-width:520px;line-height:1.5;">
              Investment Readiness Summary, VRL/TRL Progress, and Legal Contracts Register for the EcoBlend Portfolio. Generated by the EcoBlend Analytics Dashboard.
            </p>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px;">Generated</div>
            <div style="font-size:13px;font-weight:700;color:#374151;">${date}</div>
            <div style="margin-top:8px;font-size:10px;color:#9ca3af;">© 2026 EcoRace Studio</div>
            <div style="font-size:10px;color:#9ca3af;">EcoBlend Analytics v1.0</div>
          </div>
        </div>
      </div>

      <!-- ── Portfolio KPIs ── -->
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:36px;">
        ${[
          { label: "Ventures", value: ventures.length.toString(), color: "#51AF37", bg: "#f0fdf4" },
          { label: "Avg VRL", value: avgVrl, color: "#51AF37", bg: "#f0fdf4" },
          { label: "Avg TRL", value: avgTrl, color: "#3A97D3", bg: "#eff6ff" },
          { label: "Inv. Ready", value: investmentReady.toString(), color: "#51AF37", bg: "#f0fdf4" },
          { label: "Milestones", value: `${milestonePct}%`, color: "#F49C13", bg: "#fffbeb" },
          { label: "Active Contracts", value: activeContracts.toString(), color: "#8b5cf6", bg: "#f5f3ff" },
        ].map(k => `
          <div style="background:${k.bg};border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${k.color};margin-bottom:6px;">${k.label}</div>
            <div style="font-size:24px;font-weight:700;color:#1a2332;font-family:'Prompt',sans-serif;">${k.value}</div>
          </div>
        `).join("")}
      </div>

      <!-- ── Section 1: Investment Readiness ── -->
      <div style="margin-bottom:36px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;">
          <div style="width:28px;height:28px;border-radius:8px;background:#51AF3715;display:flex;align-items:center;justify-content:center;font-size:14px;">📈</div>
          <div>
            <h2 style="font-size:16px;font-weight:700;color:#1a2332;">Section 1 — Investment Readiness & VRL/TRL Progress</h2>
            <p style="font-size:11px;color:#9ca3af;margin-top:2px;">Ventures reach investment readiness at VRL Stage 3 and TRL Level 6 or above.</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Venture</th>
              <th>Channel</th>
              <th>VRL Stage</th>
              <th>TRL Level</th>
              <th style="text-align:center;">Inv. Ready</th>
              <th>Nominated Charity</th>
            </tr>
          </thead>
          <tbody>${investmentRows}</tbody>
        </table>
      </div>

      <!-- ── Section 2: Legal Contracts Register ── -->
      <div class="page-break" style="margin-bottom:36px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;">
          <div style="width:28px;height:28px;border-radius:8px;background:#3A97D315;display:flex;align-items:center;justify-content:center;font-size:14px;">📄</div>
          <div>
            <h2 style="font-size:16px;font-weight:700;color:#1a2332;">Section 2 — Legal Contracts Register</h2>
            <p style="font-size:11px;color:#9ca3af;margin-top:2px;">Founder agreements, IP licences, OEM partnerships, charity MoUs, and investor term sheets.</p>
          </div>
        </div>
        ${contracts.length === 0
          ? `<p style="font-size:12px;color:#9ca3af;padding:20px 0;">No contracts recorded in the system.</p>`
          : `<table>
              <thead>
                <tr>
                  <th>Contract Title</th>
                  <th>Category</th>
                  <th>Venture</th>
                  <th>Counterparty</th>
                  <th>Status</th>
                  <th>Value / Terms</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>${contractRows}</tbody>
            </table>`
        }
      </div>

      <!-- ── Section 3: Dual-Canvas Summary ── -->
      <div style="margin-bottom:36px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;">
          <div style="width:28px;height:28px;border-radius:8px;background:#F49C1315;display:flex;align-items:center;justify-content:center;font-size:14px;">🗺️</div>
          <div>
            <h2 style="font-size:16px;font-weight:700;color:#1a2332;">Section 3 — Dual-Canvas Model Summary</h2>
            <p style="font-size:11px;color:#9ca3af;margin-top:2px;">Business Model Canvas (commercial) and Mission Model Canvas (social impact) per venture.</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${ventures.map(v => `
            <div style="border:1px solid #e5e7eb;border-left:4px solid ${v.color};border-radius:8px;padding:14px;">
              <div style="font-size:13px;font-weight:700;color:${v.color};margin-bottom:10px;font-family:'Prompt',sans-serif;">${v.name}</div>
              <div style="margin-bottom:8px;">
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;">Business Model Canvas</div>
                <div style="font-size:11px;color:#374151;line-height:1.5;">${v.bmc}</div>
              </div>
              <div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;">Mission Model Canvas</div>
                <div style="font-size:11px;color:#374151;line-height:1.5;">${v.mmc}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ── Disclaimer ── -->
      <div style="margin-top:32px;padding:14px 18px;border-radius:8px;background:#fffbeb;border:1px solid #fde68a;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#d97706;margin-bottom:4px;">Confidentiality Notice</div>
        <p style="font-size:10px;color:#92400e;line-height:1.6;">
          This document is strictly confidential and intended solely for the named recipient(s). It contains commercially sensitive information relating to EcoRace Venture Builder Studio and its portfolio ventures. Reproduction, distribution, or disclosure to any third party without prior written consent is prohibited. This document does not constitute a legally binding offer or commitment to invest.
        </p>
      </div>

      <!-- ── Footer ── -->
      <div style="margin-top:24px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:10px;color:#9ca3af;">© 2026 EcoRace Studio · EcoBlend Analytics Platform</div>
        <div style="font-size:10px;color:#9ca3af;">© 2026 EcoRace Studio · ${date}</div>
      </div>

      <!-- Print button -->
      <div class="no-print" style="margin-top:28px;text-align:center;">
        <button onclick="window.print()" style="background:#51AF37;color:white;border:none;padding:12px 32px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;margin-right:12px;">
          🖨️ Print / Save as PDF
        </button>
        <button onclick="window.close()" style="background:#f3f4f6;color:#6b7280;border:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Nunito',sans-serif;">
          Close
        </button>
      </div>

    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
