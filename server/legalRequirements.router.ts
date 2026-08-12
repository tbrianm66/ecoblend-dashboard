/**
 * Legal Contract Requirements Router
 * Contract requirements and governance readiness tracker — not legal advice.
 * Covers 7 business layers, 81 contract types, 5 priority stages.
 */
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  legalContractRequirements,
  legalContractRecords,
  legalContractDependencies,
  charityPartnerships,
} from "../drizzle/schema";

// ── Seed data — full contract taxonomy ────────────────────────────────────────
type SeedItem = {
  name: string;
  description: string;
  businessLayer: string;
  category: string;
  categoryLabel: string;
  priorityStage: string;
  required: boolean;
  defaultRiskRating: string;
  missionLockRelevance: boolean;
  ipRelevance: boolean;
  dataRelevance: boolean;
  seisEisRelevance: boolean;
  charityRelevance: boolean;
  sortOrder: number;
};

const SEED_REQUIREMENTS: SeedItem[] = [
  // ── A: FHV / Holding Company Layer ─────────────────────────────────────────
  { name: "FHV Constitutional Documents", description: "Foundational constitutional documents establishing Future Humanity Ventures as the mission-lock holding company.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 1 },
  { name: "FHV Articles of Association", description: "Bespoke articles of association for FHV encoding the mission-lock, purpose provisions, and golden-share rights.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 2 },
  { name: "FHV Shareholders' Agreement", description: "Agreement governing shareholder rights, reserved matters, voting, and mission-protection provisions at the FHV level.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_2", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 3 },
  { name: "Golden Share / Mission Veto Instrument", description: "Legal instrument granting FHV a golden share or veto right over decisions that would compromise the group's mission.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_5", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 4 },
  { name: "Reserved Matters Schedule", description: "Schedule of decisions requiring FHV board approval or special shareholder consent, protecting mission integrity.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 5 },
  { name: "Board Mission Pledge", description: "Signed commitment by each FHV board member to uphold the group's mission and purpose-first governance principles.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_1", required: true, defaultRiskRating: "medium", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 6 },
  { name: "Steward Appointment and Removal Policy", description: "Policy governing how steward directors are appointed, their accountability, and the removal process.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_5", required: false, defaultRiskRating: "medium", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 7 },
  { name: "Mission Breach Enforcement Policy", description: "Policy defining what constitutes a mission breach, escalation procedures, and enforcement remedies available to FHV.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_5", required: false, defaultRiskRating: "high", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 8 },
  { name: "IP Ownership Policy", description: "Policy confirming FHV / EcoRACE Studio ownership of all core intellectual property and licensing rights across the group.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 9 },
  { name: "Beneficiary Funding Policy", description: "Policy defining how and when profits are directed to beneficiary groups, and the governance framework for disbursements.", businessLayer: "fhv", category: "A", categoryLabel: "FHV / Holding Company", priorityStage: "stage_5", required: false, defaultRiskRating: "medium", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 10 },

  // ── B: EcoRACE Studio Layer ─────────────────────────────────────────────────
  { name: "EcoRACE Studio Articles of Association", description: "Articles of association for EcoRACE Studio Ltd, incorporating FHV oversight provisions and mission-alignment obligations.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 11 },
  { name: "EcoRACE Shareholders' Agreement", description: "Shareholders' agreement for EcoRACE Studio Ltd covering investor rights, reserved matters, and FHV's protective provisions.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 12 },
  { name: "FHV–EcoRACE Governance Agreement", description: "Agreement between FHV and EcoRACE Studio governing oversight obligations, reporting duties, and mission-lock enforcement.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 13 },
  { name: "Studio Management Agreement", description: "Agreement governing how EcoRACE Studio manages each venture, including fees, services, and performance obligations.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 14 },
  { name: "Studio Royalty Framework", description: "Framework defining royalty rates and payment terms payable by SPV ventures to EcoRACE Studio for IP and OS access.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 15 },
  { name: "Intercompany Services Agreement", description: "Agreement governing the provision of services between FHV, EcoRACE Studio, EcoBLEND OS, and SPV entities on arm's-length terms.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 16 },
  { name: "Transfer Pricing / Cost-Sharing Policy", description: "Policy ensuring that intercompany charges are set at arm's length in compliance with HMRC transfer pricing requirements.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 17 },
  { name: "Board Terms of Reference", description: "Terms of reference for the EcoRACE Studio board, covering quorum, reserved matters, reporting, and delegated authorities.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 18 },
  { name: "Investor Reporting Policy", description: "Policy defining the frequency, format, and content of investor reports across EcoRACE Studio and its SPV portfolio.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 19 },
  { name: "Financial Promotion Compliance Memo", description: "Legal memo confirming compliance with FCA financial promotion rules before issuing any investor communications or materials.", businessLayer: "ecorace_studio", category: "B", categoryLabel: "EcoRACE Studio", priorityStage: "stage_2", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: true, charityRelevance: false, sortOrder: 20 },

  // ── C: EcoBLEND OS / IO Layer ───────────────────────────────────────────────
  { name: "EcoBLEND OS Licence Agreement", description: "Template licence agreement granting SPV ventures and authorised parties the right to use the EcoBLEND OS platform.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_2", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 21 },
  { name: "Data Contribution Agreement", description: "Agreement governing how ventures contribute data to the EcoBLEND OS, including ownership, permitted use, and anonymisation.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_2", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 22 },
  { name: "IP Assignment Agreement", description: "Agreement assigning all intellectual property created under EcoBLEND OS / EcoRACE Studio to the appropriate holding entity.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 23 },
  { name: "Trade Secret Protection Policy", description: "Policy governing the identification, classification, protection, and enforcement of trade secrets within the group.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 24 },
  { name: "Data Governance Policy", description: "Policy covering data classification, retention, access controls, and compliance with UK GDPR and DPA 2018.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 25 },
  { name: "Data Processing Agreement", description: "DPA compliant with UK GDPR Article 28, required before any data processing is carried out on behalf of ventures or partners.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_2", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 26 },
  { name: "AI Model Governance Policy", description: "Policy governing the use, training, validation, and ethical oversight of AI and LLM models within EcoBLEND OS.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_2", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 27 },
  { name: "Cybersecurity and Access-Control Policy", description: "Policy defining access tiers, authentication requirements, incident response, and data breach protocols for EcoBLEND OS.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 28 },
  { name: "Data Room Terms of Use", description: "Terms governing investor and partner access to the EcoBLEND OS data room, including confidentiality and permitted use.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_2", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 29 },
  { name: "Open-Source Software Policy", description: "Policy governing the use of open-source components within EcoBLEND OS, including licence compatibility and attribution.", businessLayer: "ecoblend_os", category: "C", categoryLabel: "EcoBLEND OS / IO", priorityStage: "stage_2", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 30 },

  // ── D: SPV Venture Layer ────────────────────────────────────────────────────
  { name: "SPV Articles of Association", description: "Bespoke articles for each SPV venture, incorporating FHV mission provisions, investor rights, and share class structure.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: true, charityRelevance: false, sortOrder: 31 },
  { name: "SPV Shareholders' Agreement", description: "Shareholders' agreement for each SPV covering investor rights, drag/tag, anti-dilution, and mission-protective reserved matters.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: true, charityRelevance: false, sortOrder: 32 },
  { name: "SPV Investment Agreement", description: "Investment agreement for each SPV fundraise, covering subscription terms, representations, conditions precedent, and warranties.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: true, charityRelevance: false, sortOrder: 33 },
  { name: "SEIS / EIS Advance Assurance Pack", description: "HMRC advance assurance application and supporting documents confirming SEIS / EIS eligibility for the SPV ahead of investment.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: true, charityRelevance: false, sortOrder: 34 },
  { name: "SPV OS Licence Agreement", description: "Licence agreement granting each SPV the right to access and use EcoBLEND OS during the venture lifecycle.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 35 },
  { name: "SPV IP Licence / Assignment Agreement", description: "Agreement licensing or assigning core technology IP from EcoRACE Studio to the SPV for commercialisation within a defined field of use.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 36 },
  { name: "Mission Covenant Deed", description: "Deed binding the SPV and its founders to the group's mission and preventing mission-compromising decisions without FHV consent.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 37 },
  { name: "Founder Vesting Agreement", description: "Vesting schedule for SPV founder equity, including cliff, reverse vesting, good/bad leaver provisions, and IP assignment on departure.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 38 },
  { name: "Investor Side Letter Template", description: "Template side letter for SPV investors covering information rights, observer seats, pro-rata, and other bespoke investor protections.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: true, charityRelevance: false, sortOrder: 39 },
  { name: "Subscription Agreement", description: "Subscription agreement for investors in each SPV round, documenting the number of shares, price, and subscription conditions.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: true, charityRelevance: false, sortOrder: 40 },
  { name: "Nominee Agreement", description: "Agreement where applicable for nominee shareholders holding shares on behalf of beneficial owners in SPV structures.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 41 },
  { name: "Exit Waterfall Model", description: "Legally reviewed model defining the order and quantum of distributions to shareholders, investors, and the mission fund on exit.", businessLayer: "spv", category: "D", categoryLabel: "SPV Ventures", priorityStage: "stage_3", required: true, defaultRiskRating: "high", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 42 },

  // ── E: R&D, University, Supplier and Partner Layer ──────────────────────────
  { name: "Mutual Non-Disclosure Agreement", description: "Mutual NDA protecting confidential information shared with external R&D partners, suppliers, universities, and evaluators.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 43 },
  { name: "Technical Evaluation Agreement", description: "Agreement governing the evaluation of EcoBlend technology by potential OEM, manufacturing, or research partners.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 44 },
  { name: "R&D Collaboration Agreement", description: "Agreement governing a joint R&D programme with an external partner, covering IP ownership, background IP, and foreground IP.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 45 },
  { name: "University Research Agreement", description: "Agreement with a university or research institution covering sponsored research, IP rights, publication restrictions, and student involvement.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: false, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 46 },
  { name: "Manufacturing Development Agreement", description: "Agreement with a contract manufacturer for the development and scale-up of production processes, covering tooling, IP, and exclusivity.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: false, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 47 },
  { name: "Supplier Onboarding Agreement", description: "Standard supplier agreement covering terms of supply, quality requirements, lead times, IP protection, and audit rights.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 48 },
  { name: "Quality Agreement", description: "Quality assurance agreement with manufacturing and supply partners defining acceptance criteria, inspection rights, and non-conformance procedures.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 49 },
  { name: "Design Services Agreement", description: "Agreement with external design agencies or engineers covering deliverables, IP ownership, revisions, and confidentiality.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 50 },
  { name: "Field Trial Agreement", description: "Agreement governing field trials of EcoBlend technology with a pilot customer or partner, covering liability, IP, and data ownership.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: false, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 51 },
  { name: "Materials Testing Agreement", description: "Agreement with a testing laboratory or accreditation body for materials characterisation, certification, and results ownership.", businessLayer: "rd_partner", category: "E", categoryLabel: "R&D / University / Partner", priorityStage: "stage_2", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 52 },

  // ── F: Employment, Consultant and Advisor Layer ─────────────────────────────
  { name: "Founder Service Agreement", description: "Service agreement for each founder covering duties, remuneration, IP assignment, confidentiality, and post-departure obligations.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 53 },
  { name: "Employee Contract", description: "Standard employment contract for permanent employees covering duties, pay, IP assignment, confidentiality, and notice periods.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 54 },
  { name: "Consultant Agreement", description: "Consultancy agreement for non-employed individuals, covering scope, fees, IP assignment, confidentiality, and IR35 compliance.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 55 },
  { name: "Advisor Agreement", description: "Advisor agreement covering advisory scope, meeting obligations, equity or fee compensation, confidentiality, and IP position.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_1", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 56 },
  { name: "EMI Option Scheme Documents", description: "HMRC-approved EMI option scheme documents enabling tax-efficient equity incentives for qualifying employees.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_2", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 57 },
  { name: "Contractor IP Assignment Deed", description: "Standalone deed assigning all work-product IP created by contractors and consultants to the employing group entity.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_1", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 58 },
  { name: "Confidentiality and Invention Assignment Agreement", description: "Agreement ensuring all personnel assign inventions and maintain confidentiality, supplementing employment/consultancy terms.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: true, dataRelevance: false, seisEisRelevance: false, charityRelevance: false, sortOrder: 59 },
  { name: "Contributor Access Policy", description: "Policy governing external contributor access to EcoBLEND OS, codebases, and proprietary systems, including scope limits and revocation.", businessLayer: "employment", category: "F", categoryLabel: "Employment / Consultants", priorityStage: "stage_1", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: true, seisEisRelevance: false, charityRelevance: false, sortOrder: 60 },

  // ── G: Charity / Beneficiary Engagement Layer ───────────────────────────────
  { name: "Board Resolution — Charitable Giving Policy", description: "Formal board resolution approving the group's charitable giving policy before any public claim of charitable donation is made.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: true, defaultRiskRating: "critical", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 61 },
  { name: "Charitable Giving Policy", description: "Policy defining the group's charitable giving commitments, eligible recipients, donation formula, and governance oversight.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: true, defaultRiskRating: "high", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 62 },
  { name: "Profit Definition Schedule", description: "Legally reviewed schedule defining 'distributable profit' for the purpose of charitable giving calculations, approved by auditors.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 63 },
  { name: "Charity Partnership MOU", description: "Memorandum of understanding with each nominated charity defining the relationship, donation basis, and co-branding principles.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: true, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 64 },
  { name: "Logo / Name Permission Letter", description: "Written permission from the charity to use its logo and name in marketing materials, required before any public claim is made.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: true, defaultRiskRating: "critical", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 65 },
  { name: "Cause-Related Marketing Terms", description: "Terms governing any cause-related marketing campaigns linking product sales to charitable donations.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: false, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 66 },
  { name: "Annual Donation Calculation Worksheet", description: "Auditor-reviewed worksheet calculating the annual charitable donation based on the profit definition schedule.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: true, defaultRiskRating: "medium", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 67 },
  { name: "Impact Reporting Template", description: "Template for annual impact reports to be co-published with charity partners, covering donation disbursement and beneficiary outcomes.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: true, defaultRiskRating: "low", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 68 },
  { name: "Grant-Making Policy", description: "Policy governing any direct grant-making to disability, SEND, or other beneficiary organisations, including eligibility and governance.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: false, defaultRiskRating: "medium", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 69 },
  { name: "Safeguarding Policy", description: "Policy ensuring appropriate safeguarding standards are in place where the group's activities involve beneficiaries or vulnerable groups.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_4", required: false, defaultRiskRating: "high", missionLockRelevance: false, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 70 },
  { name: "Foundation Pathway Memo", description: "Legal memo exploring the feasibility of establishing a foundation, CIC, or charitable trust as the long-term beneficiary vehicle.", businessLayer: "charity", category: "G", categoryLabel: "Charity / Beneficiary Engagement", priorityStage: "stage_5", required: false, defaultRiskRating: "medium", missionLockRelevance: true, ipRelevance: false, dataRelevance: false, seisEisRelevance: false, charityRelevance: true, sortOrder: 71 },
];

// ── Router ────────────────────────────────────────────────────────────────────
export const legalRequirementsRouter = router({

  // ── Requirements ─────────────────────────────────────────────────────────────

  requirements: router({
    list: publicProcedure
      .input(z.object({
        businessLayer:  z.string().optional(),
        category:       z.string().optional(),
        priorityStage:  z.string().optional(),
        required:       z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        const rows = await db
          .select()
          .from(legalContractRequirements)
          .orderBy(legalContractRequirements.sortOrder);
        return rows.filter((r) => {
          if (input?.businessLayer && r.businessLayer !== input.businessLayer) return false;
          if (input?.category && r.category !== input.category) return false;
          if (input?.priorityStage && r.priorityStage !== input.priorityStage) return false;
          if (input?.required !== undefined && r.required !== input.required) return false;
          return true;
        });
      }),

    seed: protectedProcedure.mutation(async () => {
      const db = await getDb();
      const existing = await db.select().from(legalContractRequirements).limit(1);
      if (existing.length > 0) return { seeded: false, count: existing.length };
      await db.insert(legalContractRequirements).values(SEED_REQUIREMENTS);
      return { seeded: true, count: SEED_REQUIREMENTS.length };
    }),

    reseed: protectedProcedure.mutation(async () => {
      const db = await getDb();
      await db.delete(legalContractRequirements);
      await db.insert(legalContractRequirements).values(SEED_REQUIREMENTS);
      return { seeded: true, count: SEED_REQUIREMENTS.length };
    }),
  }),

  // ── Records ──────────────────────────────────────────────────────────────────

  records: router({
    list: publicProcedure
      .input(z.object({
        requirementId: z.number().optional(),
        ventureId:     z.string().optional(),
        status:        z.string().optional(),
        riskRating:    z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        const rows = await db
          .select()
          .from(legalContractRecords)
          .orderBy(desc(legalContractRecords.createdAt));
        return rows.filter((r) => {
          if (input?.requirementId && r.requirementId !== input.requirementId) return false;
          if (input?.ventureId && r.ventureId !== input.ventureId) return false;
          if (input?.status && r.status !== input.status) return false;
          if (input?.riskRating && r.riskRating !== input.riskRating) return false;
          return true;
        });
      }),

    upsert: protectedProcedure
      .input(z.object({
        id:                    z.number().optional(),
        requirementId:         z.number(),
        ventureId:             z.string().optional(),
        entityName:            z.string().optional(),
        counterpartyName:      z.string().optional(),
        legalAdviser:          z.string().optional(),
        owner:                 z.string().optional(),
        approvalAuthority:     z.string().optional(),
        status:                z.string().optional(),
        riskRating:            z.string().optional(),
        priority:              z.string().optional(),
        executionDate:         z.string().optional(),
        renewalDate:           z.string().optional(),
        expiryDate:            z.string().optional(),
        reviewDate:            z.string().optional(),
        documentUrl:           z.string().optional(),
        notes:                 z.string().optional(),
        nextAction:            z.string().optional(),
        reservedMatterTrigger: z.boolean().optional(),
        solicitorReviewStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...body } = input;
        const values = {
          ...body,
          executionDate: body.executionDate || null,
          renewalDate:   body.renewalDate   || null,
          expiryDate:    body.expiryDate    || null,
          reviewDate:    body.reviewDate    || null,
          updatedAt:     new Date(),
        };
        if (id) {
          const updated = await db
            .update(legalContractRecords)
            .set(values)
            .where(eq(legalContractRecords.id, id))
            .returning();
          return updated[0];
        }
        const inserted = await db
          .insert(legalContractRecords)
          .values(values)
          .returning();
        return inserted[0];
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(legalContractRecords).where(eq(legalContractRecords.id, input.id));
        return { ok: true };
      }),
  }),

  // ── Charity Partnerships ──────────────────────────────────────────────────────

  charity: router({
    list: publicProcedure
      .input(z.object({ ventureId: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        const rows = await db
          .select()
          .from(charityPartnerships)
          .orderBy(desc(charityPartnerships.createdAt));
        if (input?.ventureId) return rows.filter((r) => r.ventureId === input.ventureId);
        return rows;
      }),

    upsert: protectedProcedure
      .input(z.object({
        id:                        z.number().optional(),
        ventureId:                 z.string().optional(),
        charityName:               z.string().min(1),
        charityRegistrationNumber: z.string().optional(),
        contactName:               z.string().optional(),
        contactEmail:              z.string().optional(),
        partnershipStatus:         z.string().optional(),
        donationFormula:           z.string().optional(),
        profitDefinition:          z.string().optional(),
        boardApprovalStatus:       z.string().optional(),
        logoPermissionStatus:      z.string().optional(),
        publicClaimApprovalStatus: z.string().optional(),
        impactReportingStatus:     z.string().optional(),
        nextReviewDate:            z.string().optional(),
        notes:                     z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...body } = input;
        const values = {
          ...body,
          nextReviewDate: body.nextReviewDate || null,
          updatedAt:      new Date(),
        };
        if (id) {
          const updated = await db
            .update(charityPartnerships)
            .set(values)
            .where(eq(charityPartnerships.id, id))
            .returning();
          return updated[0];
        }
        const inserted = await db
          .insert(charityPartnerships)
          .values(values)
          .returning();
        return inserted[0];
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(charityPartnerships).where(eq(charityPartnerships.id, input.id));
        return { ok: true };
      }),
  }),

  // ── Alerts ────────────────────────────────────────────────────────────────────

  alerts: publicProcedure
    .query(async () => {
      const db = await getDb();
      const reqs = await db.select().from(legalContractRequirements).orderBy(legalContractRequirements.sortOrder);
      const records = await db.select().from(legalContractRecords);
      const charities = await db.select().from(charityPartnerships);
      const alerts: { type: string; severity: string; message: string; requirementId?: number }[] = [];
      const today = new Date();
      const in90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

      const recordMap = new Map<number, typeof records[0][]>();
      for (const r of records) {
        if (!r.requirementId) continue;
        if (!recordMap.has(r.requirementId)) recordMap.set(r.requirementId, []);
        recordMap.get(r.requirementId)!.push(r);
      }

      for (const req of reqs) {
        const recs = recordMap.get(req.id) ?? [];
        const active = recs.filter((r) => !["expired", "superseded"].includes(r.status ?? ""));
        if (req.required && active.length === 0) {
          alerts.push({ type: "missing_required", severity: req.defaultRiskRating === "critical" ? "critical" : "high", message: `${req.name} — no record exists (${req.categoryLabel})`, requirementId: req.id });
        }
        for (const rec of recs) {
          if (rec.reviewDate && new Date(rec.reviewDate) < today) {
            alerts.push({ type: "overdue_review", severity: "high", message: `${req.name} — review date overdue (${rec.reviewDate})`, requirementId: req.id });
          }
          if (rec.expiryDate) {
            const exp = new Date(rec.expiryDate);
            if (exp > today && exp <= in90) {
              alerts.push({ type: "expiry_soon", severity: "medium", message: `${req.name} — expires within 90 days (${rec.expiryDate})`, requirementId: req.id });
            }
          }
        }
      }

      for (const cp of charities) {
        if (cp.publicClaimApprovalStatus !== "approved") {
          if (cp.boardApprovalStatus !== "approved") {
            alerts.push({ type: "charity_board_approval_missing", severity: "critical", message: `${cp.charityName} — board approval for charitable giving not recorded. Public claims are blocked.` });
          }
          if (cp.logoPermissionStatus !== "granted") {
            alerts.push({ type: "charity_logo_permission_missing", severity: "critical", message: `${cp.charityName} — logo / name permission not granted. Public claims are blocked.` });
          }
        }
      }

      return alerts;
    }),

  // ── Dashboard stats ───────────────────────────────────────────────────────────

  stats: publicProcedure.query(async () => {
    const db = await getDb();
    const reqs = await db.select().from(legalContractRequirements);
    const records = await db.select().from(legalContractRecords);
    const today = new Date();
    const in90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const recordMap = new Map<number, typeof records[0][]>();
    for (const r of records) {
      if (!r.requirementId) continue;
      if (!recordMap.has(r.requirementId)) recordMap.set(r.requirementId, []);
      recordMap.get(r.requirementId)!.push(r);
    }

    const totalRequired = reqs.filter((r) => r.required).length;
    const hasActiveRecord = (reqId: number) => {
      const recs = recordMap.get(reqId) ?? [];
      return recs.some((r) => !["expired", "superseded", "not_started"].includes(r.status ?? ""));
    };
    const completedCount = reqs.filter((r) => {
      const recs = recordMap.get(r.id) ?? [];
      return recs.some((rec) => ["signed", "active"].includes(rec.status ?? ""));
    }).length;
    const missingCritical = reqs.filter((r) => r.required && r.defaultRiskRating === "critical" && !hasActiveRecord(r.id)).length;
    const overdueReviews = records.filter((r) => r.reviewDate && new Date(r.reviewDate) < today).length;
    const upcomingRenewals = records.filter((r) => {
      if (!r.expiryDate) return false;
      const exp = new Date(r.expiryDate);
      return exp > today && exp <= in90;
    }).length;

    const byLayer = ["fhv", "ecorace_studio", "ecoblend_os", "spv", "rd_partner", "employment", "charity"].map((layer) => {
      const layerReqs = reqs.filter((r) => r.businessLayer === layer);
      const signed = layerReqs.filter((r) => (recordMap.get(r.id) ?? []).some((rec) => ["signed", "active"].includes(rec.status ?? ""))).length;
      return { layer, total: layerReqs.length, signed };
    });

    const byStage = ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5"].map((stage) => {
      const stageReqs = reqs.filter((r) => r.priorityStage === stage);
      const signed = stageReqs.filter((r) => (recordMap.get(r.id) ?? []).some((rec) => ["signed", "active"].includes(rec.status ?? ""))).length;
      return { stage, total: stageReqs.length, signed };
    });

    return { totalRequired, completedCount, missingCritical, overdueReviews, upcomingRenewals, byLayer, byStage, totalRecords: records.length };
  }),
});
