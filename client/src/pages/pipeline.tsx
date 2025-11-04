import { PipelineStage } from "@/components/pipeline-stage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Pipeline() {
  const pipelineData = [
    {
      stage: "New",
      deals: [
        { id: "1", title: "Website Redesign", value: 15000, contact: "John Smith" },
        { id: "2", title: "Mobile App Dev", value: 35000, contact: "Jane Doe" },
        { id: "3", title: "SEO Optimization", value: 8000, contact: "Bob Johnson" },
      ],
      color: "blue",
    },
    {
      stage: "Qualified",
      deals: [
        { id: "4", title: "Cloud Migration", value: 28000, contact: "Bob Wilson" },
        { id: "5", title: "Security Audit", value: 18000, contact: "Alice Brown" },
      ],
      color: "purple",
    },
    {
      stage: "Proposal",
      deals: [
        { id: "6", title: "Enterprise License", value: 45000, contact: "Sarah Johnson" },
        { id: "7", title: "Consulting Package", value: 12000, contact: "Mike Chen" },
        { id: "8", title: "Training Program", value: 9500, contact: "Emily Davis" },
      ],
      color: "orange",
    },
    {
      stage: "Negotiation",
      deals: [
        { id: "9", title: "Support Contract", value: 24000, contact: "James Wilson" },
        { id: "10", title: "Custom Integration", value: 32000, contact: "Lisa Taylor" },
      ],
      color: "yellow",
    },
    {
      stage: "Closed",
      deals: [
        { id: "11", title: "Annual License", value: 50000, contact: "David Martinez" },
      ],
      color: "green",
    },
  ];

  const totalValue = pipelineData.reduce(
    (sum, stage) => sum + stage.deals.reduce((s, d) => s + d.value, 0),
    0
  );

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
