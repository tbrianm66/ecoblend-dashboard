// ============================================================
// ECOBLEND PLAYBOOK PROGRESS
// DB-backed: trpc.brl.getCompletions + trpc.brl.toggleTask
// Brand: EcoBlend — Green #56A837, Blue #3B85BA, Orange #F69111
// Typography: Prompt (headings) + Nunito (body)
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { BookOpen, CheckCircle2, Circle, ChevronDown, ChevronUp, Lock, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const VENTURE_OPTIONS = [
  { id: "ecoblend-rd", label: "EcoRace", color: "#56A837" },
  { id: "bebus",       label: "BEBUS",   color: "#3B85BA" },
  { id: "tone",        label: "TONE",    color: "#F69111" },
  { id: "real",        label: "REAL",    color: "#F2BB05" },
];

interface PlaybookTask {
  id: string;
  number: number;
  label: string;
  description: string;
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
    color: "#56A837",
    tasks: [
      { id: "t1",  number: 1,  label: "Supply & Demand Analysis",           description: "Identify the core supply and demand dynamics in your target market" },
      { id: "t2",  number: 2,  label: "Market Research",                    description: "Conduct primary and secondary market research to size the opportunity" },
      { id: "t3",  number: 3,  label: "Competitor Landscape",               description: "Map direct and indirect competitors; identify white space" },
      { id: "t4",  number: 4,  label: "Key Pains, Gains & Jobs-to-be-Done", description: "Define the top 3 customer pains, gains, and jobs using the Value Proposition Canvas" },
      { id: "t5",  number: 5,  label: "Value Propositions",                 description: "Draft 3 distinct value propositions aligned to customer jobs" },
      { id: "t6",  number: 6,  label: "Business Model Status",              description: "Complete the Business Model Canvas (BMC) first draft" },
      { id: "t7",  number: 7,  label: "Mission Model Canvas (MMC)",         description: "Complete the Mission Model Canvas for the nominated charity alignment" },
      { id: "t8",  number: 8,  label: "Revenue Streams",                    description: "Identify and validate at least 2 revenue streams with pricing assumptions" },
      { id: "t9",  number: 9,  label: "Ecosystem of Tools",                 description: "Select and set up the core tools for operations, comms, and finance" },
      { id: "t10", number: 10, label: "Feasibility Assessment",             description: "Complete a structured feasibility assessment across market, technical, and financial dimensions" },
      { id: "t11", number: 11, label: "Budgeting Basics",                   description: "Build a 12-month budget with key assumptions documented" },
      { id: "t12", number: 12, label: "Customer Validation (Initial)",      description: "Conduct 5 problem interviews to validate the core pain hypothesis" },
      { id: "t13", number: 13, label: "Business Functions Overview",        description: "Define the 6 core business functions and assign ownership" },
      { id: "t14", number: 14, label: "Marketing Crash Course",             description: "Complete the VBS marketing fundamentals module" },
      { id: "t15", number: 15, label: "Sales Crash Course",                 description: "Complete the VBS sales fundamentals module" },
      { id: "t16", number: 16, label: "Operations Crash Course",            description: "Complete the VBS operations fundamentals module" },
      { id: "t17", number: 17, label: "Finance Crash Course",               description: "Complete the VBS finance fundamentals module" },
    ],
  },
  {
    id: "kickoff",
    number: 2,
    label: "Kickoff",
    taskRange: "Tasks 18–43",
    vrlStage: "VRL 2",
    color: "#3B85BA",
    tasks: [
      { id: "t18", number: 18, label: "Evaluate Problems & Trends",          description: "Identify the top 3 macro trends driving the problem space" },
      { id: "t19", number: 19, label: "Identify Your MVPs",                  description: "Define the Minimum Viable Product for each identified solution" },
      { id: "t20", number: 20, label: "Apply the 10 Types of Innovation",    description: "Map your innovation across the 10 types framework" },
      { id: "t21", number: 21, label: "Examine Sustainability",              description: "Define the environmental and social sustainability commitments" },
      { id: "t22", number: 22, label: "End-State Vision & USPs",             description: "Write a 3-year end-state vision and 3 Unique Selling Propositions" },
      { id: "t23", number: 23, label: "Create/State Value Proposition",      description: "Finalise the value proposition statement for each customer segment" },
      { id: "t24", number: 24, label: "Research Unfair Advantages",          description: "Identify your top 3 unfair advantages (IP, network, expertise)" },
      { id: "t25", number: 25, label: "Plan Mission",                        description: "Define the mission statement and link it to the nominated charity" },
      { id: "t26", number: 26, label: "Implement Outcome Learning",          description: "Set up a learning loop with weekly outcome reviews" },
      { id: "t27", number: 27, label: "Create Business Plan",                description: "Complete a 10-page business plan covering all 6 business functions" },
      { id: "t28", number: 28, label: "Begin Budgeting",                     description: "Build a detailed 24-month financial model with 3 scenarios" },
      { id: "t29", number: 29, label: "Streamline Area",                     description: "Identify and eliminate the top 3 operational bottlenecks" },
      { id: "t30", number: 30, label: "Define the Customer",                 description: "Build 2 detailed customer personas with Jobs-to-be-Done" },
      { id: "t31", number: 31, label: "Define Methodology for Customer Outreach", description: "Select and document the customer outreach methodology" },
      { id: "t32", number: 32, label: "Define Method for Customer Outreach", description: "Build the customer outreach sequence and scripts" },
      { id: "t33", number: 33, label: "Assemble Focus Group",                description: "Recruit and run a 6-person focus group for the core hypothesis" },
      { id: "t34", number: 34, label: "Roadmap to Product/Service or 'MVP'", description: "Build a 6-month product/service roadmap with milestones" },
      { id: "t35", number: 35, label: "Define Brand",                        description: "Complete the brand identity brief (name, logo, colours, tone of voice)" },
      { id: "t36", number: 36, label: "Establish Brand Identity",            description: "Produce brand guidelines document and asset library" },
      { id: "t37", number: 37, label: "Map Out Lean on Opportunities",       description: "Identify 5 quick-win opportunities to validate in the next 30 days" },
      { id: "t38", number: 38, label: "Address Legal Structure",             description: "Select and register the legal structure (CIC, Ltd, etc.)" },
      { id: "t39", number: 39, label: "Secure Legal Obligations",            description: "Complete IP registration, ESOP agreements, and founder agreements" },
      { id: "t40", number: 40, label: "Select Payment Service",              description: "Integrate a payment gateway and test the full purchase flow" },
      { id: "t41", number: 41, label: "Register Trademark",                  description: "File trademark application for the brand name and logo" },
      { id: "t42", number: 42, label: "Register Domain",                     description: "Secure the primary domain and set up professional email" },
      { id: "t43", number: 43, label: "Set Up Accounting",                   description: "Set up accounting software and chart of accounts" },
    ],
  },
  {
    id: "go-to-market",
    number: 3,
    label: "Go-to-Market",
    taskRange: "Tasks 44–75",
    vrlStage: "VRL 3",
    color: "#F69111",
    tasks: [
      { id: "t44", number: 44, label: "Design Operating Model",              description: "Document the end-to-end operating model and key processes" },
      { id: "t45", number: 45, label: "Set Up Business Insurance",           description: "Obtain appropriate business insurance coverage" },
      { id: "t46", number: 46, label: "Define Metrics for Evaluating Value", description: "Define the 5 core KPIs that measure value delivery" },
      { id: "t47", number: 47, label: "Research Tools & Partners",           description: "Identify and onboard the 3 key technology partners" },
      { id: "t48", number: 48, label: "Build Leads Funnel",                  description: "Build and test the full leads acquisition funnel" },
      { id: "t49", number: 49, label: "Organise Sales Training",             description: "Complete the VBS advanced sales training module" },
      { id: "t50", number: 50, label: "Map Up Customer Care",                description: "Define the customer care process and set up support channels" },
      { id: "t51", number: 51, label: "Consider Sales Funnel",               description: "Optimise the sales funnel based on first customer data" },
      { id: "t52", number: 52, label: "Reporting",                           description: "Set up weekly and monthly reporting cadence with dashboards" },
      { id: "t53", number: 53, label: "Define Metrics for Surveys",          description: "Build NPS and CSAT survey templates and automate delivery" },
      { id: "t54", number: 54, label: "Apply Mobile, Desktop and Mobile Reports", description: "Ensure all reporting is accessible on mobile and desktop" },
      { id: "t55", number: 55, label: "Establish Processes for Legal Reporting", description: "Set up compliance and legal reporting processes" },
      { id: "t56", number: 56, label: "Drive Test Around Conditions",        description: "Run A/B tests on the top 3 conversion points" },
      { id: "t57", number: 57, label: "Flexible Test Conditions",            description: "Build a test-and-learn framework for continuous improvement" },
      { id: "t58", number: 58, label: "Develop Customer Campaigns",          description: "Launch the first 3 customer acquisition campaigns" },
      { id: "t59", number: 59, label: "Marketing",                           description: "Execute the full marketing strategy across all channels" },
      { id: "t60", number: 60, label: "Activate Rights-Based Approach",      description: "Implement the social impact rights-based approach in operations" },
      { id: "t61", number: 61, label: "Analyse Acquisition Metrics",         description: "Review and optimise CAC, LTV, and payback period" },
      { id: "t62", number: 62, label: "Law",                                 description: "Complete annual legal compliance review" },
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
      { id: "t76", number: 76, label: "Investment Readiness",     description: "Complete the investment readiness checklist and pitch deck" },
      { id: "t77", number: 77, label: "Investor Outreach",        description: "Identify and contact 20 target investors" },
      { id: "t78", number: 78, label: "Due Diligence Preparation", description: "Prepare the full due diligence data room" },
      { id: "t79", number: 79, label: "Term Sheet Negotiation",   description: "Negotiate and agree term sheet with lead investor" },
      { id: "t80", number: 80, label: "B Corp Assessment",        description: "Complete the B Impact Assessment and submit for B Corp certification" },
      { id: "t81", number: 81, label: "ISO 14001 Application",    description: "Initiate ISO 14001 Environmental Management System certification" },
      { id: "t82", number: 82, label: "Global IP Licensing",      description: "Identify and approach 3 values-aligned global licensing partners" },
      { id: "t83", number: 83, label: "International Market Entry", description: "Select the first international market and build entry strategy" },
      { id: "t84", number: 84, label: "Scale Operations",         description: "Build the operational playbook for scaling to 10x current capacity" },
      { id: "t85", number: 85, label: "Build Senior Team",        description: "Recruit 3 senior hires to support scaling" },
      { id: "t86", number: 86, label: "ESOP Round 2",             description: "Issue ESOP tranche 2 to key team members" },
      { id: "t87", number: 87, label: "Foundation Partnership",   description: "Formalise the partnership agreement with the nominated charity" },
      { id: "t88", number: 88, label: "Board Formation",          description: "Appoint an independent board with 2 non-executive directors" },
      { id: "t89", number: 89, label: "Series A Preparation",     description: "Prepare for Series A fundraising with updated financial model" },
      { id: "t90", number: 90, label: "Global Brand Expansion",   description: "Extend brand presence to 3 new international markets" },
    ],
  },
];

