import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  value: number;
  contact: string;
}

interface PipelineStageProps {
  stage: string;
  deals: Deal[];
  color: string;
}

export function PipelineStage({ stage, deals, color }: PipelineStageProps) {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Card className="flex-shrink-0 w-60 p-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold">{stage}</h3>
        <Badge variant="secondary" className="text-xs">
          {deals.length}
        </Badge>
      </div>
      <div className="flex items-center gap-1 text-2xl font-bold text-primary">
        <DollarSign className="h-6 w-6" />
        <span className="tabular-nums">
          {totalValue >= 1000 
            ? `${(totalValue / 1000).toFixed(0)}K` 
            : totalValue.toLocaleString()}
        </span>
      </div>
    </Card>
  );
}
