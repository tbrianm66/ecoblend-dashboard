// ============================================================
// ECOBLEND VBS — Shared Data Model
// VRL: Venture Readiness Level (Commercial Progress, 4 stages)
// TRL: Technology Readiness Level (Technical Progress, 9 levels)
// ============================================================

export type VentureChannel = "B2B" | "D2C";
export type VentureStatus = "Active" | "Pre-Launch" | "Scaling" | "Paused";

export interface RiskItem {
  domain: string;
  level: "Low" | "Medium" | "High";
  mitigation: string;
}

export interface Milestone {
  label: string;
  completed: boolean;
  date?: string;
}

export interface Venture {
  id: string;
  name: string;
  tagline: string;
  sector: string;
  channel: VentureChannel;
  status: VentureStatus;
  vrl: number;        // 1–4
  vrlPercent: number; // % through current VRL stage
  trl: number;        // 1–9
  trlPercent: number; // % through current TRL level
  nominatedCharity: string;
  charityFocus: string;
  founder: string;
  color: string;      // brand accent colour
  risks: RiskItem[];
  milestones: Milestone[];
  description: string;
  investmentReady: boolean;
  bmc: string;
  mmc: string;
}

export const VRL_STAGES = [
  { id: 1, label: "Fundamentals", tasks: "Tasks 1–17", description: "Hypothesis defined, BMC/MMC drafted, market research complete" },
  { id: 2, label: "Kickoff", tasks: "Tasks 18–43", description: "Problem validated, beneficiary discovery complete, solution defined" },
  { id: 3, label: "Go-to-Market", tasks: "Tasks 44–75", description: "MVP launched, first customers acquired, revenue model proven" },
  { id: 4, label: "Scaling", tasks: "Tasks 76–100", description: "Revenue growth, investment raised, global expansion initiated" },
];

export const TRL_LEVELS = [
  { id: 1, label: "Basic Principles", description: "Scientific research begins; basic principles observed and reported" },
  { id: 2, label: "Technology Concept", description: "Technology concept and/or application formulated" },
  { id: 3, label: "Proof of Concept", description: "Analytical and experimental critical function and/or characteristic proof-of-concept" },
  { id: 4, label: "Lab Validation", description: "Technology validated in laboratory environment" },
  { id: 5, label: "Relevant Environment", description: "Technology validated in relevant environment (industrially relevant)" },
  { id: 6, label: "Prototype Demo", description: "Technology demonstrated in relevant environment (prototype demonstration)" },
  { id: 7, label: "System Prototype", description: "System prototype demonstration in operational environment" },
  { id: 8, label: "System Complete", description: "System complete and qualified; technology proven to work" },
  { id: 9, label: "Commercial Deployment", description: "Actual technology proven through successful deployment in operational setting" },
];

export const ANALYTICS_DOMAINS = [
  { id: "portfolio", label: "Portfolio Overview", icon: "LayoutDashboard" },
  { id: "vrl", label: "VRL Analytics", icon: "TrendingUp" },
  { id: "trl", label: "TRL Analytics", icon: "FlaskConical" },
  { id: "risk", label: "Risk Management", icon: "ShieldAlert" },
  { id: "investment", label: "Investment Readiness", icon: "DollarSign" },
  { id: "brand", label: "Brand Readiness", icon: "Layers" },
  { id: "ip", label: "IP Management", icon: "Lock" },
  { id: "people", label: "People & ESOP", icon: "Users" },
  { id: "marketing", label: "Marketing Strategy", icon: "Megaphone" },
  { id: "financial", label: "Financial Analytics", icon: "BarChart2" },
  { id: "bcorp", label: "B Corp & ISO", icon: "Award" },
  { id: "foundation", label: "Foundation Impact", icon: "Heart" },
];

