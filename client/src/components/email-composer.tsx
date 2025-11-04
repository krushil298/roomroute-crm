import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailTemplate } from "@shared/schema";

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail?: string;
  recipientName?: string;
}

export function EmailComposer({
  open,
  onOpenChange,
  recipientEmail = "",
  recipientName = "",
}: EmailComposerProps) {
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && recipientEmail) {
      setTo(recipientEmail);
    }
  }, [open, recipientEmail]);

  const { data: emailTemplates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
    enabled: open,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: { to: string; subject: string; body: string }) => {
      return await apiRequest("/api/send-email", {
        method: "POST",
        body: JSON.stringify(emailData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully",
      });
      onOpenChange(false);
      setSubject("");
      setBody("");
      setSelectedTemplate("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body.replace(/\[Name\]/g, recipientName || ""));
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = () => {
    if (!to || !subject || !body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate({ to, subject, body });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template" className="text-xs font-medium uppercase tracking-wide">
              Email Template
            </Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger data-testid="select-email-template">
                <SelectValue placeholder="Choose a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="text-xs font-medium uppercase tracking-wide">
              To
            </Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              data-testid="input-email-to"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-xs font-medium uppercase tracking-wide">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              data-testid="input-email-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body" className="text-xs font-medium uppercase tracking-wide">
              Message
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[300px]"
              data-testid="textarea-email-body"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-email"
            disabled={sendEmailMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            data-testid="button-send-email"
            disabled={sendEmailMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
