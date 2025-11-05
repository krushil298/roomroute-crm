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
  onDealClick?: (dealId: string) => void;
}

export function PipelineStage({ stage, deals, color, onDealClick }: PipelineStageProps) {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Card className="flex-shrink-0 w-60 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold">{stage}</h3>
        <Badge variant="secondary" className="text-xs">
          {deals.length}
        </Badge>
      </div>
      <div className="flex items-center gap-1 text-lg font-bold text-primary mb-4">
        <DollarSign className="h-5 w-5" />
        <span className="tabular-nums">
          {totalValue >= 1000 
            ? `${(totalValue / 1000).toFixed(0)}K` 
            : totalValue.toLocaleString()}
        </span>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {deals.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No deals</p>
        ) : (
          deals.map((deal) => (
            <Card 
              key={deal.id}
              className="p-3 cursor-pointer hover-elevate active-elevate-2 transition-all"
              onClick={() => onDealClick?.(deal.id)}
              data-testid={`card-deal-${deal.id}`}
            >
              <div className="space-y-1">
                <p className="font-medium text-sm line-clamp-1" data-testid={`text-deal-title-${deal.id}`}>
                  {deal.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {deal.contact}
                </p>
                <p className="text-sm font-semibold text-primary tabular-nums">
                  ${deal.value.toLocaleString()}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
}
