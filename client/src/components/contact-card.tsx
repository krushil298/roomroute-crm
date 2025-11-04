import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, User, Briefcase, Hotel, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { EmailComposer } from "./email-composer";

interface ContactCardProps {
  id: string;
  leadOrProject: string;
  company: string | null;
  segment: string;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  estRoomNights: number | null;
  potentialValue?: string | null;
  avatarUrl?: string;
  onEdit?: () => void;
  onViewDetails?: () => void;
  onDelete?: () => void;
}

const segmentColors: Record<string, string> = {
  Corporate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SMERF: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Group: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Construction: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Government: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function ContactCard({
  id,
  leadOrProject,
  company,
  segment,
  primaryContact,
  email,
  phone,
  estRoomNights,
  potentialValue,
  avatarUrl,
  onEdit,
  onViewDetails,
  onDelete,
}: ContactCardProps) {
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  
  const initials = primaryContact 
    ? primaryContact.split(" ").map((n) => n[0]).join("").toUpperCase()
    : leadOrProject.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {email && (
        <EmailComposer
          open={emailComposerOpen}
          onOpenChange={setEmailComposerOpen}
          recipientEmail={email}
          recipientName={primaryContact || leadOrProject}
        />
      )}
      <Card className="p-6 hover-elevate">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={avatarUrl} alt={leadOrProject} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-semibold truncate" data-testid={`text-lead-name-${leadOrProject.toLowerCase().replace(/\s+/g, '-')}`}>
                {leadOrProject}
              </h3>
              <Badge className={`${segmentColors[segment] || segmentColors.Other} text-xs mt-1 inline-block`}>
                {segment}
              </Badge>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {company && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate" data-testid="text-contact-company">{company}</span>
            </div>
          )}
          {primaryContact && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate" data-testid="text-primary-contact">{primaryContact}</span>
            </div>
          )}
          {email && (
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary w-full text-left hover-elevate rounded-md p-1 -ml-1"
              onClick={() => setEmailComposerOpen(true)}
              data-testid="button-email-contact"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate" data-testid="text-contact-email">{email}</span>
            </button>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span data-testid="text-contact-phone">{phone}</span>
            </div>
          )}
          {estRoomNights !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hotel className="h-4 w-4 shrink-0" />
              <span data-testid="text-est-room-nights">{estRoomNights} room nights</span>
            </div>
          )}
          {potentialValue && parseFloat(potentialValue) > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span data-testid="text-potential-value">${parseFloat(potentialValue).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
            data-testid={`button-edit-contact-${id}`}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onViewDetails}
            data-testid={`button-view-contact-${id}`}
          >
            View Details
          </Button>
        </div>
      </Card>
    </>
  );
}
