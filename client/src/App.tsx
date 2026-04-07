import { Toaster } from "@/components/ui/sonner";
import LearningEngine from "@/pages/LearningEngine";
import GDriveWorkspace from "@/pages/GDriveWorkspace";
import VrlDashboardV4 from "@/pages/VrlDashboardV4";
import SpinoffSequenceOS from "@/pages/SpinoffSequenceOS";
import BrandPipeline from "@/pages/BrandPipeline";
import InsightAutomation from "@/pages/InsightAutomation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VentureProvider } from "./contexts/VentureContext";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import VentureDetail from "./pages/VentureDetail";
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
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/pipeline" component={OpportunityPipeline} />
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
      <Route path="/command-centre" component={CommandCentre} />
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
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <VentureProvider>
          <TooltipProvider>
            <Toaster />
            <div className="flex min-h-screen bg-gray-50">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <Router />
              </div>
            </div>
          </TooltipProvider>
        </VentureProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
