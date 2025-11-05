import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Building2, DollarSign, Activity, Users } from "lucide-react";

type RollupStats = {
  activeHotels: number;
  totalOutreachAttempts: number;
  pipeline: {
    leads: { count: number; value: number };
    qualified: { count: number; value: number };
    proposal: { count: number; value: number };
    negotiation: { count: number; value: number };
    closed: { count: number; value: number };
  };
};

export default function AdminOverview() {
  const { data: stats, isLoading } = useQuery<RollupStats>({
    queryKey: ["/api/admin/rollup-stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading overview...</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const totalPipelineValue =
    (stats?.pipeline.leads.value || 0) +
    (stats?.pipeline.qualified.value || 0) +
    (stats?.pipeline.proposal.value || 0) +
    (stats?.pipeline.negotiation.value || 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1" data-testid="heading-admin-overview">
          Super Admin Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Aggregated data across all active hotels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-active-hotels">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Hotels</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeHotels || 0}</div>
            <p className="text-xs text-muted-foreground">Organizations in system</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-outreach">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outreach</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOutreachAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">All-time activities</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pipeline.leads.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.pipeline.leads.value || 0)} potential
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pipeline-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">Active opportunities</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aggregated Pipeline Overview</CardTitle>
          <CardDescription>Deal stages across all hotels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Leads</span>
                <Badge variant="secondary">{stats?.pipeline.leads.count || 0}</Badge>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.pipeline.leads.value || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Contact potential</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualified</span>
                <Badge variant="secondary">{stats?.pipeline.qualified.count || 0}</Badge>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.pipeline.qualified.value || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Qualified deals</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proposal</span>
                <Badge variant="secondary">{stats?.pipeline.proposal.count || 0}</Badge>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.pipeline.proposal.value || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Proposals sent</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Negotiation</span>
                <Badge variant="secondary">{stats?.pipeline.negotiation.count || 0}</Badge>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.pipeline.negotiation.value || 0)}
              </div>
              <p className="text-xs text-muted-foreground">In negotiation</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Closed</span>
                <Badge variant="secondary">{stats?.pipeline.closed.count || 0}</Badge>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.pipeline.closed.value || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Won business</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
