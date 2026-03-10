// ============================================================
// ECORACE STUDIO — VBS Portfolio Data Model
// Platform: EcoRace Studio (parent company)
// R&D Lab:  EcoBlend R&D (internal, not a portfolio brand)
// Portfolio Brands: EcoBlend · BEBUS · TONE · REAL · PIPE
// VRL: Venture Readiness Level (Commercial Progress, 4 stages)
// TRL: Technology Readiness Level (Technical Progress, 9 levels)
// ============================================================

export type VentureChannel = "B2B" | "D2C" | "B2B2C";
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
  isInternalLab?: boolean; // true for EcoBlend R&D — not a portfolio brand
  logo?: string; // CDN URL for brand logo
  logoBg?: string; // CSS background colour for logo container (for dark-bg logos)
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
  // ── Internal Lab (not a portfolio brand — shown separately) ──────────────
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
    color: "#51AF37",
    logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-logo-transparent_e294197c.png",
    logoBg: "#f0fdf4",
    investmentReady: false,
    isInternalLab: true,
    description: "The internal R&D laboratory and IP engine of EcoRace Studio. Develops core material formulations, composite structures, and bio-based systems licensed to all portfolio brands. Manages TRL progression for all portfolio technologies. Not a commercial brand — operates as the innovation backbone of the studio.",
    bmc: "IP licensing fees from portfolio brands; R&D service contracts with external partners",
    mmc: "Technology access for social impact ventures; foundation-linked IP sharing",
    risks: [
      { domain: "Technical", level: "Medium", mitigation: "Staged TRL gate reviews with EcoBlend R&D team" },
      { domain: "IP", level: "Low", mitigation: "Centralised IP registry with field-of-use licence agreements" },
      { domain: "People", level: "Medium", mitigation: "Stipend + ESOP for key R&D talent" },
    ],
    milestones: [
      { label: "R&D Lab Established", completed: true, date: "Jan 2026" },
      { label: "First IP Asset Registered", completed: true, date: "Feb 2026" },
      { label: "TRL 5 Validation", completed: false, date: "Jun 2026" },
      { label: "First External Licence", completed: false, date: "Sep 2026" },
    ],
  },

  // ── Portfolio Brand 1: EcoBlend ──────────────────────────────────────────
  {
    id: "ecoblend",
    name: "EcoBlend",
    tagline: "Advanced Materials Formulation & Distribution",
    sector: "Materials Science / Green Chemistry",
    channel: "B2B",
    status: "Active",
    vrl: 2,
    vrlPercent: 60,
    trl: 4,
    trlPercent: 70,
    nominatedCharity: "EcoRace Foundation",
    charityFocus: "Sustainable materials access for social enterprises",
    founder: "TBC — Founder Recruitment Open",
    color: "#51AF37",
    logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-logo-transparent_e294197c.png",
    logoBg: "#f0fdf4",
    investmentReady: false,
    description: "EcoBlend is the materials formulation and distribution brand of EcoRace Studio. It takes IP developed in the EcoBlend R&D lab and brings it to market as a Tier 1 ingredient brand — supplying bio-based, recycled, and high-performance material formulations to OEMs, manufacturers, and downstream portfolio brands. The 'blending' concept reflects the fusion of key performance matrices — mechanical, thermal, environmental, and social — into a single material solution.",
    bmc: "B2B material supply agreements; formulation licensing; technical consultancy for OEMs",
    mmc: "Sustainable materials access for social enterprises; circular economy enablement",
    risks: [
      { domain: "Technical", level: "Medium", mitigation: "R&D lab TRL gating before commercial release" },
      { domain: "Business", level: "Medium", mitigation: "Pilot supply agreement with one OEM before scale" },
      { domain: "Financial", level: "Low", mitigation: "Licensing revenue bridges to first supply contract" },
    ],
    milestones: [
      { label: "Formulation Portfolio Defined", completed: true, date: "Feb 2026" },
      { label: "First OEM Technical Meeting", completed: true, date: "Mar 2026" },
      { label: "Lab Validation (TRL 5)", completed: false, date: "Jun 2026" },
      { label: "First Supply Agreement Signed", completed: false, date: "Oct 2026" },
    ],
  },

  // ── Portfolio Brand 2: BEBUS ─────────────────────────────────────────────
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
    color: "#3A97D3",
    logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/bebus-logo-color_69330e6f.png",
    logoBg: "#f8fafc",
    investmentReady: false,
    description: "A Tier 1 ingredient brand supplying eco-transport OEMs with advanced material formulations, lightweight structures, and sustainable systems sourced from EcoBlend. Targets bus, coach, and rail manufacturers seeking to reduce Scope 3 emissions and Total Cost of Ownership through next-generation eco-composite materials.",
    bmc: "B2B supply agreements with OEMs; material formulation licences; technical consultancy",
    mmc: "Clean mobility access for underserved communities; Scope 3 emissions reduction",
    risks: [
      { domain: "Business", level: "Medium", mitigation: "Pilot agreement with one OEM before full commercial launch" },
      { domain: "Technical", level: "High", mitigation: "EcoBlend R&D to reach TRL 6 before OEM pilot" },
      { domain: "Financial", level: "Medium", mitigation: "VBS stipend bridges founder to first revenue" },
      { domain: "Marketing", level: "Low", mitigation: "VBS ingredient brand strategy; OEM co-branding" },
    ],
    milestones: [
      { label: "Market Research Complete", completed: true, date: "Feb 2026" },
      { label: "First OEM Interview", completed: true, date: "Mar 2026" },
      { label: "Proof of Concept (TRL 3)", completed: false, date: "May 2026" },
      { label: "OEM Pilot Agreement", completed: false, date: "Sep 2026" },
    ],
  },

  // ── Portfolio Brand 3: TONE ──────────────────────────────────────────────
  {
    id: "tone",
    name: "TONE",
    tagline: "Eco-Creative Industry Brand",
    sector: "Creative Industries / Sustainable Arts",
    channel: "D2C",
    status: "Active",
    vrl: 1,
    vrlPercent: 90,
    trl: 2,
    trlPercent: 50,
    nominatedCharity: "Arts Access Alliance",
    charityFocus: "Arts and cultural inclusion for disadvantaged youth",
    founder: "TBC — Founder Recruitment Open",
    color: "#F49C13",
    logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/tone-logo-white_776e4b22.png",
    logoBg: "#1a1a1a",
    investmentReady: false,
    description: "TONE is an eco-creative industry brand delivering sustainable products and solutions to the creative sector — spanning music, film, fashion, and design. It serves environmentally conscious creatives who refuse to compromise on performance or aesthetic. TONE leverages EcoBlend material formulations to produce sustainable creative tools, equipment, and accessories, establishing a new standard for eco-performance in the creative industries.",
    bmc: "D2C product sales; creative subscription model; eco-certification licensing to creative studios",
    mmc: "Arts access for disadvantaged youth; cultural inclusion through sustainable creative tools",
    risks: [
      { domain: "Business", level: "Medium", mitigation: "D2C validation via 50 creative industry interviews before product launch" },
      { domain: "Marketing", level: "High", mitigation: "VBS brand strategy; influencer and creative community seeding" },
      { domain: "Investment", level: "Medium", mitigation: "VBS stipend; B Corp accreditation for ESG investors" },
    ],
    milestones: [
      { label: "BMC / MMC Drafted", completed: true, date: "Feb 2026" },
      { label: "50 Creative Industry Interviews", completed: false, date: "Apr 2026" },
      { label: "Product MVP Launch", completed: false, date: "Jul 2026" },
      { label: "First 100 Customers", completed: false, date: "Sep 2026" },
    ],
  },

  // ── Portfolio Brand 4: REAL ──────────────────────────────────────────────
  {
    id: "real",
    name: "REAL",
    tagline: "Sports Protection — F1 Science for the Person",
    sector: "Sports Protection / Performance Tech",
    channel: "D2C",
    status: "Pre-Launch",
    vrl: 1,
    vrlPercent: 55,
    trl: 2,
    trlPercent: 20,
    nominatedCharity: "Sport for All Foundation",
    charityFocus: "Sport participation and youth wellbeing",
    founder: "TBC — Founder Recruitment Open",
    color: "#ef4444",
    logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/real-logo_08dd9e45.png",
    logoBg: "#111111",
    investmentReady: false,
    description: "REAL is a sports protection brand that applies Formula 1 materials science and engineering principles to protect the everyday athlete. Drawing on the same advanced composite and energy-absorption technologies used in F1 safety systems, REAL delivers next-generation protective equipment — helmets, body armour, and impact gear — for cyclists, skaters, climbers, and team sports players. Sustainable by design, high-performance by science.",
    bmc: "D2C product sales; performance certification; athlete ambassador programme; B2B supply to sports federations",
    mmc: "Sport participation for underserved youth; injury prevention and wellbeing through physical activity",
    risks: [
      { domain: "Technical", level: "High", mitigation: "EcoBlend R&D to validate material performance at TRL 5 before launch" },
      { domain: "Regulatory", level: "High", mitigation: "CE/EN safety certification pathway mapped from TRL 4 onwards" },
      { domain: "Business", level: "Medium", mitigation: "D2C validation via athlete focus groups and sports federation pilots" },
      { domain: "People", level: "Low", mitigation: "VBS stipend for founder; ESOP for early team" },
    ],
    milestones: [
      { label: "Sector Research Complete", completed: true, date: "Mar 2026" },
      { label: "Athlete Interviews (25)", completed: false, date: "May 2026" },
      { label: "Material Prototype (TRL 3)", completed: false, date: "Aug 2026" },
      { label: "CE Certification Pathway Defined", completed: false, date: "Oct 2026" },
      { label: "Product MVP Launch", completed: false, date: "Dec 2026" },
    ],
  },

  // ── Portfolio Brand 5: PIPE ──────────────────────────────────────────────
  {
    id: "pipe",
    name: "PIPE",
    tagline: "Eco-Water Sport & Performance Brand",
    sector: "Water Sports / Outdoor Performance",
    channel: "D2C",
    status: "Pre-Launch",
    vrl: 1,
    vrlPercent: 30,
    trl: 1,
    trlPercent: 70,
    nominatedCharity: "Ocean Conservation Trust",
    charityFocus: "Ocean health, coastal community access to water sports",
    founder: "TBC — Founder Recruitment Open",
    color: "#0ea5e9",
    logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/pipe-logo-new_2ab35b8c.png",
    logoBg: "#0f172a",
    investmentReady: false,
    description: "PIPE is an eco-water sport and performance brand delivering sustainable, high-performance equipment and apparel for surfers, paddlers, swimmers, and open-water athletes. Named after the legendary Banzai Pipeline surf break, PIPE embodies the raw power and flow of water — channelled through EcoBlend's advanced material formulations into boards, wetsuits, paddles, and performance gear that are as kind to the ocean as they are to the athlete. PIPE's mission is to make water sports accessible, sustainable, and performance-driven for the next generation.",
    bmc: "D2C product sales; performance gear subscription; eco-certification; B2B supply to surf schools and water sport centres",
    mmc: "Ocean health and coastal community access; water sport participation for underserved youth",
    risks: [
      { domain: "Technical", level: "Medium", mitigation: "EcoBlend R&D to validate water-resistant and UV-stable formulations at TRL 4" },
      { domain: "Business", level: "High", mitigation: "D2C validation via 50 water sport athlete interviews before product development" },
      { domain: "Environmental", level: "Low", mitigation: "Full lifecycle assessment from materials sourcing to end-of-life recycling" },
      { domain: "Marketing", level: "Medium", mitigation: "Surf and water sport community seeding; ambassador programme with pro athletes" },
    ],
    milestones: [
      { label: "Brand Concept Defined", completed: true, date: "Mar 2026" },
      { label: "Water Sport Market Research", completed: false, date: "Apr 2026" },
      { label: "50 Athlete Interviews", completed: false, date: "Jun 2026" },
      { label: "Material Formulation (Water-Resistant TRL 3)", completed: false, date: "Sep 2026" },
      { label: "Product MVP Launch", completed: false, date: "Feb 2027" },
    ],
  },
];

// ── Derived portfolio stats (excludes internal lab) ──────────────────────────
export const portfolioBrands = ventures.filter(v => !v.isInternalLab);

export const portfolioStats = {
  totalVentures: portfolioBrands.length,
  activeVentures: portfolioBrands.filter(v => v.status === "Active").length,
  avgVrl: portfolioBrands.reduce((a, v) => a + v.vrl, 0) / portfolioBrands.length,
  avgTrl: portfolioBrands.reduce((a, v) => a + v.trl, 0) / portfolioBrands.length,
  investmentReadyCount: portfolioBrands.filter(v => v.investmentReady).length,
  totalMilestonesCompleted: ventures.reduce((acc, v) => acc + v.milestones.filter(m => m.completed).length, 0),
  totalMilestones: ventures.reduce((acc, v) => acc + v.milestones.length, 0),
};
