/* ═══════════════════════════════════════════════════════════════
   ECOBLEND OS — MRL COMMAND DASHBOARD
   TypeScript Interfaces (BEBUS-MRL-DASH-001)
═══════════════════════════════════════════════════════════════ */

export interface VentureSummary {
  venture_id:  string;
  name:        string;
  sector:      string;
  stage:       string;
  trl_current: number;
  mrl_current: number;
  vrl_score:   number;
}

export interface CategorySummary {
  key:            string;
  score_S:        number;
  maturity_label: string;
  weight:         number;
  contribution:   number;
}

export interface HistoryPoint {
  period: string;
  trl:    number;
  mrl:    number;
}

export interface MRLStatusData {
  venture_id:      string;
  mrl_score:       number;
  mrl_level:       number;
  mrl_label:       string;
  trl:             number;
  mrl:             number;
  delta:           number;
  eta:             number;
  rho:             number;
  vrl:             number;
  gate_locked:     boolean;
  confidence_band: number;
  last_updated:    string;
  categories:      CategorySummary[];
  history:         HistoryPoint[];
}

export interface RiskItem {
  id:          string;
  category:    string;
  title:       string;
  probability: number;
  impact:      number;
  risk_score:  number;
  rag:         "red" | "amber" | "green";
  mitigation:  string;
}

export interface SupplierSummary {
  id:        string;
  name:      string;
  country:   string;
  city:      string;
  tier:      number;
  component: string;
  risk:      "red" | "amber" | "green";
  audit:     string;
  spend:     number;
  lead:      number;
}

export interface CostPoint {
  volume: number;
  cogs:   number;
  target: number;
}

export interface SustainabilityData {
  carbonIntensity: number;
  carbonTarget:    number;
  scope1:          number;
  scope2:          number;
  scope3:          number;
  socialRisk:      number;
  circularity:     number;
  waterIntensity:  number;
  lcaStatus:       string;
  esgGrade:        string;
}

export interface LiveFeedMessage {
  event:       string;
  venture_id:  string;
  mrl_score?:  number;
  mrl_level?:  number;
  vrl_score?:  number;
  delta?:      number;
  severity?:   string;
  timestamp:   string;
}

export type ViewName = "overview" | "risk" | "supply" | "cost" | "sustainability";
