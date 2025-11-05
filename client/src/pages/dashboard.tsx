import { KPICard } from "@/components/kpi-card";
import { ActivityFeed } from "@/components/activity-feed";
import { QuickActions } from "@/components/quick-actions";
import { PipelineStage } from "@/components/pipeline-stage";
import { Users, TrendingUp, DollarSign, Activity as ActivityIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { Contact, Deal, Activity, Organization } from "@shared/schema";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization/profile"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Current month date range
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  
  // Previous month date range
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  // Filter data for current and previous month
  const currentMonthContacts = contacts.filter(c => {
    const createdAt = new Date(c.createdAt);
    return createdAt >= currentMonthStart && createdAt <= currentMonthEnd;
  });

  const previousMonthContacts = contacts.filter(c => {
    const createdAt = new Date(c.createdAt);
    return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
  });

  const currentMonthActivities = activities.filter(a => {
    const createdAt = new Date(a.createdAt);
    return createdAt >= currentMonthStart && createdAt <= currentMonthEnd;
  });

  const previousMonthActivities = activities.filter(a => {
    const createdAt = new Date(a.createdAt);
    return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
  });

  const currentMonthLeadPipeline = currentMonthContacts.reduce((sum, contact) => 
    sum + Number(contact.potentialValue || 0), 0
  );

  const previousMonthLeadPipeline = previousMonthContacts.reduce((sum, contact) => 
    sum + Number(contact.potentialValue || 0), 0
  );

  const currentMonthDealPipeline = deals
    .filter(d => {
      const createdAt = new Date(d.createdAt);
      return createdAt >= currentMonthStart && createdAt <= currentMonthEnd;
    })
    .reduce((sum, deal) => sum + Number(deal.value), 0);

  const previousMonthDealPipeline = deals
    .filter(d => {
      const createdAt = new Date(d.createdAt);
      return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
    })
    .reduce((sum, deal) => sum + Number(deal.value), 0);

  // Calculate percentage changes
  const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const totalLeadPipeline = contacts.reduce((sum, contact) => 
    sum + Number(contact.potentialValue || 0), 0
  );

  const totalDealPipeline = deals.reduce((sum, deal) => 
    sum + Number(deal.value), 0
  );

  const kpis = [
    {
      title: "Total Contacts",
      value: contacts.length,
      icon: Users,
      trend: { 
        value: calculatePercentChange(currentMonthContacts.length, previousMonthContacts.length), 
        isPositive: currentMonthContacts.length >= previousMonthContacts.length 
      },
      onClick: () => setLocation("/contacts"),
    },
    {
      title: "Lead Pipeline",
      value: `$${(totalLeadPipeline / 1000).toFixed(0)}K`,
      icon: DollarSign,
      trend: { 
        value: calculatePercentChange(currentMonthLeadPipeline, previousMonthLeadPipeline), 
        isPositive: currentMonthLeadPipeline >= previousMonthLeadPipeline 
      },
      onClick: () => setLocation("/contacts"),
    },
    {
      title: "Deal Pipeline",
      value: `$${(totalDealPipeline / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      trend: { 
        value: calculatePercentChange(currentMonthDealPipeline, previousMonthDealPipeline), 
        isPositive: currentMonthDealPipeline >= previousMonthDealPipeline 
      },
      onClick: () => setLocation("/deals"),
    },
    {
      title: "This Month",
      value: currentMonthActivities.length,
      icon: ActivityIcon,
      trend: { 
        value: calculatePercentChange(currentMonthActivities.length, previousMonthActivities.length), 
        isPositive: currentMonthActivities.length >= previousMonthActivities.length 
      },
      onClick: () => setLocation("/reports"),
    },
  ];

  const recentActivities = activities
    .slice(0, 5)
    .map((activity) => ({
      id: activity.id,
      type: activity.type as "call" | "email" | "meeting" | "note",
      title: activity.description || "",
      contact: contacts.find(c => c.id === activity.contactId)?.leadOrProject || "Unknown",
      timestamp: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }),
    }));

  const dealsByStage = (stage: string) => 
    deals
      .filter(d => d.stage.toLowerCase() === stage.toLowerCase())
      .map(deal => ({
        id: deal.id,
        title: deal.title,
        value: Number(deal.value),
        contact: contacts.find(c => c.id === deal.contactId)?.leadOrProject || "Unknown",
      }));

  // Create leads/contacts section for pipeline (filter out $0 value contacts)
  const leadContacts = contacts
    .filter(contact => Number(contact.potentialValue || 0) > 0)
    .map(contact => ({
      id: contact.id,
      title: contact.leadOrProject,
      value: Number(contact.potentialValue || 0),
      contact: contact.primaryContact || contact.company || "No contact",
    }));

  const pipelineData = [
    {
      stage: "Leads",
      deals: leadContacts,
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
        {organization?.name && (
          <h1 className="text-2xl font-semibold mb-1" data-testid="text-hotel-name">
            {organization.name}
          </h1>
        )}
        {!organization?.name && (
          <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        )}
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
