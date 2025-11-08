import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

type Organization = {
  id: string;
  name: string;
  hotelName?: string;
  city?: string;
  state?: string;
  active?: boolean;
};

export function OrganizationSwitcher() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: user?.role === "super_admin",
  });

  const { data: currentOrg } = useQuery<Organization>({
    queryKey: ["/api/organization/profile"],
    enabled: !!user?.currentOrganizationId || !!user?.organizationId,
  });

  const switchOrgMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch("/api/admin/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (!response.ok) throw new Error("Failed to switch organization");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Organization switched",
        description: "You are now viewing this organization's data",
      });
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch organization",
        variant: "destructive",
      });
    },
  });

  if (user?.role !== "super_admin") {
    return null;
  }

  if (isLoading) {
    return null;
  }

  const currentValue = user?.currentOrganizationId || user?.organizationId;
  const displayValue = currentOrg?.name || currentOrg?.hotelName || "Select organization";

  const activeOrganizations = organizations?.filter(org => org.active !== false) || [];

  return (
    <Select
      value={currentValue || undefined}
      onValueChange={(value) => switchOrgMutation.mutate(value)}
      disabled={switchOrgMutation.isPending}
    >
      <SelectTrigger className="w-[280px] font-semibold" data-testid="select-organization">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue placeholder="Select organization">
            <span className="font-semibold">{displayValue}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {activeOrganizations.map((org) => (
          <SelectItem key={org.id} value={org.id} data-testid={`option-org-${org.id}`} className="py-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm">{org.name || org.hotelName}</span>
              {org.city && org.state && (
                <span className="text-xs text-muted-foreground font-normal">
                  {org.city}, {org.state}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
