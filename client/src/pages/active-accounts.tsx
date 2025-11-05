import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { FileText, Upload, Edit, RotateCcw, DollarSign, Calendar, User } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function ActiveAccounts() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [uploadingDealId, setUploadingDealId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: allDeals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Filter only closed deals
  const closedDeals = allDeals.filter(deal => deal.stage?.toLowerCase() === "closed");

  const editForm = useForm<ClientInsertDeal>({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      title: "",
      value: "0.00",
      stage: "closed",
      contactId: null,
      expectedCloseDate: null,
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
        description: "Account updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingDealId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    },
  });

  const uploadContractMutation = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const contractResponse = await apiRequest("PUT", "/api/contracts", { contractUrl: url });
      const { objectPath } = await contractResponse.json();
      
      const response = await apiRequest("PATCH", `/api/deals/${id}`, { contractUrl: objectPath });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Success",
        description: "Contract uploaded successfully",
      });
      setIsUploadDialogOpen(false);
      setUploadingDealId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload contract",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = (data: ClientInsertDeal) => {
    if (editingDealId) {
      updateDealMutation.mutate({ id: editingDealId, data });
    }
  };

  const handleEditDeal = (dealId: string) => {
    const deal = allDeals.find((d) => d.id === dealId);
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

  const handleReopenDeal = (dealId: string) => {
    updateDealMutation.mutate({ 
      id: dealId, 
      data: { stage: "qualified" } 
    });
  };

  const handleUploadContract = (dealId: string) => {
    setUploadingDealId(dealId);
    setIsUploadDialogOpen(true);
  };

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
    });
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0 && uploadingDealId) {
      const uploadedUrl = result.successful[0].uploadURL;
      if (uploadedUrl) {
        uploadContractMutation.mutate({
          id: uploadingDealId,
          url: uploadedUrl,
        });
      }
    }
  };

  const totalValue = closedDeals.reduce((sum, deal) => sum + Number(deal.value), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Active Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Closed deals with active contracts - Total Value: <span className="font-semibold tabular-nums">${totalValue.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {closedDeals.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No active accounts yet. Close a deal to see it here.</p>
            </Card>
          </div>
        ) : (
          closedDeals.map((deal) => {
            const contact = contacts.find(c => c.id === deal.contactId);
            return (
              <Card key={deal.id} className="hover-elevate" data-testid={`card-active-account-${deal.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-2" data-testid={`text-account-title-${deal.id}`}>
                      {deal.title}
                    </h3>
                    {contact && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {contact.leadOrProject}
                      </p>
                    )}
                  </div>
                  <Badge variant="default" className="shrink-0">Active</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xl font-bold text-primary">
                    <DollarSign className="h-5 w-5" />
                    <span className="tabular-nums">${Number(deal.value).toLocaleString()}</span>
                  </div>
                  
                  {deal.expectedCloseDate && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Closed: {format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}
                    </p>
                  )}

                  {deal.contractUrl && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <a 
                        href={deal.contractUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                        data-testid={`link-contract-${deal.id}`}
                      >
                        View Contract
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEditDeal(deal.id)}
                      data-testid={`button-edit-account-${deal.id}`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUploadContract(deal.id)}
                      data-testid={`button-upload-contract-${deal.id}`}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {deal.contractUrl ? "Update" : "Upload"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReopenDeal(deal.id)}
                      data-testid={`button-reopen-${deal.id}`}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reopen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Active Account</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter account title" 
                        {...field} 
                        data-testid="input-edit-account-title"
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
                        <SelectTrigger data-testid="select-edit-account-contact">
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
                    <FormLabel>Account Value ($) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-edit-account-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closed Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value ? (typeof field.value === 'string' ? (field.value as string).split('T')[0] : format(new Date(field.value as Date), "yyyy-MM-dd")) : ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-edit-account-close-date"
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
                  data-testid="button-cancel-edit-account"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateDealMutation.isPending}
                  data-testid="button-update-account"
                >
                  {updateDealMutation.isPending ? "Updating..." : "Update Account"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Upload Contract Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload a signed contract file (PDF, Word, etc.) to securely store with this account.
              </p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Contract File
              </ObjectUploader>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setUploadingDealId(null);
                }}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
