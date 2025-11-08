import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  accentColor?: "primary" | "gold";
}

export function KPICard({ title, value, icon: Icon, trend, onClick, accentColor }: KPICardProps) {
  const iconColorClass = accentColor === "gold" ? "text-gold" : accentColor === "primary" ? "text-primary" : "text-muted-foreground";
  
  return (
    <Card 
      className={`relative ${onClick ? 'hover-elevate cursor-pointer' : ''}`}
      onClick={onClick}
      data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {accentColor && (
        <div 
          className={`absolute top-0 left-0 w-1 h-full ${
            accentColor === "gold" ? "bg-gold" : "bg-primary"
          } rounded-l-md`}
        />
      )}
      <div className="p-6 pl-8">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          <Icon className={`h-4 w-4 ${iconColorClass}`} />
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-bold tabular-nums" data-testid={`text-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
