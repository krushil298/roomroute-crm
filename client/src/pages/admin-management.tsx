import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Organization } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArchiveRestore, UserCheck, Building2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminManagement() {
  const [confirmArchiveRestore, setConfirmArchiveRestore] = useState<{ id: string; name: string; action: 'archive' | 'restore' } | null>(null);
  const [confirmUserAction, setConfirmUserAction] = useState<{ userId: string; orgId: string; email: string; action: 'activate' | 'deactivate' } | null>(null);
  const { toast } = useToast();

  const { data: allOrganizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/all-organizations"],
  });

  const { data: deactivatedUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/deactivated-users"],
  });

  const { data: allActiveUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/all-users"],
  });

  const activeOrgs = allOrganizations.filter(org => org.active);
  const archivedOrgs = allOrganizations.filter(org => !org.active);

  const toggleOrgArchiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/organizations/${id}`, { active });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Success",
        description: variables.active ? "Organization restored successfully" : "Organization archived successfully",
      });
      setConfirmArchiveRestore(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    },
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, orgId, active }: { userId: string; orgId: string; active: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/organizations/${orgId}`, { active });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deactivated-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-users"] });
      toast({
        title: "Success",
        description: variables.active ? "User reactivated successfully" : "User deactivated successfully",
      });
      setConfirmUserAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/cleanup-archived-org-users", {});
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deactivated-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-users"] });
      toast({
        title: "Cleanup Complete",
        description: `Deactivated ${data.count} user(s) from archived organizations`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup users",
        variant: "destructive",
      });
    },
  });

  const handleArchiveOrg = (id: string, name: string) => {
    setConfirmArchiveRestore({ id, name, action: 'archive' });
  };

  const handleRestoreOrg = (id: string, name: string) => {
    setConfirmArchiveRestore({ id, name, action: 'restore' });
  };

  const handleActivateUser = (userId: string, orgId: string, email: string) => {
    setConfirmUserAction({ userId, orgId, email, action: 'activate' });
  };

  const handleDeactivateUser = (userId: string, orgId: string, email: string) => {
    setConfirmUserAction({ userId, orgId, email, action: 'deactivate' });
  };

  const confirmOrgAction = () => {
    if (confirmArchiveRestore) {
      toggleOrgArchiveMutation.mutate({
        id: confirmArchiveRestore.id,
        active: confirmArchiveRestore.action === 'restore',
      });
    }
  };

  const confirmUserActionFn = () => {
    if (confirmUserAction) {
      toggleUserActiveMutation.mutate({
        userId: confirmUserAction.userId,
        orgId: confirmUserAction.orgId,
        active: confirmUserAction.action === 'activate',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Admin Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage archived organizations and deactivated users
        </p>
      </div>

      {/* Archived Organizations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Archived Organizations</CardTitle>
            <Badge variant="secondary">{archivedOrgs.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {archivedOrgs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No archived organizations
            </p>
          ) : (
            <div className="space-y-2">
              {archivedOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`row-archived-org-${org.id}`}
                >
                  <div>
                    <p className="font-medium" data-testid={`text-org-name-${org.id}`}>
                      {org.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Archived
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestoreOrg(org.id, org.name)}
                    data-testid={`button-restore-org-${org.id}`}
                  >
                    <ArchiveRestore className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Active Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <CardTitle>All Active Users</CardTitle>
              <Badge variant="default">{allActiveUsers.length}</Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              data-testid="button-cleanup-archived-users"
            >
              {cleanupMutation.isPending ? "Cleaning up..." : "Cleanup Archived Org Users"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allActiveUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active users
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allActiveUsers.map((userOrg: any) => (
                <div
                  key={`${userOrg.userId}-${userOrg.organizationId}`}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`row-active-user-${userOrg.userId}`}
                >
                  <div className="flex-1">
                    <p className="font-medium" data-testid={`text-active-user-email-${userOrg.userId}`}>
                      {userOrg.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userOrg.firstName} {userOrg.lastName} • {userOrg.orgName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Role: <Badge variant="secondary" className="text-xs">{userOrg.role}</Badge>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeactivateUser(userOrg.userId, userOrg.organizationId, userOrg.email)}
                    data-testid={`button-deactivate-user-${userOrg.userId}`}
                  >
                    Deactivate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deactivated Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Deactivated Users</CardTitle>
            <Badge variant="secondary">{deactivatedUsers.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {deactivatedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No deactivated users
            </p>
          ) : (
            <div className="space-y-2">
              {deactivatedUsers.map((userOrg: any) => {
                // Check if the organization is archived
                const org = allOrganizations.find(o => o.id === userOrg.organizationId);
                const isOrgArchived = org && !org.active;
                
                return (
                  <div
                    key={`${userOrg.userId}-${userOrg.organizationId}`}
                    className="flex items-center justify-between p-3 border rounded-md"
                    data-testid={`row-deactivated-user-${userOrg.userId}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-user-email-${userOrg.userId}`}>
                        {userOrg.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userOrg.firstName} {userOrg.lastName} • {userOrg.orgName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Role: {userOrg.role}
                      </p>
                      {isOrgArchived && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Organization is archived - restore org first
                        </p>
                      )}
                    </div>
                    {!isOrgArchived ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivateUser(userOrg.userId, userOrg.organizationId, userOrg.email)}
                        data-testid={`button-activate-user-${userOrg.userId}`}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Reactivate
                      </Button>
                    ) : (
                      <Badge variant="secondary">Org Archived</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Organizations for Reference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Active Organizations</CardTitle>
            <Badge variant="default">{activeOrgs.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activeOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-3 border rounded-md"
                data-testid={`row-active-org-${org.id}`}
              >
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Active
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleArchiveOrg(org.id, org.name)}
                  data-testid={`button-archive-org-${org.id}`}
                >
                  <ArchiveRestore className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Archive/Restore Confirmation Dialog */}
      <Dialog open={!!confirmArchiveRestore} onOpenChange={() => setConfirmArchiveRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmArchiveRestore?.action === 'archive' ? 'Archive' : 'Restore'} Organization
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmArchiveRestore?.action} "{confirmArchiveRestore?.name}"?
              {confirmArchiveRestore?.action === 'archive' && (
                <span className="block mt-2 text-destructive">
                  Users will not be able to access this organization while it's archived.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmArchiveRestore(null)}
              data-testid="button-cancel-org-action"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmOrgAction}
              disabled={toggleOrgArchiveMutation.isPending}
              data-testid="button-confirm-org-action"
            >
              {toggleOrgArchiveMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Activation Confirmation Dialog */}
      <Dialog open={!!confirmUserAction} onOpenChange={() => setConfirmUserAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmUserAction?.action === 'activate' ? 'Reactivate' : 'Deactivate'} User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmUserAction?.action} "{confirmUserAction?.email}"?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmUserAction(null)}
              data-testid="button-cancel-user-action"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUserActionFn}
              disabled={toggleUserActiveMutation.isPending}
              data-testid="button-confirm-user-action"
            >
              {toggleUserActiveMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
