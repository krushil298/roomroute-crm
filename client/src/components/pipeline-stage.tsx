import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  onDeleteDeal?: (dealId: string) => void;
}

export function PipelineStage({ stage, deals, color, onDealClick, onDeleteDeal }: PipelineStageProps) {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Card className="flex-shrink-0 w-52 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm">{stage}</h3>
        <Badge variant="secondary" className="text-xs">
          {deals.length}
        </Badge>
      </div>
      <div className="flex items-center gap-1 text-base font-bold text-primary mb-3">
        <DollarSign className="h-4 w-4" />
        <span className="tabular-nums">
          {totalValue >= 1000
            ? `${(totalValue / 1000).toFixed(0)}K`
            : totalValue.toLocaleString()}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {deals.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No deals</p>
        ) : (
          deals.map((deal) => (
            <Card
              key={deal.id}
              className="p-2 hover-elevate active-elevate-2 transition-all relative group"
              data-testid={`card-deal-${deal.id}`}
            >
              <div className="space-y-1" onClick={() => onDealClick?.(deal.id)} style={{ cursor: onDealClick ? 'pointer' : 'default' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm line-clamp-1 flex-1" data-testid={`text-deal-title-${deal.id}`}>
                    {deal.title}
                  </p>
                  {onDealClick && onDeleteDeal && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          data-testid={`button-deal-menu-${deal.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDealClick(deal.id); }} data-testid={`menu-edit-${deal.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Deal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={(e) => { e.stopPropagation(); onDeleteDeal(deal.id); }}
                          data-testid={`menu-delete-${deal.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Deal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
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
