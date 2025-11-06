import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ContractTemplate, EmailTemplate } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PreviewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate | EmailTemplate | null;
  type: "contract" | "email";
}

export function PreviewTemplateDialog({ open, onOpenChange, template, type }: PreviewTemplateDialogProps) {
  if (!template) return null;

  const isContract = type === "contract";
  const contractTemplate = isContract ? (template as ContractTemplate) : null;
  const emailTemplate = !isContract ? (template as EmailTemplate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-preview-template">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
            {isContract && contractTemplate && (
              <Badge variant="outline">
                {contractTemplate.type.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Last updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isContract && contractTemplate && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{contractTemplate.description}</p>
            </div>
          )}

          {!isContract && emailTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Subject</h4>
                <p className="text-sm text-muted-foreground">{emailTemplate.subject}</p>
              </div>
              <Separator />
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">
              {isContract ? "Contract Content" : "Email Body"}
            </h4>
            <ScrollArea className="h-[500px] w-full rounded-md border">
              <div className="p-4">
                {isContract && contractTemplate ? (
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed" data-testid="preview-contract-content">
                    {contractTemplate.content}
                  </pre>
                ) : emailTemplate ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="preview-email-body">
                    {emailTemplate.body}
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
