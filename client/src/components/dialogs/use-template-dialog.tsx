import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { replaceTemplateVariables } from "@/lib/templateVariables";
import type { ContractTemplate, EmailTemplate, Contact, Deal, Organization, User } from "@shared/schema";
import { Copy, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface UseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate | EmailTemplate | null;
  type: "contract" | "email";
  contactId?: string;
  dealId?: string;
  onCopy?: (content: string) => void;
}

export function UseTemplateDialog({
  open,
  onOpenChange,
  template,
  type,
  contactId,
  dealId,
  onCopy,
}: UseTemplateDialogProps) {
  const [editableContent, setEditableContent] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: contact } = useQuery<Contact>({
    queryKey: ["/api/contacts", contactId],
    enabled: !!contactId,
  });

  const { data: deal } = useQuery<Deal>({
    queryKey: ["/api/deals", dealId],
    enabled: !!dealId,
  });

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization/profile"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  useEffect(() => {
    if (template && open) {
      const isContract = type === "contract";
      const templateContent = isContract
        ? (template as ContractTemplate).content
        : (template as EmailTemplate).body;

      const filled = replaceTemplateVariables(templateContent, {
        organization,
        contact,
        deal,
        user,
      });

      setEditableContent(filled);
      setCopied(false);
    }
  }, [template, type, organization, contact, deal, user, open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Template content has been copied to your clipboard",
      });
      onCopy?.(editableContent);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!template) return null;

  const isContract = type === "contract";
  const emailTemplate = !isContract ? (template as EmailTemplate) : null;
  const filledSubject = emailTemplate
    ? replaceTemplateVariables(emailTemplate.subject, {
        organization,
        contact,
        deal,
        user,
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-use-template">
        <DialogHeader>
          <DialogTitle>Use Template: {template.name}</DialogTitle>
          <DialogDescription>
            Review and customize the template before copying. Variables have been auto-filled with available data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isContract && emailTemplate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <div className="p-3 bg-muted rounded-md text-sm" data-testid="text-filled-subject">
                {filledSubject}
              </div>
              <Separator />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isContract ? "Contract Content" : "Email Body"}
            </label>
            <ScrollArea className="h-[400px]">
              <Textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className={`min-h-[400px] ${isContract ? "font-mono text-xs" : "text-sm"}`}
                data-testid="textarea-use-template"
              />
            </ScrollArea>
          </div>

          <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
            <p>
              Template variables have been automatically filled with data from your organization
              {contact && ", the selected contact"}
              {deal && ", and the associated deal"}.
              You can edit the content above before copying.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-use"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleCopy}
              disabled={copied}
              data-testid="button-copy-template"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
