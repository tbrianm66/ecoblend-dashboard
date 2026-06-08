import { Toaster } from "@/components/ui/sonner";
import LearningEngine from "@/pages/LearningEngine";
import GDriveWorkspace from "@/pages/GDriveWorkspace";
import VrlDashboardV4 from "@/pages/VrlDashboardV4";
import SpinoffSequenceOS from "@/pages/SpinoffSequenceOS";
import BrandPipeline from "@/pages/BrandPipeline";
import InsightAutomation from "@/pages/InsightAutomation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VentureProvider } from "./contexts/VentureContext";
import { SelectedVentureProvider } from "./contexts/SelectedVentureContext";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import VentureDetail from "./pages/VentureDetail";
import DecisionGate from "./pages/ventures/DecisionGate";
import VentureArchive from "./pages/ventures/VentureArchive";
import VrlAnalytics from "./pages/VrlAnalytics";
import VrlAssessmentForm from "./pages/VrlAssessmentForm";
import VrlResults from "./pages/VrlResults";
import TrlAnalytics from "./pages/TrlAnalytics";
import InvestmentReadiness from "./pages/InvestmentReadiness";
import PlaceholderPage from "./pages/PlaceholderPage";
import RiskManagement from "./pages/RiskManagement";
import DualRiskEngine from "./pages/DualRiskEngine";
import SupplyChain from "./pages/SupplyChain";
import FounderOnboarding from "./pages/FounderOnboarding";
import BCorpIso from "./pages/BCorpIso";
import FoundationImpact from "./pages/FoundationImpact";
import IpManagement from "./pages/IpManagement";
import PeopleEsop from "./pages/PeopleEsop";
import MarketingStrategy from "./pages/MarketingStrategy";
import FinancialAnalytics from "./pages/FinancialAnalytics";
import BrandReadiness from "./pages/BrandReadiness";
import InterviewTracker from "./pages/InterviewTracker";
import PlaybookProgress from "./pages/PlaybookProgress";
import LegalContracts from "./pages/LegalContracts";
import BrandPR from "./pages/BrandPR";
import SpecialistServices from "./pages/SpecialistServices";
import OpportunityPipeline from "./pages/OpportunityPipeline";
import ExperimentLog from "./pages/ExperimentLog";
import FounderProfiles from "./pages/FounderProfiles";
import AcademicResearch from "./pages/AcademicResearch";
import MarketIntelligence from "./pages/MarketIntelligence";
import BrlAnalytics from "./pages/BrlAnalytics";
import ImpactGovernance from "./pages/ImpactGovernance";
import KnowledgeBase from "./pages/KnowledgeBase";
import PeopleIntelligence from "./pages/PeopleIntelligence";
import ProductOpportunityIntelligence from "./pages/ProductOpportunityIntelligence";
import VentureProjectManagement from "./pages/VentureProjectManagement";
import CommandCentre from "./pages/CommandCentre";
import FounderMatching from "./pages/FounderMatching";
import SpinoffOS from "./pages/SpinoffOS";
import CoFounderMatrix from "./pages/CoFounderMatrix";
import ChinaManufacturingPlaybook from "./pages/ChinaManufacturingPlaybook";
import UniversityPlaybook from "./pages/UniversityPlaybook";
import WorkflowEngine from "./pages/WorkflowEngine";
import DataManagement from "./pages/DataManagement";
import CommercialCRM from "./pages/CommercialCRM";
import InvestorCRM from "./pages/InvestorCRM";
import FinancialModelBuilder from "./pages/FinancialModelBuilder";
import PortfolioManager from "./pages/PortfolioManager";
import OfferingDetail from "./pages/OfferingDetail";
import SpinOutBlueprint from "./pages/SpinOutBlueprint";
import CulturalReadiness from "./pages/CulturalReadiness";
import InvestmentModule from "./pages/InvestmentModule";
import EcoraceLab from "./pages/EcoraceLab";
import CoachingFounder from "./pages/CoachingFounder";
import CoachingCoach from "./pages/CoachingCoach";
import CoachingStudio from "./pages/CoachingStudio";
import InvestorDataRoom from "./pages/InvestorDataRoom";
import IpIntelligence from "./pages/IpIntelligence";
import PlaybookPortal from "./pages/PlaybookPortal";
import SrlPortfolio from "./pages/SrlPortfolio";
import SrlVentureDetail from "./pages/SrlVentureDetail";
import SrlHistory from "./pages/SrlHistory";
import MrlPortfolio from "./pages/MrlPortfolio";
import MrlVentureDetail from "./pages/MrlVentureDetail";
import SyncPortfolio from "./pages/SyncPortfolio";
import SyncVentureDetail from "./pages/SyncVentureDetail";
import MrlScoring from "./pages/MrlScoring";
import MrlCommandDashboard from "./pages/MrlCommandDashboard";
import AdminHub from "./pages/AdminHub";
import AdminPlaybooks from "./pages/AdminPlaybooks";
import AdminContextRules from "./pages/AdminContextRules";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import AdminWidgetAnalytics from "./pages/AdminWidgetAnalytics";
import AdminWidgetSettings from "./pages/AdminWidgetSettings";
import AdminProductionReadiness from "./pages/AdminProductionReadiness";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import SustainabilityHub from "./pages/sustainability/SustainabilityHub";
import ImpactMetrics from "./pages/sustainability/ImpactMetrics";
import LcaCarbon from "./pages/sustainability/LcaCarbon";
import CircularityMetrics from "./pages/sustainability/CircularityMetrics";
import EsgBcorp from "./pages/sustainability/EsgBcorp";
import PortfolioOverviewTabs from "./pages/command/PortfolioOverviewTabs";
import CommandCentreTabs from "./pages/command/CommandCentreTabs";
import PipelineTabs from "./pages/command/PipelineTabs";
import VentureStatus from "./pages/command/VentureStatus";
import AlertsApprovals from "./pages/command/AlertsApprovals";
import VentureIntake from "./pages/VentureIntake";
import IdeaCapture from "./pages/intake/IdeaCapture";
import FounderAssumptions from "./pages/intake/FounderAssumptions";
import IntakeHypotheses from "./pages/intake/IntakeHypotheses";
import RiskiestAssumption from "./pages/intake/RiskiestAssumption";
import IntakeDecision from "./pages/intake/IntakeDecision";
import PropositionOverview from "./pages/proposition/PropositionOverview";
import ValuePropositionCanvas from "./pages/proposition/ValuePropositionCanvas";
import JobsToBeDone from "./pages/proposition/JobsToBeDone";
import BusinessModelHypothesis from "./pages/proposition/BusinessModelHypothesis";
import RevenueModelTest from "./pages/proposition/RevenueModelTest";
import UnitEconomics from "./pages/proposition/UnitEconomics";
import BusinessModelRiskLog from "./pages/proposition/BusinessModelRiskLog";
import PivotHistory from "./pages/proposition/PivotHistory";
import ModelReadinessDecision from "./pages/proposition/ModelReadinessDecision";
import CustomerDiscovery from "./pages/discovery/CustomerDiscovery";
import CompetitorMapping from "./pages/discovery/CompetitorMapping";
import DemandSignals from "./pages/discovery/DemandSignals";
import WTPAssessment from "./pages/discovery/WTPAssessment";
import MarketRiskLog from "./pages/discovery/MarketRiskLog";
import DiscoveryExperimentLog from "./pages/discovery/ExperimentLog";
import ReadinessScoring from "./pages/ReadinessScoring";
import RDHub from "./pages/RDHub";
import LeanCanvas from "./pages/lean/LeanCanvas";
import Prototypes from "./pages/rnd/Prototypes";
import RiskIntelligence from "./pages/RiskIntelligence";
import InvestmentPack from "./pages/InvestmentPack";
import GovernanceHub from "./pages/GovernanceHub";
import ExecutionPlanning from "./pages/ExecutionPlanning";
import V2App from "./v2/V2App";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={PortfolioOverviewTabs} />
      <Route path="/venture/:id" component={VentureDetail} />
      <Route path="/vrl" component={VrlAnalytics} />
      <Route path="/trl" component={TrlAnalytics} />
      <Route path="/investment" component={InvestmentReadiness} />
      <Route path="/risk" component={RiskManagement} />
      <Route path="/dual-risk" component={DualRiskEngine} />
      <Route path="/supply-chain" component={SupplyChain} />
      <Route path="/onboarding" component={FounderOnboarding} />
      <Route path="/brand" component={BrandReadiness} />
      <Route path="/ip" component={IpManagement} />
      <Route path="/people" component={PeopleEsop} />
      <Route path="/marketing" component={MarketingStrategy} />
      <Route path="/financial" component={FinancialAnalytics} />
      <Route path="/bcorp" component={BCorpIso} />
      <Route path="/foundation" component={FoundationImpact} />
      <Route path="/interviews" component={InterviewTracker} />
      <Route path="/playbook" component={PlaybookProgress} />
      <Route path="/legal" component={LegalContracts} />
      <Route path="/pr" component={BrandPR} />
      <Route path="/specialists" component={SpecialistServices} />
      <Route path="/pipeline" component={PipelineTabs} />
      <Route path="/experiments" component={ExperimentLog} />
      <Route path="/founders" component={FounderProfiles} />
      <Route path="/academic" component={AcademicResearch} />
      <Route path="/market-intelligence" component={MarketIntelligence} />
      <Route path="/brl" component={BrlAnalytics} />
      <Route path="/impact" component={ImpactGovernance} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/people-intelligence" component={PeopleIntelligence} />
      <Route path="/poi" component={ProductOpportunityIntelligence} />
      <Route path="/project-management" component={VentureProjectManagement} />
      <Route path="/command-centre" component={CommandCentreTabs} />
      <Route path="/matching" component={FounderMatching} />
      <Route path="/spinoff" component={SpinoffOS} />
      <Route path="/co-founder-matrix" component={CoFounderMatrix} />
      <Route path="/china-manufacturing" component={ChinaManufacturingPlaybook} />
      <Route path="/workflow-engine" component={WorkflowEngine} />
          <Route path="/data-management" component={DataManagement} />
      <Route path="/university-playbook" component={UniversityPlaybook} />
      <Route path="/commercial-crm" component={CommercialCRM} />
      <Route path="/investor-crm" component={InvestorCRM} />
      <Route path="/financial-model-builder" component={FinancialModelBuilder} />
      <Route path="/portfolio-manager" component={PortfolioManager} />
      <Route path="/offering/:id" component={OfferingDetail} />
      <Route path="/spinout-blueprint" component={SpinOutBlueprint} />
      <Route path="/cultural-readiness" component={CulturalReadiness} />
      <Route path="/investment-module" component={InvestmentModule} />
      <Route path="/ecorace-lab" component={EcoraceLab} />
      <Route path="/coaching" component={CoachingFounder} />
      <Route path="/coaching-coach" component={CoachingCoach} />
      <Route path="/coaching-studio" component={CoachingStudio} />
          <Route path="/playbook-portal" component={PlaybookPortal} />
      <Route path="/investor-data-room" component={InvestorDataRoom} />
          <Route path="/ip-intelligence" component={IpIntelligence} />
          <Route path="/learning-engine" component={LearningEngine} />
      <Route path="/gdrive-workspace" component={GDriveWorkspace} />
      <Route path="/vrl-dashboard-v4" component={VrlDashboardV4} />
      <Route path="/vrl-assessment" component={VrlAssessmentForm} />
      <Route path="/vrl-results" component={VrlResults} />
      <Route path="/spinoff-sequence" component={SpinoffSequenceOS} />
      <Route path="/brand-pipeline" component={BrandPipeline} />
      <Route path="/insight-automation" component={InsightAutomation} />
      <Route path="/srl-portfolio" component={SrlPortfolio} />
      <Route path="/srl-venture/:ventureId" component={SrlVentureDetail} />
      <Route path="/srl-history" component={SrlHistory} />
      <Route path="/mrl-portfolio" component={MrlPortfolio} />
      <Route path="/mrl-venture" component={MrlVentureDetail} />
      <Route path="/mrl-scoring" component={MrlScoring} />
      <Route path="/mrl-command" component={MrlCommandDashboard} />
      <Route path="/sync" component={SyncPortfolio} />
      <Route path="/sync/:ventureId" component={SyncVentureDetail} />
      {/* ── Admin ── */}
      <Route path="/admin" component={AdminHub} />
      <Route path="/admin/playbooks" component={AdminPlaybooks} />
      <Route path="/admin/context-rules" component={AdminContextRules} />
      <Route path="/admin/widget-analytics" component={AdminWidgetAnalytics} />
      <Route path="/admin/widget-settings" component={AdminWidgetSettings} />
      <Route path="/admin/production-readiness" component={AdminProductionReadiness} />
      <Route path="/admin/users" component={AdminPlaceholder} />
      <Route path="/admin/permissions" component={AdminPlaceholder} />
      <Route path="/admin/templates" component={AdminPlaceholder} />
      <Route path="/admin/data-fields" component={AdminPlaceholder} />
      <Route path="/admin/modules" component={AdminPlaceholder} />
      <Route path="/admin/integrations" component={AdminPlaceholder} />
      <Route path="/admin/api" component={AdminPlaceholder} />
      <Route path="/admin/audit" component={AdminPlaceholder} />
      <Route path="/admin/config" component={AdminPlaceholder} />
      {/* ── New Architecture Routes (Modules 2-15) ── */}
      {/* Module 2: Venture Intake */}
      <Route path="/intake" component={VentureIntake} />
      <Route path="/intake/idea-capture" component={IdeaCapture} />
      <Route path="/intake/assumptions" component={FounderAssumptions} />
      <Route path="/intake/hypotheses" component={IntakeHypotheses} />
      <Route path="/intake/riskiest" component={RiskiestAssumption} />
      <Route path="/intake/decision" component={IntakeDecision} />
      {/* Module 3: Discovery & Market Validation */}
      <Route path="/discovery" component={CustomerDiscovery} />
      <Route path="/discovery/competitors" component={CompetitorMapping} />
      <Route path="/discovery/demand" component={DemandSignals} />
      <Route path="/discovery/wtp" component={WTPAssessment} />
      <Route path="/discovery/market-risk" component={MarketRiskLog} />
      <Route path="/discovery/experiments" component={DiscoveryExperimentLog} />
      {/* Module 4: Proposition & Model */}
      <Route path="/proposition" component={PropositionOverview} />
      <Route path="/proposition/value-proposition" component={ValuePropositionCanvas} />
      <Route path="/proposition/jtbd" component={JobsToBeDone} />
      <Route path="/proposition/business-model" component={BusinessModelHypothesis} />
      <Route path="/proposition/revenue-model" component={RevenueModelTest} />
      <Route path="/proposition/unit-economics" component={UnitEconomics} />
      <Route path="/proposition/risks" component={BusinessModelRiskLog} />
      <Route path="/proposition/pivot-history" component={PivotHistory} />
      <Route path="/proposition/decision" component={ModelReadinessDecision} />
      {/* Lean Canvas — append-only versioned canvas */}
      <Route path="/lean/canvas" component={LeanCanvas} />
      {/* Module 5: R&D Hub */}
      <Route path="/rnd" component={RDHub} />
      <Route path="/rnd/experiments" component={ModulePlaceholder} />
      <Route path="/rnd/kpis" component={ModulePlaceholder} />
      <Route path="/rnd/prototypes" component={Prototypes} />
      <Route path="/rnd/ip" component={ModulePlaceholder} />
      {/* Module 6: Operations & Manufacturing */}
      <Route path="/operations" component={ModulePlaceholder} />
      <Route path="/operations/suppliers" component={ModulePlaceholder} />
      <Route path="/operations/manufacturing" component={ModulePlaceholder} />
      <Route path="/operations/compliance" component={ModulePlaceholder} />
      <Route path="/operations/mrl" component={ModulePlaceholder} />
      {/* Module 7: Brand & GTM */}
      <Route path="/gtm" component={ModulePlaceholder} />
      <Route path="/gtm/messaging" component={ModulePlaceholder} />
      <Route path="/gtm/strategy" component={ModulePlaceholder} />
      <Route path="/gtm/campaigns" component={ModulePlaceholder} />
      <Route path="/gtm/sales" component={ModulePlaceholder} />
      {/* Module 8: Sustainability & Impact */}
      <Route path="/sustainability" component={SustainabilityHub} />
      <Route path="/sustainability/impact" component={ImpactMetrics} />
      <Route path="/sustainability/lca" component={LcaCarbon} />
      <Route path="/sustainability/circularity" component={CircularityMetrics} />
      <Route path="/sustainability/bcorp" component={EsgBcorp} />
      {/* Module 9: Risk Intelligence (existing pages + new) */}
      <Route path="/risk/heatmap" component={RiskIntelligence} />
      <Route path="/risk/mitigation" component={ModulePlaceholder} />
      {/* Module 10: Readiness Scoring */}
      <Route path="/scoring" component={ReadinessScoring} />
      <Route path="/scoring/vrl" component={VrlAnalytics} />
      <Route path="/scoring/trl" component={TrlAnalytics} />
      <Route path="/scoring/brl" component={BrlAnalytics} />
      <Route path="/scoring/mrl" component={MrlPortfolio} />
      <Route path="/scoring/srl" component={SrlPortfolio} />
      <Route path="/scoring/irl" component={ModulePlaceholder} />
      <Route path="/scoring/prl" component={ModulePlaceholder} />
      {/* Module 11: Investment Readiness */}
      <Route path="/investment/thesis" component={InvestmentPack} />
      <Route path="/investment/financial" component={FinancialModelBuilder} />
      <Route path="/investment/dataroom" component={InvestorDataRoom} />
      <Route path="/investment/pack" component={InvestmentPack} />
      {/* Module 12: Execution Planning */}
      <Route path="/execution" component={ExecutionPlanning} />
      <Route path="/execution/milestones" component={ModulePlaceholder} />
      <Route path="/execution/budget" component={ModulePlaceholder} />
      <Route path="/execution/hiring" component={ModulePlaceholder} />
      {/* Module 13: Coaching (existing) */}
      <Route path="/coaching/founder" component={CoachingFounder} />
      <Route path="/coaching/studio" component={CoachingStudio} />
      <Route path="/coaching/coach" component={CoachingCoach} />
      {/* Module 14: Collaboration */}
      <Route path="/collaboration" component={ModulePlaceholder} />
      <Route path="/collaboration/advisors" component={ModulePlaceholder} />
      <Route path="/collaboration/academics" component={AcademicResearch} />
      <Route path="/collaboration/specialists" component={SpecialistServices} />
      {/* Module 15: Governance */}
      <Route path="/governance" component={GovernanceHub} />
      <Route path="/governance/gates" component={GovernanceHub} />
      <Route path="/governance/board" component={GovernanceHub} />
      <Route path="/governance/audit" component={GovernanceHub} />
      <Route path="/governance/ip" component={IpManagement} />
      <Route path="/governance/legal" component={LegalContracts} />
      {/* Decision Gate + Venture Archive */}
      <Route path="/decision-gate" component={DecisionGate} />
      <Route path="/ventures/archive" component={VentureArchive} />
      <Route path="/ventures/:id/decision" component={DecisionGate} />
      <Route path="/ventures/:id/archive" component={VentureArchive} />
      {/* Command Centre extras */}
      <Route path="/venture-status" component={VentureStatus} />
      <Route path="/alerts" component={AlertsApprovals} />
      {/* ECOBLEND OS Agentic Validation Platform v2 (self-contained namespace) */}
      <Route path="/v2" component={V2App} />
      <Route path="/v2/:rest*" component={V2App} />
      <Route component={Home} />
    </Switch>
  );
}

function AppShell() {
  const [location] = useLocation();
  // The v2 namespace is a self-contained layer with its own full-screen layout,
  // so it renders outside the legacy sidebar shell.
  if (location.startsWith("/v2")) {
    return <Router />;
  }
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <Router />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <VentureProvider>
          <SelectedVentureProvider>
          <TooltipProvider>
            <Toaster />
            <AppShell />
          </TooltipProvider>
          </SelectedVentureProvider>
        </VentureProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
