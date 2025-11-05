import { KPICard } from "@/components/kpi-card";
import { ActivityFeed } from "@/components/activity-feed";
import { QuickActions } from "@/components/quick-actions";
import { PipelineStage } from "@/components/pipeline-stage";
import { Users, TrendingUp, DollarSign, Activity as ActivityIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import type { Contact, Deal, Activity, Organization, ClientInsertDeal } from "@shared/schema";
import { insertDealSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const { toast } = useToast();
  
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

  const editForm = useForm<ClientInsertDeal>({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      title: "",
      value: "0.00",
      stage: "qualified",
      contactId: null,
      expectedCloseDate: null,
      actionDate: null,
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientInsertDeal> }) => {
      const response = await apiRequest("PATCH", `/api/deals/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Success",
        description: "Deal updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingDealId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update deal",
        variant: "destructive",
      });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/deals/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Success",
        description: "Deal deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deal",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = (data: ClientInsertDeal) => {
    if (editingDealId) {
      updateDealMutation.mutate({ id: editingDealId, data });
    }
  };

  const handleDealClick = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (deal) {
      editForm.reset({
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        contactId: deal.contactId,
        expectedCloseDate: deal.expectedCloseDate,
        actionDate: format(new Date(), "yyyy-MM-dd"),
      });
      setEditingDealId(dealId);
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteDeal = (dealId: string) => {
    if (window.confirm("Are you sure you want to delete this deal?")) {
      deleteDealMutation.mutate(dealId);
    }
  };

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
            <PipelineStage 
              key={stage.stage} 
              {...stage} 
              onDealClick={stage.stage !== "Leads" ? handleDealClick : undefined}
              onDeleteDeal={stage.stage !== "Leads" ? handleDeleteDeal : undefined}
            />
          ))}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter deal title" 
                        {...field} 
                        data-testid="input-edit-deal-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-deal-contact">
                          <SelectValue placeholder="Select a contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.leadOrProject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value ($) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-edit-deal-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="actionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value ? (typeof field.value === 'string' ? (field.value as string).split('T')[0] : format(new Date(field.value as Date), "yyyy-MM-dd")) : format(new Date(), "yyyy-MM-dd")}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-edit-deal-action-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-deal-stage">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lead">New</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value ? (typeof field.value === 'string' ? (field.value as string).split('T')[0] : format(new Date(field.value as Date), "yyyy-MM-dd")) : ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-edit-deal-close-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit-deal"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateDealMutation.isPending}
                  data-testid="button-update-deal"
                >
                  {updateDealMutation.isPending ? "Updating..." : "Update Deal"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
