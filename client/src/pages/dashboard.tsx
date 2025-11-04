import { KPICard } from "@/components/kpi-card";
import { ActivityFeed } from "@/components/activity-feed";
import { QuickActions } from "@/components/quick-actions";
import { PipelineStage } from "@/components/pipeline-stage";
import { Users, TrendingUp, DollarSign, Activity } from "lucide-react";

export default function Dashboard() {
  const kpis = [
    {
      title: "Total Contacts",
      value: 1247,
      icon: Users,
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Active Deals",
      value: 43,
      icon: TrendingUp,
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: "Pipeline Value",
      value: "$847K",
      icon: DollarSign,
      trend: { value: 15.3, isPositive: true },
    },
    {
      title: "This Week",
      value: 156,
      icon: Activity,
      trend: { value: 3.1, isPositive: false },
    },
  ];

  const recentActivities = [
    {
      id: "1",
      type: "call" as const,
      title: "Called about proposal follow-up",
      contact: "Sarah Johnson",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "email" as const,
      title: "Sent pricing information",
      contact: "Mike Chen",
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      type: "meeting" as const,
      title: "Demo scheduled",
      contact: "Emily Rodriguez",
      timestamp: "Yesterday",
    },
    {
      id: "4",
      type: "note" as const,
      title: "Added follow-up note",
      contact: "David Kim",
      timestamp: "Yesterday",
    },
    {
      id: "5",
      type: "call" as const,
      title: "Discovery call completed",
      contact: "Lisa Anderson",
      timestamp: "2 days ago",
    },
  ];

  const pipelineData = [
    {
      stage: "New",
      deals: [
        { id: "1", title: "Website Redesign", value: 15000, contact: "John Smith" },
        { id: "2", title: "Mobile App Dev", value: 35000, contact: "Jane Doe" },
      ],
      color: "blue",
    },
    {
      stage: "Qualified",
      deals: [
        { id: "3", title: "Cloud Migration", value: 28000, contact: "Bob Wilson" },
      ],
      color: "purple",
    },
    {
      stage: "Proposal",
      deals: [
        { id: "4", title: "Enterprise License", value: 45000, contact: "Sarah Johnson" },
        { id: "5", title: "Consulting Package", value: 12000, contact: "Mike Chen" },
      ],
      color: "orange",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's your CRM overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={recentActivities} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Pipeline Overview</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineData.map((stage) => (
            <PipelineStage key={stage.stage} {...stage} />
          ))}
        </div>
      </div>
    </div>
  );
}
