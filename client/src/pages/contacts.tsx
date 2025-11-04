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
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Frontend contact schema without organizationId (security: prevent client from sending orgId)
const clientContactSchema = insertContactSchema.omit({ organizationId: true });
type ClientContact = z.infer<typeof clientContactSchema>;

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const form = useForm<ClientContact>({
    resolver: zodResolver(clientContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "new",
      avatarUrl: null,
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ClientContact) => {
      // Explicitly send only the fields we intend (no organizationId)
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        status: data.status,
        avatarUrl: data.avatarUrl,
      };
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contact");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contact",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ClientContact) => {
    createContactMutation.mutate(data);
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <Button
          data-testid="button-add-contact"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
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
            {searchQuery ? "No contacts found" : "No contacts yet. Add your first contact!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              {...contact}
              avatarUrl={contact.avatarUrl ?? undefined}
              status={contact.status as "new" | "active" | "cold"}
              onEdit={() => console.log("Edit", contact.name)}
            />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>
              Create a new contact in your CRM
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        data-testid="input-contact-name"
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        data-testid="input-contact-email"
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="555-0123"
                        {...field}
                        data-testid="input-contact-phone"
                      />
                    </FormControl>
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
                        data-testid="input-contact-company"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-contact-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-contact"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createContactMutation.isPending}
                  data-testid="button-submit-contact"
                >
                  {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