// Map task id (t1, t2 …) → taskNumber (1, 2 …) for DB calls
function taskIdToNumber(id: string): number {
  return parseInt(id.replace("t", ""), 10);
}

function PhaseCard({
  phase,
  completedSet,
  onToggle,
  locked,
  isPending,
}: {
  phase: PlaybookPhase;
  completedSet: Set<number>;
  onToggle: (taskNumber: number, currentlyDone: boolean) => void;
  locked: boolean;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(phase.number === 1);
  const completedCount = phase.tasks.filter(t => completedSet.has(taskIdToNumber(t.id))).length;
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
              <span className="font-bold text-base" style={{ fontFamily: "'Prompt', sans-serif", color: locked ? "#9ca3af" : "#1a2332" }}>
                {phase.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${phase.color}15`, color: phase.color }}>
                {phase.taskRange}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                {phase.vrlStage}
              </span>
              {locked && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#d97706" }}>
                  Complete previous phase first
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: phase.color }} />
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color: phase.color }}>
                {completedCount}/{phase.tasks.length} ({pct}%)
              </span>
            </div>
          </div>
        </div>
        {!locked && (expanded ? <ChevronUp size={16} className="text-gray-400 ml-3 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 ml-3 shrink-0" />)}
      </div>

      {expanded && !locked && (
        <div className="border-t px-5 pb-5 pt-3 space-y-2" style={{ borderColor: "#f3f4f6" }}>
          {phase.tasks.map(task => {
            const taskNum = taskIdToNumber(task.id);
            const done = completedSet.has(taskNum);
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => !isPending && onToggle(taskNum, done)}
              >
                {done
                  ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: phase.color }} />
                  : <Circle size={16} className="mt-0.5 shrink-0 text-gray-300" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 shrink-0">{task.number}</span>
                    <span className="text-sm font-semibold" style={{ color: done ? phase.color : "#374151", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>
                      {task.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
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
  const { ventures } = useVentures();
  const phases = useMemo(() => buildPhases(), []);

  const utils = trpc.useUtils();

  // DB-backed completions for selected venture
  const { data: completionsRaw, isLoading } = trpc.brl.getCompletions.useQuery(
    { ventureId: selectedVenture },
    { enabled: !!selectedVenture }
  );

  // Build a set of completed task numbers for fast lookup
  const completedSet = useMemo<Set<number>>(() => {
    if (!completionsRaw) return new Set();
    return new Set(
      (completionsRaw as any[])
        .filter((c: any) => c.completed)
        .map((c: any) => c.taskId)
    );
  }, [completionsRaw]);

  const toggleTask = trpc.brl.toggleTask.useMutation({
    onMutate: async ({ taskId, completed }) => {
      // Optimistic update
      await utils.brl.getCompletions.cancel({ ventureId: selectedVenture });
      const prev = utils.brl.getCompletions.getData({ ventureId: selectedVenture });
      utils.brl.getCompletions.setData({ ventureId: selectedVenture }, (old: any) => {
        if (!old) return old;
        const existing = old.find((c: any) => c.taskId === taskId);
        if (existing) {
          return old.map((c: any) => c.taskId === taskId ? { ...c, completed } : c);
        }
        return [...old, { taskId, completed, ventureId: selectedVenture }];
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.brl.getCompletions.setData({ ventureId: selectedVenture }, ctx.prev);
      toast.error("Failed to update task");
    },
    onSettled: () => {
      utils.brl.getCompletions.invalidate({ ventureId: selectedVenture });
    },
  });

  const handleToggle = (taskNumber: number, currentlyDone: boolean) => {
    toggleTask.mutate({ ventureId: selectedVenture, taskId: taskNumber, completed: !currentlyDone });
  };

  const venture = VENTURE_OPTIONS.find(v => v.id === selectedVenture)!;
  const ventureData = ventures.find(v => v.id === selectedVenture);

  const phaseCompletion = phases.map(phase => {
    const done = phase.tasks.filter(t => completedSet.has(taskIdToNumber(t.id))).length;
    return { phase, done, pct: Math.round((done / phase.tasks.length) * 100) };
  });

  const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0);
  const totalDone = phases.reduce((acc, p) => acc + p.tasks.filter(t => completedSet.has(taskIdToNumber(t.id))).length, 0);
  const overallPct = Math.round((totalDone / totalTasks) * 100);

  const currentPhaseIdx = phaseCompletion.findIndex(pc => pc.pct < 100);
  const currentPhase = currentPhaseIdx === -1 ? phases.length : currentPhaseIdx;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} style={{ color: "#56A837" }} />
              <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>EcoBlend Playbook</span>
            </div>
            <h1 className="vos-page-title mb-1">Playbook Progress Tracker</h1>
            <p className="text-sm text-gray-500">
              Task completions are persisted to the database per venture. Completing a phase advances the venture's VRL stage.
            </p>
          </div>
          {ventureData && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
              <Zap size={13} style={{ color: "#56A837" }} />
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
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : (
          <>
            {/* Overall progress */}
            <div className="bg-white rounded-2xl border p-6 mb-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: "'Prompt', sans-serif", color: "#1a2332" }}>
                    {venture.label} — Overall Playbook Progress
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {totalDone} of {totalTasks} tasks completed · Currently in Phase {currentPhase + 1}: {phases[Math.min(currentPhase, phases.length - 1)]?.label}
                  </p>
                </div>
                <div className="text-4xl font-bold" style={{ color: venture.color, fontFamily: "'Prompt', sans-serif" }}>
                  {overallPct}%
                </div>
              </div>

              {/* Phase progress circles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {phaseCompletion.map(({ phase, done, pct }) => (
                  <div key={phase.id} className="text-center">
                    <div className="text-xs font-bold mb-1" style={{ color: phase.color }}>
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
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: phase.color }}>
                        {pct}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{done}/{phase.tasks.length}</div>
                  </div>
                ))}
              </div>

              {/* Overall bar */}
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${overallPct}%`, background: "linear-gradient(90deg, #56A837, #3B85BA, #F69111, #9333ea)" }}
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
                    completedSet={completedSet}
                    onToggle={handleToggle}
                    locked={!prevPhaseDone}
                    isPending={toggleTask.isPending}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
