import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, DollarSign, Calendar, User, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Deal, Contact, ClientInsertDeal } from "@shared/schema";
import { insertDealSchema } from "@shared/schema";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Deals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const { toast} = useToast();

  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const form = useForm<ClientInsertDeal>({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      title: "",
      value: "0.00",
      stage: "qualified",
      contactId: null,
      expectedCloseDate: null,
    },
  });

  const editForm = useForm<ClientInsertDeal>({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      title: "",
      value: "0.00",
      stage: "qualified",
      contactId: null,
      expectedCloseDate: null,
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: ClientInsertDeal) => {
      const response = await apiRequest("POST", "/api/deals", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Success",
        description: "Deal created successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
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

  const handleSubmit = (data: ClientInsertDeal) => {
    createDealMutation.mutate(data);
  };

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

  const dealsWithContactNames = deals.map(deal => ({
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    stage: deal.stage,
    contact: contacts.find(c => c.id === deal.contactId)?.leadOrProject || "No contact",
    closingDate: deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), "MMM dd, yyyy") : "No date",
  }));

  const filteredDeals = searchQuery
    ? dealsWithContactNames.filter(deal =>
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.contact.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dealsWithContactNames;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Deals</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your opportunities
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-new-deal">
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deals..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-deals"
        />
      </div>

      {dealsLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading deals...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "No deals match your search" : "No deals yet. Click 'Add Deal' to create your first deal."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => {
            const stageColors: Record<string, string> = {
              lead: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              qualified: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
              proposal: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
              negotiation: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
              closed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            };
            
            return (
              <Card key={deal.id} className="p-6 hover-elevate" data-testid={`card-deal-${deal.id}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{deal.title}</h3>
                    <Badge className={stageColors[deal.stage.toLowerCase()] || stageColors.lead}>
                      {deal.stage}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-deal-menu-${deal.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDealClick(deal.id)} data-testid={`menu-edit-${deal.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Deal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => handleDeleteDeal(deal.id)}
                        data-testid={`menu-delete-${deal.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Deal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold tabular-nums" data-testid={`text-deal-value-${deal.id}`}>
                      ${deal.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span>{deal.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{deal.closingDate}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter deal title" 
                        {...field} 
                        data-testid="input-deal-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-deal-contact">
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
                control={form.control}
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
                        data-testid="input-deal-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-deal-stage">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                control={form.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value ? (typeof field.value === 'string' ? (field.value as string).split('T')[0] : format(new Date(field.value as Date), "yyyy-MM-dd")) : ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-deal-close-date"
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
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-deal"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createDealMutation.isPending}
                  data-testid="button-save-deal"
                >
                  {createDealMutation.isPending ? "Creating..." : "Create Deal"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
