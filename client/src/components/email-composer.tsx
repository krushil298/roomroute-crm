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
import { useState } from "react";

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail?: string;
  recipientName?: string;
}

const emailTemplates = [
  {
    id: "intro",
    name: "Introduction Email",
    subject: "Great to connect with you",
    body: `Dear [Name],

It was wonderful speaking with you today. I wanted to follow up on our conversation and provide you with some additional information about our services.

We specialize in helping businesses like yours achieve their goals through our comprehensive solutions. I believe we can add significant value to your operations.

Would you be available for a brief call next week to discuss this further?

Best regards,
[Your Name]`,
  },
  {
    id: "followup",
    name: "Follow-up Email",
    subject: "Following up on our conversation",
    body: `Hi [Name],

I wanted to follow up on our previous discussion and see if you had any questions about the proposal I sent over.

I'm here to help clarify any details and discuss how we can move forward together.

Looking forward to hearing from you.

Best,
[Your Name]`,
  },
  {
    id: "proposal",
    name: "Proposal Email",
    subject: "Proposal for your review",
    body: `Dear [Name],

Thank you for your interest in our services. I've prepared a customized proposal based on our discussion.

The attached document outlines our recommended approach, timeline, and pricing structure. I believe this solution will address your specific needs effectively.

Please review at your convenience, and let me know if you'd like to schedule a call to discuss any aspects in detail.

Best regards,
[Your Name]`,
  },
];

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

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body.replace("[Name]", recipientName || ""));
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = () => {
    console.log("Sending email to:", to);
    console.log("Subject:", subject);
    console.log("Body:", body);
    onOpenChange(false);
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
              className="min-h-[300px] resize-none"
              data-testid="textarea-email-body"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-email"
          >
            Cancel
          </Button>
          <Button onClick={handleSend} data-testid="button-send-email">
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
