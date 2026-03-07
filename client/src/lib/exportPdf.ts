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
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#22c55e;margin-bottom:6px;">EcoRace VBS · H4 Lean Methodology</div>
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
        <div style="font-size:10px;color:#9ca3af;">EcoRace Venture Builder Studio · EcoBlend Analytics Platform · MVP v1.0</div>
        <div style="font-size:10px;color:#9ca3af;font-family:monospace;">H4 Lean Methodology · Confidential</div>
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
