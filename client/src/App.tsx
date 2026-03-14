import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VentureProvider } from "./contexts/VentureContext";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import VentureDetail from "./pages/VentureDetail";
import VrlAnalytics from "./pages/VrlAnalytics";
import TrlAnalytics from "./pages/TrlAnalytics";
import InvestmentReadiness from "./pages/InvestmentReadiness";
import PlaceholderPage from "./pages/PlaceholderPage";
import RiskManagement from "./pages/RiskManagement";
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
