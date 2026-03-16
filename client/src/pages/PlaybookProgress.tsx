// ============================================================
// ECOBLEND PLAYBOOK PROGRESS
// Brand: EcoBlend — Green #51AF37, Blue #3A97D3, Orange #F49C13
// Typography: Prompt (headings) + Nunito (body)
// ============================================================

import { useState } from "react";
import { BookOpen, CheckCircle2, Circle, ChevronDown, ChevronUp, Lock, Zap } from "lucide-react";
import { useVentures } from "@/contexts/VentureContext";

const VENTURE_OPTIONS = [
  { id: "ecoblend-rd", label: "EcoRace", color: "#51AF37" },
  { id: "bebus",       label: "BEBUS",         color: "#3A97D3" },
  { id: "tone",        label: "TONE",           color: "#F49C13" },
  { id: "real",        label: "REAL",           color: "#f1c411" },
];

interface PlaybookTask {
  id: string;
  number: number;
  label: string;
  description: string;
  completed: boolean;
}

interface PlaybookPhase {
  id: string;
  number: number;
  label: string;
  taskRange: string;
  vrlStage: string;
  color: string;
  tasks: PlaybookTask[];
}

const buildPhases = (): PlaybookPhase[] => [
  {
    id: "fundamentals",
    number: 1,
    label: "Fundamentals",
    taskRange: "Tasks 1–17",
    vrlStage: "VRL 1",
    color: "#51AF37",
    tasks: [
      { id: "t1",  number: 1,  label: "Supply & Demand Analysis",      description: "Identify the core supply and demand dynamics in your target market", completed: false },
      { id: "t2",  number: 2,  label: "Market Research",               description: "Conduct primary and secondary market research to size the opportunity", completed: false },
      { id: "t3",  number: 3,  label: "Competitor Landscape",          description: "Map direct and indirect competitors; identify white space", completed: false },
      { id: "t4",  number: 4,  label: "Key Pains, Gains & Jobs-to-be-Done", description: "Define the top 3 customer pains, gains, and jobs using the Value Proposition Canvas", completed: false },
      { id: "t5",  number: 5,  label: "Value Propositions",            description: "Draft 3 distinct value propositions aligned to customer jobs", completed: false },
      { id: "t6",  number: 6,  label: "Business Model Status",         description: "Complete the Business Model Canvas (BMC) first draft", completed: false },
      { id: "t7",  number: 7,  label: "Mission Model Canvas (MMC)",    description: "Complete the Mission Model Canvas for the nominated charity alignment", completed: false },
      { id: "t8",  number: 8,  label: "Revenue Streams",               description: "Identify and validate at least 2 revenue streams with pricing assumptions", completed: false },
      { id: "t9",  number: 9,  label: "Ecosystem of Tools",            description: "Select and set up the core tools for operations, comms, and finance", completed: false },
      { id: "t10", number: 10, label: "Feasibility Assessment",        description: "Complete a structured feasibility assessment across market, technical, and financial dimensions", completed: false },
      { id: "t11", number: 11, label: "Budgeting Basics",              description: "Build a 12-month budget with key assumptions documented", completed: false },
      { id: "t12", number: 12, label: "Customer Validation (Initial)", description: "Conduct 5 problem interviews to validate the core pain hypothesis", completed: false },
      { id: "t13", number: 13, label: "Business Functions Overview",   description: "Define the 6 core business functions and assign ownership", completed: false },
      { id: "t14", number: 14, label: "Marketing Crash Course",        description: "Complete the VBS marketing fundamentals module", completed: false },
      { id: "t15", number: 15, label: "Sales Crash Course",            description: "Complete the VBS sales fundamentals module", completed: false },
      { id: "t16", number: 16, label: "Operations Crash Course",       description: "Complete the VBS operations fundamentals module", completed: false },
      { id: "t17", number: 17, label: "Finance Crash Course",          description: "Complete the VBS finance fundamentals module", completed: false },
    ],
  },
  {
    id: "kickoff",
    number: 2,
    label: "Kickoff",
    taskRange: "Tasks 18–43",
    vrlStage: "VRL 2",
    color: "#3A97D3",
    tasks: [
      { id: "t18", number: 18, label: "Evaluate Problems & Trends",    description: "Identify the top 3 macro trends driving the problem space", completed: false },
      { id: "t19", number: 19, label: "Identify Your MVPs",            description: "Define the Minimum Viable Product for each identified solution", completed: false },
      { id: "t20", number: 20, label: "Apply the 10 Types of Innovation", description: "Map your innovation across the 10 types framework", completed: false },
      { id: "t21", number: 21, label: "Examine Sustainability",        description: "Define the environmental and social sustainability commitments", completed: false },
      { id: "t22", number: 22, label: "End-State Vision & USPs",       description: "Write a 3-year end-state vision and 3 Unique Selling Propositions", completed: false },
      { id: "t23", number: 23, label: "Create/State Value Proposition", description: "Finalise the value proposition statement for each customer segment", completed: false },
      { id: "t24", number: 24, label: "Research Unfair Advantages",    description: "Identify your top 3 unfair advantages (IP, network, expertise)", completed: false },
      { id: "t25", number: 25, label: "Plan Mission",                  description: "Define the mission statement and link it to the nominated charity", completed: false },
      { id: "t26", number: 26, label: "Implement Outcome Learning",    description: "Set up a learning loop with weekly outcome reviews", completed: false },
      { id: "t27", number: 27, label: "Create Business Plan",          description: "Complete a 10-page business plan covering all 6 business functions", completed: false },
      { id: "t28", number: 28, label: "Begin Budgeting",               description: "Build a detailed 24-month financial model with 3 scenarios", completed: false },
      { id: "t29", number: 29, label: "Streamline Area",               description: "Identify and eliminate the top 3 operational bottlenecks", completed: false },
      { id: "t30", number: 30, label: "Define the Customer",           description: "Build 2 detailed customer personas with Jobs-to-be-Done", completed: false },
      { id: "t31", number: 31, label: "Define Methodology for Customer Outreach", description: "Select and document the customer outreach methodology", completed: false },
      { id: "t32", number: 32, label: "Define Method for Customer Outreach", description: "Build the customer outreach sequence and scripts", completed: false },
      { id: "t33", number: 33, label: "Assemble Focus Group",          description: "Recruit and run a 6-person focus group for the core hypothesis", completed: false },
      { id: "t34", number: 34, label: "Roadmap to Product/Service or 'MVP'", description: "Build a 6-month product/service roadmap with milestones", completed: false },
      { id: "t35", number: 35, label: "Define Brand",                  description: "Complete the brand identity brief (name, logo, colours, tone of voice)", completed: false },
      { id: "t36", number: 36, label: "Establish Brand Identity",      description: "Produce brand guidelines document and asset library", completed: false },
      { id: "t37", number: 37, label: "Map Out Lean on Opportunities", description: "Identify 5 quick-win opportunities to validate in the next 30 days", completed: false },
      { id: "t38", number: 38, label: "Address Legal Structure",       description: "Select and register the legal structure (CIC, Ltd, etc.)", completed: false },
      { id: "t39", number: 39, label: "Secure Legal Obligations",      description: "Complete IP registration, ESOP agreements, and founder agreements", completed: false },
      { id: "t40", number: 40, label: "Select Payment Service",        description: "Integrate a payment gateway and test the full purchase flow", completed: false },
      { id: "t41", number: 41, label: "Register Trademark",            description: "File trademark application for the brand name and logo", completed: false },
      { id: "t42", number: 42, label: "Register Domain",               description: "Secure the primary domain and set up professional email", completed: false },
      { id: "t43", number: 43, label: "Set Up Accounting",             description: "Set up accounting software and chart of accounts", completed: false },
    ],
  },
  {
    id: "go-to-market",
    number: 3,
    label: "Go-to-Market",
    taskRange: "Tasks 44–75",
    vrlStage: "VRL 3",
    color: "#F49C13",
    tasks: [
      { id: "t44", number: 44, label: "Design Operating Model",        description: "Document the end-to-end operating model and key processes", completed: false },
      { id: "t45", number: 45, label: "Set Up Business Insurance",     description: "Obtain appropriate business insurance coverage", completed: false },
      { id: "t46", number: 46, label: "Define Metrics for Evaluating Value", description: "Define the 5 core KPIs that measure value delivery", completed: false },
      { id: "t47", number: 47, label: "Research Tools & Partners",     description: "Identify and onboard the 3 key technology partners", completed: false },
      { id: "t48", number: 48, label: "Build Leads Funnel",            description: "Build and test the full leads acquisition funnel", completed: false },
      { id: "t49", number: 49, label: "Organise Sales Training",       description: "Complete the VBS advanced sales training module", completed: false },
      { id: "t50", number: 50, label: "Map Up Customer Care",          description: "Define the customer care process and set up support channels", completed: false },
      { id: "t51", number: 51, label: "Consider Sales Funnel",         description: "Optimise the sales funnel based on first customer data", completed: false },
      { id: "t52", number: 52, label: "Reporting",                     description: "Set up weekly and monthly reporting cadence with dashboards", completed: false },
      { id: "t53", number: 53, label: "Define Metrics for Surveys",    description: "Build NPS and CSAT survey templates and automate delivery", completed: false },
      { id: "t54", number: 54, label: "Apply Mobile, Desktop and Mobile Reports", description: "Ensure all reporting is accessible on mobile and desktop", completed: false },
      { id: "t55", number: 55, label: "Establish Processes for Legal Reporting", description: "Set up compliance and legal reporting processes", completed: false },
      { id: "t56", number: 56, label: "Drive Test Around Conditions",  description: "Run A/B tests on the top 3 conversion points", completed: false },
      { id: "t57", number: 57, label: "Flexible Test Conditions",      description: "Build a test-and-learn framework for continuous improvement", completed: false },
      { id: "t58", number: 58, label: "Develop Customer Campaigns",    description: "Launch the first 3 customer acquisition campaigns", completed: false },
      { id: "t59", number: 59, label: "Marketing",                     description: "Execute the full marketing strategy across all channels", completed: false },
      { id: "t60", number: 60, label: "Activate Rights-Based Approach", description: "Implement the social impact rights-based approach in operations", completed: false },
      { id: "t61", number: 61, label: "Analyse Acquisition Metrics",   description: "Review and optimise CAC, LTV, and payback period", completed: false },
      { id: "t62", number: 62, label: "Law",                           description: "Complete annual legal compliance review", completed: false },
    ],
  },
  {
    id: "scaling",
    number: 4,
    label: "Scaling",
    taskRange: "Tasks 76–100",
    vrlStage: "VRL 4",
    color: "#9333ea",
    tasks: [
      { id: "t76", number: 76, label: "Investment Readiness",          description: "Complete the investment readiness checklist and pitch deck", completed: false },
      { id: "t77", number: 77, label: "Investor Outreach",             description: "Identify and contact 20 target investors", completed: false },
      { id: "t78", number: 78, label: "Due Diligence Preparation",     description: "Prepare the full due diligence data room", completed: false },
      { id: "t79", number: 79, label: "Term Sheet Negotiation",        description: "Negotiate and agree term sheet with lead investor", completed: false },
      { id: "t80", number: 80, label: "B Corp Assessment",             description: "Complete the B Impact Assessment and submit for B Corp certification", completed: false },
      { id: "t81", number: 81, label: "ISO 14001 Application",         description: "Initiate ISO 14001 Environmental Management System certification", completed: false },
      { id: "t82", number: 82, label: "Global IP Licensing",           description: "Identify and approach 3 values-aligned global licensing partners", completed: false },
      { id: "t83", number: 83, label: "International Market Entry",    description: "Select the first international market and build entry strategy", completed: false },
      { id: "t84", number: 84, label: "Scale Operations",              description: "Build the operational playbook for scaling to 10x current capacity", completed: false },
      { id: "t85", number: 85, label: "Build Senior Team",             description: "Recruit 3 senior hires to support scaling", completed: false },
      { id: "t86", number: 86, label: "ESOP Round 2",                  description: "Issue ESOP tranche 2 to key team members", completed: false },
      { id: "t87", number: 87, label: "Foundation Partnership",        description: "Formalise the partnership agreement with the nominated charity", completed: false },
      { id: "t88", number: 88, label: "Board Formation",               description: "Appoint an independent board with 2 non-executive directors", completed: false },
      { id: "t89", number: 89, label: "Series A Preparation",          description: "Prepare for Series A fundraising with updated financial model", completed: false },
      { id: "t90", number: 90, label: "Global Brand Expansion",        description: "Extend brand presence to 3 new international markets", completed: false },
    ],
  },
];

