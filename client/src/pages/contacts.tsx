import { ContactCard } from "@/components/contact-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Clock, Archive } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Contact, InsertContact, Activity } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Frontend contact schema without organizationId (security: prevent client from sending orgId)
const clientContactSchema = z.object({
  leadOrProject: z.string().min(1, "Lead or project name is required"),
  company: z.string().nullable(),
  companyWebsite: z.union([
    z.string().url("Must be a valid URL"),
    z.literal(""),
    z.null()
  ]).optional(),
  segment: z.string().min(1, "Segment is required"),
  primaryContact: z.string().nullable(),
  email: z.union([
    z.string().email("Must be a valid email"),
    z.literal(""),
    z.null()
  ]).optional(),
  phone: z.string().nullable(),
  estRoomNights: z.number().int().positive().nullable(),
  potentialValue: z.number().positive().nullable(),
  avatarUrl: z.string().nullable(),
});
type ClientContact = z.infer<typeof clientContactSchema>;

const BUSINESS_SEGMENTS = [
  "Corporate",
  "SMERF",
  "Group",
  "Construction",
  "Government",
  "Other"
] as const;

const ARCHIVE_REASONS = ["Dead Lead", "Duplicate", "Entered in Error"] as const;

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveReason, setArchiveReason] = useState<string>("");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [showBulkArchiveDialog, setShowBulkArchiveDialog] = useState(false);
  const [bulkArchiveReason, setBulkArchiveReason] = useState<string>("");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">("active");
  const contactsPerPage = 10;
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const form = useForm<ClientContact>({
    resolver: zodResolver(clientContactSchema),
    defaultValues: {
      leadOrProject: "",
      company: null,
      companyWebsite: null,
      segment: "",
      primaryContact: null,
      email: null,
      phone: null,
      estRoomNights: null,
      potentialValue: null,
      avatarUrl: null,
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ClientContact) => {
      const response = await apiRequest("POST", "/api/contacts", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      setIsDialogOpen(false);
      setSelectedContact(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientContact }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      setSelectedContact(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const archiveContactMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}`, {
        archived: true,
        archiveReason: reason,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Lead archived successfully",
      });
      setSelectedContact(null);
      setIsEditMode(false);
      setShowArchiveConfirm(false);
      setArchiveReason("");
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive lead",
        variant: "destructive",
      });
    },
  });

  const bulkArchiveContactsMutation = useMutation({
    mutationFn: async ({ contactIds, reason }: { contactIds: string[]; reason: string }) => {
      const response = await apiRequest("POST", "/api/contacts/bulk-archive", {
        contactIds,
        archiveReason: reason,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: `${selectedContactIds.size} leads archived successfully`,
      });
      setSelectedContactIds(new Set());
      setShowBulkArchiveDialog(false);
      setBulkArchiveReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive leads",
        variant: "destructive",
      });
    },
  });

  const restoreContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}`, {
        archived: false,
        archiveReason: null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Lead restored successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore lead",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ClientContact) => {
    if (isEditMode && selectedContact) {
      updateContactMutation.mutate({ id: selectedContact.id, data });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditMode(false);
    form.reset({
      leadOrProject: contact.leadOrProject,
      company: contact.company,
      segment: contact.segment,
      primaryContact: contact.primaryContact,
      email: contact.email,
      phone: contact.phone,
      estRoomNights: contact.estRoomNights,
      potentialValue: contact.potentialValue ? Number(contact.potentialValue) : null,
      avatarUrl: contact.avatarUrl,
    });
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditMode(true);
    form.reset({
      leadOrProject: contact.leadOrProject,
      company: contact.company,
      companyWebsite: contact.companyWebsite,
      segment: contact.segment,
      primaryContact: contact.primaryContact,
      email: contact.email,
      phone: contact.phone,
      estRoomNights: contact.estRoomNights,
      potentialValue: contact.potentialValue ? Number(contact.potentialValue) : null,
      avatarUrl: contact.avatarUrl,
    });
  };

  const handleNewContact = () => {
    setSelectedContact(null);
    setIsEditMode(false);
    setIsDialogOpen(true);
    form.reset({
      leadOrProject: "",
      company: null,
      segment: "",
      primaryContact: null,
      email: null,
      phone: null,
      estRoomNights: null,
      potentialValue: null,
      avatarUrl: null,
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedContact(null);
    setIsEditMode(false);
    setShowArchiveConfirm(false);
    setArchiveReason("");
    form.reset();
  };

  // Bulk selection handlers
  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContactIds);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContactIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.size === paginatedContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(paginatedContacts.map(c => c.id)));
    }
  };

  const handleBulkArchive = () => {
    if (selectedContactIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one lead to archive",
        variant: "destructive",
      });
      return;
    }
    setShowBulkArchiveDialog(true);
  };

  // Filter and sort contacts alphabetically
  const filteredAndSortedContacts = contacts
    .filter((contact) => {
      // Archive filter
      if (archiveFilter === "active" && contact.archived) return false;
      if (archiveFilter === "archived" && !contact.archived) return false;

      // Search filter
      const search = searchQuery.toLowerCase();
      return (
        contact.leadOrProject.toLowerCase().includes(search) ||
        (contact.company && contact.company.toLowerCase().includes(search)) ||
        (contact.primaryContact && contact.primaryContact.toLowerCase().includes(search)) ||
        (contact.email && contact.email.toLowerCase().includes(search)) ||
        contact.segment.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => a.leadOrProject.localeCompare(b.leadOrProject));

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedContacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  const paginatedContacts = filteredAndSortedContacts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Leads & Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Track your opportunities and customer relationships
          </p>
        </div>
        <Button
          data-testid="button-add-contact"
          onClick={handleNewContact}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            data-testid="input-search-contacts"
          />
        </div>
        <Select value={archiveFilter} onValueChange={(value: "active" | "archived" | "all") => setArchiveFilter(value)}>
          <SelectTrigger className="w-[160px]" data-testid="select-archive-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Leads</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All Leads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {!isLoading && filteredAndSortedContacts.length > 0 && (
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedContactIds.size === paginatedContacts.length && paginatedContacts.length > 0}
              onCheckedChange={toggleSelectAll}
              data-testid="checkbox-select-all"
            />
            <span className="text-sm text-muted-foreground">
              {selectedContactIds.size === 0
                ? "Select leads"
                : `${selectedContactIds.size} selected`}
            </span>
          </div>
          {selectedContactIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkArchive}
              data-testid="button-bulk-archive"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Selected ({selectedContactIds.size})
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : filteredAndSortedContacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? "No leads found" : "No leads yet. Add your first lead!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                {...contact}
                avatarUrl={contact.avatarUrl ?? undefined}
                onEdit={() => handleEditContact(contact)}
                onViewDetails={() => handleViewContact(contact)}
                isSelected={selectedContactIds.has(contact.id)}
                onToggleSelect={toggleContactSelection}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedContacts.length)} of {filteredAndSortedContacts.length} contacts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen || selectedContact !== null} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
        else setIsDialogOpen(open);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Lead" : selectedContact ? "View Lead Details" : "Add Lead"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update lead information" : selectedContact ? "View lead details" : "Create a new lead or project in your CRM"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="leadOrProject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead or Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Bridge rebuild on I-65 W Exit 310-320"
                        {...field}
                        data-testid="input-lead-name"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="segment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Segment *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Corporate, SMERF, Construction, etc."
                        {...field}
                        list="segment-suggestions"
                        data-testid="input-segment"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <datalist id="segment-suggestions">
                      {BUSINESS_SEGMENTS.map((segment) => (
                        <option key={segment} value={segment} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Corp"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-contact-company"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-company-website"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-primary-contact"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-contact-email"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="555-0123"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-contact-phone"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estRoomNights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Room Nights</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? null : parseInt(val, 10));
                        }}
                        data-testid="input-est-room-nights"
                        disabled={selectedContact !== null && !isEditMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedContact && !isEditMode && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4" />
                      Outreach History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activities
                      .filter(a => a.contactId === selectedContact.id)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .length === 0 ? (
                      <p className="text-sm text-muted-foreground">No outreach attempts recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {activities
                          .filter(a => a.contactId === selectedContact.id)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map(activity => (
                            <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                              <div className="flex-1">
                                <p className="text-sm font-medium capitalize">{activity.type}</p>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Archive/Restore Section */}
              {selectedContact && isEditMode && !showArchiveConfirm && (
                <div className="border-t pt-4 mt-6">
                  {selectedContact.archived ? (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => restoreContactMutation.mutate(selectedContact.id)}
                      disabled={restoreContactMutation.isPending}
                      data-testid="button-restore-lead"
                    >
                      {restoreContactMutation.isPending ? "Restoring..." : "Restore Lead"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowArchiveConfirm(true)}
                      data-testid="button-show-archive"
                    >
                      Archive Lead
                    </Button>
                  )}
                </div>
              )}

              {/* Archive Confirmation */}
              {selectedContact && showArchiveConfirm && (
                <div className="border-t pt-4 mt-6 space-y-3">
                  <h3 className="font-medium">Archive Lead</h3>
                  <div className="space-y-2">
                    <Label htmlFor="archive-reason">Reason for archiving *</Label>
                    <Select value={archiveReason} onValueChange={setArchiveReason}>
                      <SelectTrigger id="archive-reason" data-testid="select-archive-reason">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHIVE_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowArchiveConfirm(false);
                        setArchiveReason("");
                      }}
                      data-testid="button-cancel-archive"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        if (!archiveReason) {
                          toast({
                            title: "Error",
                            description: "Please select a reason for archiving",
                            variant: "destructive",
                          });
                          return;
                        }
                        archiveContactMutation.mutate({
                          id: selectedContact.id,
                          reason: archiveReason
                        });
                      }}
                      disabled={archiveContactMutation.isPending || !archiveReason}
                      data-testid="button-confirm-archive"
                    >
                      {archiveContactMutation.isPending ? "Archiving..." : "Confirm Archive"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                {selectedContact && !isEditMode && (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditMode(true);
                    }}
                    data-testid="button-enable-edit"
                  >
                    Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel-contact"
                >
                  {selectedContact && !isEditMode ? "Close" : "Cancel"}
                </Button>
                {(!selectedContact || isEditMode) && !showArchiveConfirm && (
                  <Button
                    type="submit"
                    disabled={createContactMutation.isPending || updateContactMutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    {createContactMutation.isPending || updateContactMutation.isPending
                      ? (isEditMode ? "Updating..." : "Creating...")
                      : (isEditMode ? "Update Lead" : "Create Lead")
                    }
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Archive Dialog */}
      <Dialog open={showBulkArchiveDialog} onOpenChange={setShowBulkArchiveDialog}>
        <DialogContent data-testid="dialog-bulk-archive">
          <DialogHeader>
            <DialogTitle>Archive Multiple Leads</DialogTitle>
            <DialogDescription>
              You are about to archive {selectedContactIds.size} lead{selectedContactIds.size !== 1 ? 's' : ''}.
              Please select a reason for archiving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-archive-reason">Reason for archiving *</Label>
              <Select value={bulkArchiveReason} onValueChange={setBulkArchiveReason}>
                <SelectTrigger id="bulk-archive-reason" data-testid="select-bulk-archive-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {ARCHIVE_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBulkArchiveDialog(false);
                setBulkArchiveReason("");
              }}
              data-testid="button-cancel-bulk-archive"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!bulkArchiveReason) {
                  toast({
                    title: "Error",
                    description: "Please select a reason for archiving",
                    variant: "destructive",
                  });
                  return;
                }
                bulkArchiveContactsMutation.mutate({
                  contactIds: Array.from(selectedContactIds),
                  reason: bulkArchiveReason
                });
              }}
              disabled={bulkArchiveContactsMutation.isPending || !bulkArchiveReason}
              data-testid="button-confirm-bulk-archive"
            >
              {bulkArchiveContactsMutation.isPending ? "Archiving..." : `Archive ${selectedContactIds.size} Lead${selectedContactIds.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
