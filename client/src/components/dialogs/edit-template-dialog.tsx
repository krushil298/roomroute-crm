import { useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertContractTemplateSchema, insertEmailTemplateSchema } from "@shared/schema";
import type { ContractTemplate, EmailTemplate } from "@shared/schema";
import { Info } from "lucide-react";

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate | EmailTemplate | null;
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

export function EditTemplateDialog({ open, onOpenChange, template, type, onSuccess }: EditTemplateDialogProps) {
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

  useEffect(() => {
    if (template && type === "contract") {
      const contractTemplate = template as ContractTemplate;
      contractForm.reset({
        name: contractTemplate.name,
        type: contractTemplate.type,
        description: contractTemplate.description,
        content: contractTemplate.content,
      });
    } else if (template && type === "email") {
      const emailTemplate = template as EmailTemplate;
      emailForm.reset({
        name: emailTemplate.name,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
      });
    }
  }, [template, type, contractForm, emailForm]);

  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof contractFormSchema> }) =>
      apiRequest("PATCH", `/api/contract-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({
        title: "Template updated",
        description: "Contract template has been updated successfully",
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contract template",
        variant: "destructive",
      });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof emailFormSchema> }) =>
      apiRequest("PATCH", `/api/email-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Template updated",
        description: "Email template has been updated successfully",
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive",
      });
    },
  });

  const onContractSubmit = (data: z.infer<typeof contractFormSchema>) => {
    if (template) {
      updateContractMutation.mutate({ id: template.id, data });
    }
  };

  const onEmailSubmit = (data: z.infer<typeof emailFormSchema>) => {
    if (template) {
      updateEmailMutation.mutate({ id: template.id, data });
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-template">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Update your {type === "contract" ? "contract" : "email"} template
          </DialogDescription>
        </DialogHeader>

        {type === "contract" ? (
          <Form {...contractForm}>
            <form onSubmit={contractForm.handleSubmit(onContractSubmit)} className="space-y-4">
              <FormField
                control={contractForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Standard LNR Agreement" {...field} data-testid="input-edit-contract-name" />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-contract-type">
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
                      <Input placeholder="Brief description of this template" {...field} data-testid="input-edit-contract-description" />
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
                        placeholder="Enter contract content with variable placeholders"
                        className="min-h-[300px] font-mono text-sm"
                        {...field}
                        data-testid="textarea-edit-contract-content"
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
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateContractMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateContractMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Welcome Email" {...field} data-testid="input-edit-email-name" />
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
                      <Input placeholder="e.g., Your Booking at {{hotel_name}}" {...field} data-testid="input-edit-email-subject" />
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
                        placeholder="Enter email body with variable placeholders"
                        className="min-h-[300px]"
                        {...field}
                        data-testid="textarea-edit-email-body"
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
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateEmailMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateEmailMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
