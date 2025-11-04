import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, User, MoreVertical } from "lucide-react";

interface DealCardProps {
  title: string;
  value: number;
  stage: string;
  contact: string;
  closingDate: string;
  probability?: number;
}

const stageColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  qualified: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  proposal: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  negotiation: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  closed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function DealCard({
  title,
  value,
  stage,
  contact,
  closingDate,
  probability,
}: DealCardProps) {
  return (
    <Card className="p-6 hover-elevate" data-testid={`card-deal-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-2">{title}</h3>
          <Badge className={stageColors[stage.toLowerCase()] || stageColors.new}>
            {stage}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" data-testid="button-deal-menu">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold tabular-nums" data-testid="text-deal-value">
            ${value.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4 shrink-0" />
          <span>{contact}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{closingDate}</span>
        </div>
        {probability !== undefined && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Win Probability</span>
              <span className="font-medium">{probability}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${probability}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
