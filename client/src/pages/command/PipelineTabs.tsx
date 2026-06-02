import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OpportunityPipeline from "@/pages/OpportunityPipeline";
import { ExperimentQueue, EvidenceDashboard } from "./leanSections";

export default function PipelineTabs() {
  const [tab, setTab] = useState("pipeline");
  return (
    <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-y-auto gap-0">
      <div className="sticky top-0 z-20 px-8 pt-5 pb-2 bg-white/95 backdrop-blur border-b">
        <TabsList>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">Opportunity Pipeline</TabsTrigger>
          <TabsTrigger value="experiments" data-testid="tab-experiment-queue">Experiment Queue</TabsTrigger>
          <TabsTrigger value="evidence" data-testid="tab-evidence-confidence">Evidence Confidence</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="pipeline" className="m-0"><OpportunityPipeline /></TabsContent>
      <TabsContent value="experiments" className="m-0"><div className="p-8"><ExperimentQueue /></div></TabsContent>
      <TabsContent value="evidence" className="m-0"><div className="p-8"><EvidenceDashboard /></div></TabsContent>
    </Tabs>
  );
}
