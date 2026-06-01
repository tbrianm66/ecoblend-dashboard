import { Route, Switch } from "wouter";
import { RoleProvider } from "./context/RoleContext";
import { V2Layout } from "./V2Layout";
import CommandCentre from "./surfaces/CommandCentre";
import EvidenceLibrary from "./surfaces/EvidenceLibrary";
import AgentActivity from "./surfaces/AgentActivity";
import RiskBoard from "./surfaces/RiskBoard";
import StageGateBoard from "./surfaces/StageGateBoard";
import ReportsDataRoom from "./surfaces/ReportsDataRoom";

export default function V2App() {
  return (
    <RoleProvider>
      <V2Layout>
        <Switch>
          <Route path="/v2" component={CommandCentre} />
          <Route path="/v2/evidence" component={EvidenceLibrary} />
          <Route path="/v2/agents" component={AgentActivity} />
          <Route path="/v2/risks" component={RiskBoard} />
          <Route path="/v2/gates" component={StageGateBoard} />
          <Route path="/v2/reports" component={ReportsDataRoom} />
          <Route component={CommandCentre} />
        </Switch>
      </V2Layout>
    </RoleProvider>
  );
}
