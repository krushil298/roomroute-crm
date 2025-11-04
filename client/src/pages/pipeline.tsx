import { PipelineStage } from "@/components/pipeline-stage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Deal, Contact } from "@shared/schema";

export default function Pipeline() {
  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const stageConfig = [
    { stage: "lead", displayName: "New", color: "blue" },
    { stage: "qualified", displayName: "Qualified", color: "purple" },
    { stage: "proposal", displayName: "Proposal", color: "orange" },
    { stage: "negotiation", displayName: "Negotiation", color: "yellow" },
    { stage: "closed", displayName: "Closed", color: "green" },
  ];

  const pipelineData = stageConfig.map(({ stage, displayName, color }) => ({
    stage: displayName,
    deals: deals
      .filter(deal => deal.stage.toLowerCase() === stage.toLowerCase())
      .map(deal => ({
        id: deal.id,
        title: deal.title,
        value: Number(deal.value),
        contact: contacts.find(c => c.id === deal.contactId)?.name || "No contact",
      })),
    color,
  }));

  const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Total Pipeline Value: <span className="font-semibold tabular-nums">${totalValue.toLocaleString()}</span>
          </p>
        </div>
        <Button data-testid="button-add-pipeline-deal">
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineData.map((stage) => (
          <PipelineStage key={stage.stage} {...stage} />
        ))}
      </div>
    </div>
  );
}
