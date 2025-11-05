import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Organization, User } from "@shared/schema";
import { Building2, Save, Archive, ArchiveRestore } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const organizationProfileSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  numberOfRooms: z.preprocess(
    (val) => val === "" || val === null || val === undefined ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.preprocess(
    (val) => val === "" || val === null || val === undefined ? null : val,
    z.string().email("Invalid email").nullable().optional()
  ),
  hasMeetingRooms: z.boolean().optional(),
  meetingRoomCapacity: z.preprocess(
    (val) => val === "" || val === null || val === undefined ? null : Number(val),
    z.number().int().positive().nullable().optional()
  ),
  meetingRoomDetails: z.string().optional().nullable(),
});

type OrganizationProfile = z.infer<typeof organizationProfileSchema>;

export default function Settings() {
  const { toast } = useToast();

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organization/profile"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const form = useForm<OrganizationProfile>({
    resolver: zodResolver(organizationProfileSchema),
    values: organization ? {
      name: organization.name,
      numberOfRooms: organization.numberOfRooms,
      address: organization.address,
      city: organization.city,
      state: organization.state,
      zipCode: organization.zipCode,
      country: organization.country,
      contactName: organization.contactName,
      contactPhone: organization.contactPhone,
      contactEmail: organization.contactEmail,
      hasMeetingRooms: organization.hasMeetingRooms || false,
      meetingRoomCapacity: organization.meetingRoomCapacity,
      meetingRoomDetails: organization.meetingRoomDetails,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OrganizationProfile) => {
      console.log("Sending organization update:", JSON.stringify(data, null, 2));
      return await apiRequest("PATCH", "/api/organization/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/profile"] });
      toast({
        title: "Success",
        description: "Hotel profile updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Organization update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrganizationProfile) => {
    console.log("Form submitted with data:", JSON.stringify(data, null, 2));
    console.log("Form errors:", form.formState.errors);
    updateMutation.mutate(data);
  };

  const archiveMutation = useMutation({
    mutationFn: async (active: boolean) => {
      if (!organization?.id) throw new Error("No organization ID");
      return await apiRequest("PATCH", `/api/admin/organizations/${organization.id}/archive`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/profile"] });
      toast({
        title: "Success",
        description: organization?.active 
          ? "Hotel has been archived. Users will no longer be able to access it." 
          : "Hotel has been restored and is now active.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization status",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Hotel Profile Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your hotel information and contact details
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Hotel name and property details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  data-testid="input-hotel-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                <Input
                  id="numberOfRooms"
                  type="number"
                  {...form.register("numberOfRooms")}
                  data-testid="input-number-of-rooms"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Hotel location information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                {...form.register("address")}
                placeholder="123 Main St"
                data-testid="input-address"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...form.register("city")}
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  {...form.register("state")}
                  data-testid="input-state"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  {...form.register("zipCode")}
                  data-testid="input-zip"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...form.register("country")}
                  data-testid="input-country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact for the hotel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                {...form.register("contactName")}
                data-testid="input-contact-name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  {...form.register("contactPhone")}
                  data-testid="input-contact-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...form.register("contactEmail")}
                  data-testid="input-contact-email"
                />
                {form.formState.errors.contactEmail && (
                  <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Rooms</CardTitle>
            <CardDescription>Information about meeting and event spaces</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hasMeetingRooms">Has Meeting Rooms</Label>
                <p className="text-sm text-muted-foreground">
                  Does your hotel have meeting or event spaces?
                </p>
              </div>
              <Switch
                id="hasMeetingRooms"
                checked={form.watch("hasMeetingRooms") || false}
                onCheckedChange={(checked) => form.setValue("hasMeetingRooms", checked)}
                data-testid="switch-has-meeting-rooms"
              />
            </div>
            
            {form.watch("hasMeetingRooms") && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="meetingRoomCapacity">Maximum Capacity</Label>
                  <Input
                    id="meetingRoomCapacity"
                    type="number"
                    {...form.register("meetingRoomCapacity")}
                    placeholder="Total people capacity"
                    data-testid="input-meeting-room-capacity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingRoomDetails">Meeting Room Details</Label>
                  <Textarea
                    id="meetingRoomDetails"
                    {...form.register("meetingRoomDetails")}
                    placeholder="Describe your meeting spaces, equipment available, etc."
                    rows={4}
                    data-testid="textarea-meeting-room-details"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {user?.role === "super_admin" && organization && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Archive this organization to prevent users from accessing it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={organization.active ? "destructive" : "default"}
                  data-testid="button-archive-organization"
                >
                  {organization.active ? (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Organization
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Restore Organization
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {organization.active ? "Archive Organization?" : "Restore Organization?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {organization.active 
                      ? "This will prevent all users from accessing this organization. The organization will be hidden from the organization switcher and users won't be able to log in. You can restore it later."
                      : "This will restore access to this organization. Users will be able to log in and the organization will appear in the organization switcher."
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-archive">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => archiveMutation.mutate(!organization.active)}
                    data-testid="button-confirm-archive"
                  >
                    {organization.active ? "Archive" : "Restore"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
