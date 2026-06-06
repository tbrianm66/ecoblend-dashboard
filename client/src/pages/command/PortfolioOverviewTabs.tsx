import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Home from "@/pages/Home";
import { LeanPortfolio } from "./leanSections";

export default function PortfolioOverviewTabs() {
  const [tab, setTab] = useState("studio");
  return (
    <Tabs value={tab} onValueChange={setTab} className="block flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 px-8 pt-5 pb-2 bg-white/95 backdrop-blur border-b">
        <TabsList>
          <TabsTrigger value="studio" data-testid="tab-studio">Studio Overview</TabsTrigger>
          <TabsTrigger value="lean" data-testid="tab-lean-portfolio">Lean Portfolio</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="studio" className="m-0"><Home /></TabsContent>
      <TabsContent value="lean" className="m-0"><div className="p-8"><LeanPortfolio /></div></TabsContent>
    </Tabs>
  );
}
