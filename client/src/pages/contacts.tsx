import { ContactCard } from "@/components/contact-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Contact, InsertContact } from "@shared/schema";
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
  segment: z.string().min(1, "Segment is required"),
  primaryContact: z.string().nullable(),
  email: z.string().email().nullable().or(z.literal("")),
  phone: z.string().nullable(),
  estRoomNights: z.number().int().positive().nullable(),
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

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const form = useForm<ClientContact>({
    resolver: zodResolver(clientContactSchema),
    defaultValues: {
      leadOrProject: "",
      company: null,
      segment: "",
      primaryContact: null,
      email: null,
      phone: null,
      estRoomNights: null,
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
      avatarUrl: contact.avatarUrl,
    });
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditMode(true);
    form.reset({
      leadOrProject: contact.leadOrProject,
      company: contact.company,
      segment: contact.segment,
      primaryContact: contact.primaryContact,
      email: contact.email,
      phone: contact.phone,
      estRoomNights: contact.estRoomNights,
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
      avatarUrl: null,
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedContact(null);
    setIsEditMode(false);
    form.reset();
  };

  const filteredContacts = contacts.filter((contact) => {
    const search = searchQuery.toLowerCase();
    return (
      contact.leadOrProject.toLowerCase().includes(search) ||
      (contact.company && contact.company.toLowerCase().includes(search)) ||
      (contact.primaryContact && contact.primaryContact.toLowerCase().includes(search)) ||
      (contact.email && contact.email.toLowerCase().includes(search)) ||
      contact.segment.toLowerCase().includes(search)
    );
  });

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-contacts"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? "No leads found" : "No leads yet. Add your first lead!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              {...contact}
              avatarUrl={contact.avatarUrl ?? undefined}
              onEdit={() => handleEditContact(contact)}
              onViewDetails={() => handleViewContact(contact)}
            />
          ))}
        </div>
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
                {(!selectedContact || isEditMode) && (
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
    </div>
  );
}
