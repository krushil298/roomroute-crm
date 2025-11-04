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
    <div className="flex-shrink-0 w-80">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold">{stage}</h3>
          <Badge variant="secondary" className="text-xs">
            {deals.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span className="font-medium tabular-nums">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {deals.map((deal) => (
          <Card
            key={deal.id}
            className="p-4 cursor-move hover-elevate"
            data-testid={`card-pipeline-deal-${deal.id}`}
          >
            <h4 className="font-medium text-sm mb-2">{deal.title}</h4>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {deal.contact}
              </span>
              <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                ${deal.value.toLocaleString()}
              </span>
            </div>
          </Card>
        ))}
        {deals.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  );
}