export const ventures: Venture[] = [
  {
    id: "ecoblend-rd",
    name: "EcoBlend R&D",
    tagline: "Central IP & Technology Engine",
    sector: "Deep Tech / Materials Science",
    channel: "B2B",
    status: "Active",
    vrl: 2,
    vrlPercent: 75,
    trl: 4,
    trlPercent: 60,
    nominatedCharity: "EcoRace Foundation",
    charityFocus: "Vulnerable children & adults through technology",
    founder: "Internal VBS Team",
    color: "#22c55e",
    investmentReady: false,
    description: "The central R&D laboratory and IP engine of the EcoRace VBS. Develops core material formulations, structures, and systems licensed to all spin-off ventures. Manages TRL progression for all portfolio technologies.",
    bmc: "IP licensing fees from spin-offs; R&D service contracts with external partners",
    mmc: "Technology access for social impact ventures; foundation-linked IP sharing",
    risks: [
      { domain: "Technical", level: "Medium", mitigation: "Staged TRL gate reviews with EcoBlend R&D team" },
      { domain: "IP", level: "Low", mitigation: "Centralised IP registry with field-of-use licence agreements" },
      { domain: "People", level: "Medium", mitigation: "ZINC VC stipend + ESOP for key R&D talent" },
    ],
    milestones: [
      { label: "R&D Lab Established", completed: true, date: "Jan 2026" },
      { label: "First IP Asset Registered", completed: true, date: "Feb 2026" },
      { label: "TRL 5 Validation", completed: false, date: "Jun 2026" },
      { label: "First External Licence", completed: false, date: "Sep 2026" },
    ],
  },
  {
    id: "bebus",
    name: "BEBUS",
    tagline: "Eco-Transport Solutions",
    sector: "Sustainable Transport",
    channel: "B2B",
    status: "Active",
    vrl: 2,
    vrlPercent: 40,
    trl: 3,
    trlPercent: 80,
    nominatedCharity: "Clean Mobility Foundation",
    charityFocus: "Sustainable transport access for underserved communities",
    founder: "TBC — Founder Recruitment Open",
    color: "#0891b2",
    investmentReady: false,
    description: "A Tier 1 ingredient brand supplying eco-transport OEMs with advanced material formulations, lightweight structures, and sustainable systems. Targets bus, coach, and rail manufacturers seeking to reduce Scope 3 emissions and Total Cost of Ownership.",
    bmc: "B2B supply agreements with OEMs; material formulation licences; technical consultancy",
    mmc: "Clean mobility access for underserved communities; Scope 3 emissions reduction",
    risks: [
      { domain: "Business", level: "Medium", mitigation: "Pilot agreement with one OEM before full commercial launch" },
      { domain: "Technical", level: "High", mitigation: "EcoBlend R&D to reach TRL 6 before OEM pilot" },
      { domain: "Financial", level: "Medium", mitigation: "ZINC VC stipend bridges founder to first revenue" },
      { domain: "Marketing", level: "Low", mitigation: "VBS ingredient brand strategy; OEM co-branding" },
    ],
    milestones: [
      { label: "Market Research Complete", completed: true, date: "Feb 2026" },
      { label: "First OEM Interview", completed: true, date: "Mar 2026" },
      { label: "Proof of Concept (TRL 3)", completed: false, date: "May 2026" },
      { label: "OEM Pilot Agreement", completed: false, date: "Sep 2026" },
    ],
  },
  {
    id: "tone",
    name: "TONE",
    tagline: "Eco-Entertainment Industry Solutions",
    sector: "Entertainment / Creative Tech",
    channel: "D2C",
    status: "Active",
    vrl: 1,
    vrlPercent: 90,
    trl: 2,
    trlPercent: 50,
    nominatedCharity: "Arts Access Alliance",
    charityFocus: "Arts and cultural inclusion for disadvantaged youth",
    founder: "TBC — Founder Recruitment Open",
    color: "#7c3aed",
    investmentReady: false,
    description: "A D2C eco-entertainment brand delivering sustainable products and solutions to the entertainment industry. Targets environmentally conscious consumers who refuse to compromise on performance. TONE is the primary internal IP validation vehicle for the VBS platform MVP.",
    bmc: "D2C product sales; subscription model; eco-certification licensing",
    mmc: "Arts access for disadvantaged youth; cultural inclusion through sustainable entertainment",
    risks: [
      { domain: "Business", level: "Medium", mitigation: "D2C validation via 50 customer interviews before product launch" },
      { domain: "Marketing", level: "High", mitigation: "VBS brand strategy; ingredient brand co-marketing" },
      { domain: "Investment", level: "Medium", mitigation: "ZINC VC stipend; B Corp accreditation for ESG investors" },
    ],
    milestones: [
      { label: "BMC / MMC Drafted", completed: true, date: "Feb 2026" },
      { label: "50 Customer Interviews", completed: false, date: "Apr 2026" },
      { label: "Product MVP Launch", completed: false, date: "Jul 2026" },
      { label: "First 100 Customers", completed: false, date: "Sep 2026" },
    ],
  },
  {
    id: "real",
    name: "REAL",
    tagline: "Eco-Sports Protection Solutions",
    sector: "Sports / Performance Tech",
    channel: "D2C",
    status: "Pre-Launch",
    vrl: 1,
    vrlPercent: 55,
    trl: 2,
    trlPercent: 20,
    nominatedCharity: "Sport for All Foundation",
    charityFocus: "Sport participation and youth wellbeing",
    founder: "TBC — Founder Recruitment Open",
    color: "#dc2626",
    investmentReady: false,
    description: "A D2C eco-sports protection brand delivering high-performance, sustainable protective equipment. Targets athletes and sports consumers who demand both performance and environmental responsibility. Leverages EcoBlend material formulations for superior protection characteristics.",
    bmc: "D2C product sales; performance certification; athlete ambassador programme",
    mmc: "Sport participation for underserved youth; wellbeing through physical activity",
    risks: [
      { domain: "Technical", level: "High", mitigation: "EcoBlend R&D to validate material performance at TRL 5 before launch" },
      { domain: "Business", level: "Medium", mitigation: "D2C validation via athlete focus groups" },
      { domain: "People", level: "Low", mitigation: "ZINC VC stipend for founder; ESOP for early team" },
    ],
    milestones: [
      { label: "Sector Research Complete", completed: true, date: "Mar 2026" },
      { label: "Athlete Interviews (25)", completed: false, date: "May 2026" },
      { label: "Material Prototype (TRL 3)", completed: false, date: "Aug 2026" },
      { label: "Product MVP Launch", completed: false, date: "Dec 2026" },
    ],
  },
];

export const portfolioStats = {
  totalVentures: 4,
  activeVentures: 3,
  avgVrl: 1.75,
  avgTrl: 2.75,
  investmentReadyCount: 0,
  totalMilestonesCompleted: ventures.reduce((acc, v) => acc + v.milestones.filter(m => m.completed).length, 0),
  totalMilestones: ventures.reduce((acc, v) => acc + v.milestones.length, 0),
};
