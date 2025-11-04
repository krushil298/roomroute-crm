import { KPICard } from "../kpi-card";
import { Users } from "lucide-react";

export default function KPICardExample() {
  return (
    <div className="p-6 max-w-sm">
      <KPICard
        title="Total Contacts"
        value={1247}
        icon={Users}
        trend={{ value: 12.5, isPositive: true }}
      />
    </div>
  );
}