type VentureProgress = Record<string, Record<string, boolean>>;

function PhaseCard({
  phase,
  ventureId,
  progress,
  onToggle,
  locked,
}: {
  phase: PlaybookPhase;
  ventureId: string;
  progress: VentureProgress;
  onToggle: (ventureId: string, taskId: string, phaseId: string, phaseTotalTasks: number, phaseNumber: number) => void;
  locked: boolean;
}) {
  const [expanded, setExpanded] = useState(phase.number === 1);
  const completedCount = phase.tasks.filter(t => progress[ventureId]?.[t.id]).length;
  const pct = Math.round((completedCount / phase.tasks.length) * 100);

  return (
    <div
      className="bg-white rounded-xl border shadow-sm overflow-hidden"
      style={{ borderColor: "#e5e7eb", borderTop: `3px solid ${locked ? "#e5e7eb" : phase.color}` }}
    >
      <div
        className="p-5 cursor-pointer flex items-center justify-between"
        onClick={() => !locked && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
            style={{ background: locked ? "#e5e7eb" : phase.color, fontFamily: "'Prompt', sans-serif" }}
          >
            {locked ? <Lock size={16} /> : phase.number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-bold text-base"
                style={{ fontFamily: "'Prompt', sans-serif", color: locked ? "#9ca3af" : "#1a2332" }}
              >
                {phase.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${phase.color}15`, color: phase.color, fontFamily: "'Nunito', sans-serif" }}
              >
                {phase.taskRange}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "#f3f4f6", color: "#6b7280", fontFamily: "'Nunito', sans-serif" }}
              >
                {phase.vrlStage}
              </span>
              {locked && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "#fef3c7", color: "#d97706", fontFamily: "'Nunito', sans-serif" }}
                >
                  Complete previous phase first
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: phase.color }}
                />
              </div>
              <span
                className="text-xs font-bold shrink-0"
                style={{ color: phase.color, fontFamily: "'Nunito', sans-serif" }}
              >
                {completedCount}/{phase.tasks.length} ({pct}%)
              </span>
            </div>
          </div>
        </div>
        {!locked && (
          expanded
            ? <ChevronUp size={16} className="text-gray-400 ml-3 shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 ml-3 shrink-0" />
        )}
      </div>

      {expanded && !locked && (
        <div className="border-t px-5 pb-5 pt-3 space-y-2" style={{ borderColor: "#f3f4f6" }}>
          {phase.tasks.map(task => {
            const done = !!progress[ventureId]?.[task.id];
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onToggle(ventureId, task.id, phase.id, phase.tasks.length, phase.number)}
              >
                {done
                  ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: phase.color }} />
                  : <Circle size={16} className="mt-0.5 shrink-0 text-gray-300" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold text-gray-400 shrink-0"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      {task.number}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: done ? phase.color : "#374151",
                        fontFamily: "'Nunito', sans-serif",
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.7 : 1,
                      }}
                    >
                      {task.label}
                    </span>
                  </div>
                  <p
                    className="text-xs text-gray-400 mt-0.5"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    {task.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlaybookProgress() {
  const [selectedVenture, setSelectedVenture] = useState("tone");
  const { playbookProgress, togglePlaybookTask, ventures } = useVentures();
  const phases = buildPhases();

  const progress = playbookProgress as VentureProgress;
  const venture = VENTURE_OPTIONS.find(v => v.id === selectedVenture)!;
  const ventureData = ventures.find(v => v.id === selectedVenture);

  const phaseCompletion = phases.map(phase => {
    const done = phase.tasks.filter(t => progress[selectedVenture]?.[t.id]).length;
    return { phase, done, pct: Math.round((done / phase.tasks.length) * 100) };
  });

  const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0);
  const totalDone = phases.reduce((acc, p) => acc + p.tasks.filter(t => progress[selectedVenture]?.[t.id]).length, 0);
  const overallPct = Math.round((totalDone / totalTasks) * 100);

  const currentPhaseIdx = phaseCompletion.findIndex(pc => pc.pct < 100);
  const currentPhase = currentPhaseIdx === -1 ? phases.length : currentPhaseIdx;

  const handleToggle = (ventureId: string, taskId: string, phaseId: string, phaseTotalTasks: number, phaseNumber: number) => {
    togglePlaybookTask(ventureId, taskId, phaseId, phaseTotalTasks, phaseNumber);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} style={{ color: "#51AF37" }} />
              <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>EcoBlend Playbook</span>
            </div>
            <h1 className="vos-page-title mb-1">Playbook Progress Tracker</h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Completing a phase automatically advances the venture's VRL stage on the Portfolio Dashboard.
            </p>
          </div>
          {ventureData && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
              <Zap size={13} style={{ color: "#51AF37" }} />
              <span className="text-xs font-bold" style={{ color: "#166534" }}>Live VRL: Stage {ventureData.vrl} — auto-synced</span>
            </div>
          )}
        </div>

        {/* Venture selector */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {VENTURE_OPTIONS.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVenture(v.id)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: selectedVenture === v.id ? `${v.color}15` : "#f3f4f6",
                color: selectedVenture === v.id ? v.color : "#6b7280",
                border: `2px solid ${selectedVenture === v.id ? `${v.color}50` : "#e5e7eb"}`,
                fontFamily: "'Prompt', sans-serif",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Overall progress */}
        <div className="bg-white rounded-2xl border p-6 mb-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "'Prompt', sans-serif", color: "#1a2332" }}
              >
                {venture.label} — Overall Playbook Progress
              </h2>
              <p className="text-sm text-gray-400 mt-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {totalDone} of {totalTasks} tasks completed · Currently in Phase {currentPhase + 1}: {phases[Math.min(currentPhase, phases.length - 1)]?.label}
              </p>
            </div>
            <div
              className="text-4xl font-bold"
              style={{ color: venture.color, fontFamily: "'Prompt', sans-serif" }}
            >
              {overallPct}%
            </div>
          </div>

          {/* Phase progress bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {phaseCompletion.map(({ phase, done, pct }) => (
              <div key={phase.id} className="text-center">
                <div
                  className="text-xs font-bold mb-1"
                  style={{ color: phase.color, fontFamily: "'Nunito', sans-serif" }}
                >
                  {phase.label}
                </div>
                <div className="relative w-16 h-16 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9"
                      fill="none"
                      stroke={phase.color}
                      strokeWidth="3"
                      strokeDasharray={`${pct} ${100 - pct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                    style={{ color: phase.color, fontFamily: "'Prompt', sans-serif" }}
                  >
                    {pct}%
                  </div>
                </div>
                <div
                  className="text-xs text-gray-400 mt-1"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  {done}/{phase.tasks.length}
                </div>
              </div>
            ))}
          </div>

          {/* Overall bar */}
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: `linear-gradient(90deg, #51AF37, #3A97D3, #F49C13, #9333ea)` }}
            />
          </div>
        </div>

        {/* Phase cards */}
        <div className="space-y-4">
          {phases.map((phase, idx) => {
            const prevPhaseDone = idx === 0 ? true : phaseCompletion[idx - 1].pct === 100;
            return (
              <PhaseCard
                key={phase.id}
                phase={phase}
                ventureId={selectedVenture}
                progress={progress}
                onToggle={handleToggle}
                locked={!prevPhaseDone}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
