import { KPICard } from "@/components/kpi-card";
import { ActivityFeed } from "@/components/activity-feed";
import { QuickActions } from "@/components/quick-actions";
import { PipelineStage } from "@/components/pipeline-stage";
import { Users, TrendingUp, DollarSign, Activity as ActivityIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { Contact, Deal, Activity } from "@shared/schema";

export default function Dashboard() {
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const totalPipelineValue = deals.reduce((sum, deal) => 
    sum + Number(deal.value), 0
  );

  const kpis = [
    {
      title: "Total Contacts",
      value: contacts.length,
      icon: Users,
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Active Deals",
      value: deals.filter(d => d.stage !== "closed").length,
      icon: TrendingUp,
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: "Pipeline Value",
      value: `$${(totalPipelineValue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      trend: { value: 15.3, isPositive: true },
    },
    {
      title: "This Week",
      value: activities.length,
      icon: ActivityIcon,
      trend: { value: 3.1, isPositive: false },
    },
  ];

  const recentActivities = activities
    .slice(0, 5)
    .map((activity) => ({
      id: activity.id,
      type: activity.type as "call" | "email" | "meeting" | "note",
      title: activity.description,
      contact: contacts.find(c => c.id === activity.contactId)?.name || "Unknown",
      timestamp: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }),
    }));

  const dealsByStage = (stage: string) => 
    deals
      .filter(d => d.stage.toLowerCase() === stage.toLowerCase())
      .map(deal => ({
        id: deal.id,
        title: deal.title,
        value: Number(deal.value),
        contact: contacts.find(c => c.id === deal.contactId)?.name || "Unknown",
      }));

  const pipelineData = [
    {
      stage: "Lead",
      deals: dealsByStage("lead"),
      color: "blue",
    },
    {
      stage: "Qualified",
      deals: dealsByStage("qualified"),
      color: "purple",
    },
    {
      stage: "Proposal",
      deals: dealsByStage("proposal"),
      color: "orange",
    },
    {
      stage: "Negotiation",
      deals: dealsByStage("negotiation"),
      color: "green",
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
