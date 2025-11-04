import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { EmailComposer } from "./email-composer";

interface ContactCardProps {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "new" | "active" | "cold";
  avatarUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusColors = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cold: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function ContactCard({
  name,
  email,
  phone,
  company,
  status,
  avatarUrl,
  onEdit,
  onDelete,
}: ContactCardProps) {
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);

  return (
    <>
      <EmailComposer
        open={emailComposerOpen}
        onOpenChange={setEmailComposerOpen}
        recipientEmail={email}
        recipientName={name}
      />
      <Card className="p-6 hover-elevate">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold" data-testid={`text-contact-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
                {name}
              </h3>
              <Badge className={`${statusColors[status]} text-xs mt-1`}>
                {status}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" data-testid="button-contact-menu">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary w-full text-left hover-elevate rounded-md p-1 -ml-1"
            onClick={() => setEmailComposerOpen(true)}
            data-testid="button-email-contact"
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate" data-testid="text-contact-email">{email}</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span data-testid="text-contact-phone">{phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate" data-testid="text-contact-company">{company}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
            data-testid="button-edit-contact"
          >
            Edit
          </Button>
          <Button variant="outline" size="sm" data-testid="button-view-contact">
            View Details
          </Button>
        </div>
      </Card>
    </>
  );
}
