import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertContractTemplateSchema, insertEmailTemplateSchema } from "@shared/schema";
import { Info } from "lucide-react";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "contract" | "email";
  onSuccess?: () => void;
}

const contractFormSchema = insertContractTemplateSchema.omit({ organizationId: true });
const emailFormSchema = insertEmailTemplateSchema.omit({ organizationId: true });

const AVAILABLE_VARIABLES = [
  { category: "Hotel/Organization", vars: ["{{hotel_legal_name}}", "{{hotel_brand_name}}", "{{hotel_name}}", "{{hotel_address}}", "{{hotel_city}}", "{{hotel_state}}", "{{hotel_zip}}", "{{hotel_full_address}}", "{{hotel_contact_name}}", "{{hotel_contact_email}}", "{{hotel_contact_phone}}"] },
  { category: "Contact/Company", vars: ["{{company_legal_name}}", "{{company_name}}", "{{company_address}}", "{{company_city}}", "{{company_state}}", "{{company_zip}}", "{{company_full_address}}", "{{first_name}}", "{{last_name}}", "{{full_name}}", "{{contact_email}}", "{{contact_phone}}"] },
  { category: "User/Salesperson", vars: ["{{your_name}}", "{{your_first_name}}", "{{your_email}}", "{{your_title}}", "{{your_mobile}}"] },
  { category: "Deal/Event", vars: ["{{event_name}}", "{{event_dates}}", "{{deal_value}}"] },
  { category: "Dates (Manual)", vars: ["{{date}}", "{{effective_date}}", "{{expiration_date}}", "{{cut_off_date}}"] },
];

export function CreateTemplateDialog({ open, onOpenChange, type, onSuccess }: CreateTemplateDialogProps) {
  const [activeTab, setActiveTab] = useState("contract");
  const { toast } = useToast();

  const contractForm = useForm<z.infer<typeof contractFormSchema>>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      name: "",
      type: "lnr",
      description: "",
      content: "",
    },
  });

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
    },
  });

  const createContractMutation = useMutation({
    mutationFn: (data: z.infer<typeof contractFormSchema>) =>
      apiRequest("POST", "/api/contract-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({
        title: "Template created",
        description: "Contract template has been created successfully",
      });
      contractForm.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contract template",
        variant: "destructive",
      });
    },
  });

  const createEmailMutation = useMutation({
    mutationFn: (data: z.infer<typeof emailFormSchema>) =>
      apiRequest("POST", "/api/email-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Template created",
        description: "Email template has been created successfully",
      });
      emailForm.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create email template",
        variant: "destructive",
      });
    },
  });

  const onContractSubmit = (data: z.infer<typeof contractFormSchema>) => {
    createContractMutation.mutate(data);
  };

  const onEmailSubmit = (data: z.infer<typeof emailFormSchema>) => {
    createEmailMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-template">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
          <DialogDescription>
            Create a new contract or email template with variable placeholders
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type === "contract" ? activeTab : "email"} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contract" data-testid="tab-create-contract">Contract Template</TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-create-email">Email Template</TabsTrigger>
          </TabsList>

          <TabsContent value="contract" className="space-y-4">
            <Form {...contractForm}>
              <form onSubmit={contractForm.handleSubmit(onContractSubmit)} className="space-y-4">
                <FormField
                  control={contractForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Standard LNR Agreement" {...field} data-testid="input-contract-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contractForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contract-type">
                            <SelectValue placeholder="Select contract type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lnr">LNR (Local Negotiated Rate)</SelectItem>
                          <SelectItem value="group">Group Booking</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contractForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of this template" {...field} data-testid="input-contract-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contractForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter contract content with variable placeholders like {{hotel_name}}, {{company_name}}, etc."
                          className="min-h-[300px] font-mono text-sm"
                          {...field}
                          data-testid="textarea-contract-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-md space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Available Template Variables</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {AVAILABLE_VARIABLES.map((group) => (
                      <div key={group.category}>
                        <h5 className="font-medium mb-1 text-muted-foreground">{group.category}</h5>
                        <div className="space-y-0.5">
                          {group.vars.map((v) => (
                            <div key={v} className="font-mono text-xs">{v}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-cancel-contract"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createContractMutation.isPending}
                    data-testid="button-submit-contract"
                  >
                    {createContractMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Welcome Email" {...field} data-testid="input-email-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Your Booking at {{hotel_name}}" {...field} data-testid="input-email-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter email body with variable placeholders like {{first_name}}, {{hotel_name}}, etc."
                          className="min-h-[300px]"
                          {...field}
                          data-testid="textarea-email-body"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-md space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Available Template Variables</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {AVAILABLE_VARIABLES.map((group) => (
                      <div key={group.category}>
                        <h5 className="font-medium mb-1 text-muted-foreground">{group.category}</h5>
                        <div className="space-y-0.5">
                          {group.vars.map((v) => (
                            <div key={v} className="font-mono text-xs">{v}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-cancel-email"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmailMutation.isPending}
                    data-testid="button-submit-email"
                  >
                    {createEmailMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
