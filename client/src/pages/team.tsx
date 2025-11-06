import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Mail, Shield, User, Ban, RefreshCw, X, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TeamMember = {
  userId: string;
  organizationId: string;
  role: "user" | "admin";
  active: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type Organization = {
  id: string;
  name: string;
};

type Invitation = {
  id: string;
  email: string;
  role: "user" | "admin";
  status: string;
  sentAt: string;
  acceptedAt?: string;
  organizationId: string;
  invitedBy: string;
  inviterFirstName?: string;
  inviterLastName?: string;
  inviterEmail?: string;
  orgName?: string; // For super admins viewing all invitations
};

export default function Team() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/team/invitations"],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: isSuperAdmin,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const body: any = { email, role: inviteRole };
      // Only include organizationId if super admin selected an actual organization
      // "__none__" means "no organization - user will create their own"
      if (isSuperAdmin && selectedOrganizationId && selectedOrganizationId !== "__none__") {
        body.organizationId = selectedOrganizationId;
      }
      
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to send invitation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      });
      setEmail("");
      setInviteRole("user");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/team/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to deactivate user");
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: "User deactivated",
        description: "The user has been deactivated and can no longer access the system",
      });
      setDeactivateUserId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive",
      });
      setDeactivateUserId(null);
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/team/invitations/${invitationId}/resend`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to resend invitation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
      toast({
        title: "Invitation resent",
        description: "The invitation email has been resent",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to cancel invitation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/team/${userId}/reactivate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reactivate user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: "User reactivated",
        description: "The user has been reactivated and can now access the system",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reactivate user",
        variant: "destructive",
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate();
  };

  // User is admin if they are super_admin OR if they are an admin in their current organization
  // Note: Organization creators are automatically admins
  const isUserAdmin = user?.role === "super_admin" || user?.role === "admin" || teamMembers?.find(m => m.userId === user?.id)?.role === "admin";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-team">Team Management</h1>
        <p className="text-muted-foreground">
          Manage your team members and their roles
        </p>
      </div>

      {isUserAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Team Member
            </CardTitle>
            <CardDescription>
              Send an invitation email to add a new team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Select value={selectedOrganizationId || "__none__"} onValueChange={setSelectedOrganizationId}>
                    <SelectTrigger id="organization" data-testid="select-invite-organization">
                      <SelectValue placeholder="No organization - user will create their own" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" data-testid="option-org-none">
                        No organization - user will create their own
                      </SelectItem>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id} data-testid={`option-org-${org.id}`}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-invite-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v: "user" | "admin") => setInviteRole(v)}>
                    <SelectTrigger id="role" data-testid="select-invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user" data-testid="option-role-user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          User
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" data-testid="option-role-admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={inviteMutation.isPending || !email}
                data-testid="button-invite-team"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members & Invitations</CardTitle>
          <CardDescription>
            {teamMembers?.length || 0} active member{teamMembers?.length !== 1 ? "s" : ""} • {invitations?.filter(inv => inv.status === "pending").length || 0} pending invitation{invitations?.filter(inv => inv.status === "pending").length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isLoading || invitationsLoading) ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading team members...
            </div>
          ) : (!teamMembers || teamMembers.length === 0) && (!invitations || invitations.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              No team members or invitations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Email</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isSuperAdmin && <TableHead>Organization</TableHead>}
                  {isUserAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Active Team Members */}
                {teamMembers?.filter(m => m.active).map((member) => {
                  const displayName = member.firstName && member.lastName
                    ? `${member.firstName} ${member.lastName}`
                    : member.email || "Unknown";
                  
                  return (
                    <TableRow key={`user-${member.userId}`} data-testid={`row-user-${member.userId}`}>
                      <TableCell className="font-medium" data-testid={`text-user-name-${member.userId}`}>
                        {displayName}
                      </TableCell>
                      <TableCell data-testid={`text-user-email-${member.userId}`}>
                        {member.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "admin" ? "default" : "secondary"}
                          data-testid={`badge-role-${member.userId}`}
                        >
                          {member.role === "admin" ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          data-testid={`badge-status-${member.userId}`}
                        >
                          Active
                        </Badge>
                      </TableCell>
                      {isSuperAdmin && <TableCell>-</TableCell>}
                      {isUserAdmin && (
                        <TableCell className="text-right">
                          {member.userId !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeactivateUserId(member.userId)}
                              data-testid={`button-deactivate-${member.userId}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                
                {/* Pending Invitations */}
                {invitations?.filter(inv => inv.status === "pending").map((invitation) => {
                  const inviterName = invitation.inviterFirstName && invitation.inviterLastName
                    ? `${invitation.inviterFirstName} ${invitation.inviterLastName}`
                    : invitation.inviterEmail || "Unknown";
                  
                  return (
                    <TableRow key={`invitation-${invitation.id}`} data-testid={`row-invitation-${invitation.id}`}>
                      <TableCell className="font-medium text-muted-foreground" data-testid={`text-invitation-email-${invitation.id}`}>
                        {invitation.email}
                        <div className="text-xs mt-1">Invited by {inviterName}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={invitation.role === "admin" ? "default" : "secondary"}
                          data-testid={`badge-role-invitation-${invitation.id}`}
                        >
                          {invitation.role === "admin" ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-amber-600 dark:text-amber-400"
                          data-testid={`badge-status-invitation-${invitation.id}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-muted-foreground text-sm">
                          {invitation.orgName || "-"}
                        </TableCell>
                      )}
                      {isUserAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendInvitationMutation.mutate(invitation.id)}
                              disabled={resendInvitationMutation.isPending}
                              data-testid={`button-resend-invitation-${invitation.id}`}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                              disabled={cancelInvitationMutation.isPending}
                              data-testid={`button-cancel-invitation-${invitation.id}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deactivated Users Section */}
      {isUserAdmin && teamMembers && teamMembers.filter(m => !m.active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deactivated Users</CardTitle>
            <CardDescription>
              {teamMembers?.filter(m => !m.active).length || 0} deactivated user{teamMembers?.filter(m => !m.active).length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Email</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isSuperAdmin && <TableHead>Organization</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers?.filter(m => !m.active).map((member) => {
                  const displayName = member.firstName && member.lastName
                    ? `${member.firstName} ${member.lastName}`
                    : member.email || "Unknown";
                  
                  return (
                    <TableRow key={`deactivated-user-${member.userId}`} data-testid={`row-deactivated-user-${member.userId}`}>
                      <TableCell className="font-medium text-muted-foreground" data-testid={`text-deactivated-user-name-${member.userId}`}>
                        {displayName}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-deactivated-user-email-${member.userId}`}>
                        {member.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "admin" ? "default" : "secondary"}
                          data-testid={`badge-deactivated-role-${member.userId}`}
                        >
                          {member.role === "admin" ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="destructive"
                          data-testid={`badge-deactivated-status-${member.userId}`}
                        >
                          Inactive
                        </Badge>
                      </TableCell>
                      {isSuperAdmin && <TableCell>-</TableCell>}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reactivateMutation.mutate(member.userId)}
                          disabled={reactivateMutation.isPending}
                          data-testid={`button-reactivate-${member.userId}`}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deactivateUserId} onOpenChange={(open) => !open && setDeactivateUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              This user will lose access to the system immediately. Their data will be preserved.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-deactivate">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateUserId && deactivateMutation.mutate(deactivateUserId)}
              data-testid="button-confirm-deactivate"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
