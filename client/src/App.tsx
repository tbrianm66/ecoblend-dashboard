import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import VentureDetail from "./pages/VentureDetail";
import VrlAnalytics from "./pages/VrlAnalytics";
import TrlAnalytics from "./pages/TrlAnalytics";
import InvestmentReadiness from "./pages/InvestmentReadiness";
import PlaceholderPage from "./pages/PlaceholderPage";
import RiskManagement from "./pages/RiskManagement";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/venture/:id" component={VentureDetail} />
      <Route path="/vrl" component={VrlAnalytics} />
      <Route path="/trl" component={TrlAnalytics} />
      <Route path="/investment" component={InvestmentReadiness} />
      <Route path="/risk" component={RiskManagement} />
      <Route path="/brand" component={PlaceholderPage} />
      <Route path="/ip" component={PlaceholderPage} />
      <Route path="/people" component={PlaceholderPage} />
      <Route path="/marketing" component={PlaceholderPage} />
      <Route path="/financial" component={PlaceholderPage} />
      <Route path="/bcorp" component={PlaceholderPage} />
      <Route path="/foundation" component={PlaceholderPage} />
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              <Router />
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
