import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CommandCentre from "@/pages/CommandCentre";
import { LeanDecisionBoard, FounderCockpit, DecisionQueue } from "./leanSections";

export default function CommandCentreTabs() {
  const [tab, setTab] = useState("command");
  return (
    <Tabs value={tab} onValueChange={setTab} className="block flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 px-8 pt-5 pb-2 bg-white/95 backdrop-blur border-b">
        <TabsList>
          <TabsTrigger value="command" data-testid="tab-command">Command Centre</TabsTrigger>
          <TabsTrigger value="cockpit" data-testid="tab-founder-cockpit">Founder Cockpit</TabsTrigger>
          <TabsTrigger value="decision" data-testid="tab-decision-board">Lean Decision Board</TabsTrigger>
          <TabsTrigger value="queue" data-testid="tab-decision-queue">Decision Queue</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="command" className="m-0"><CommandCentre /></TabsContent>
      <TabsContent value="cockpit" className="m-0"><div className="p-8"><FounderCockpit /></div></TabsContent>
      <TabsContent value="decision" className="m-0"><div className="p-8"><LeanDecisionBoard /></div></TabsContent>
      <TabsContent value="queue" className="m-0"><div className="p-8"><DecisionQueue /></div></TabsContent>
    </Tabs>
  );
}
