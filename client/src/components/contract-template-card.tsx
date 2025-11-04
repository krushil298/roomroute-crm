import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Copy, Eye, Pencil } from "lucide-react";

interface ContractTemplateCardProps {
  name: string;
  type: "lnr" | "group";
  description: string;
  lastModified: string;
  onUse?: () => void;
  onEdit?: () => void;
  onPreview?: () => void;
}

const typeColors = {
  lnr: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  group: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function ContractTemplateCard({
  name,
  type,
  description,
  lastModified,
  onUse,
  onEdit,
  onPreview,
}: ContractTemplateCardProps) {
  return (
    <Card className="p-6 hover-elevate">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1" data-testid={`text-template-${name.toLowerCase().replace(/\s+/g, '-')}`}>
            {name}
          </h3>
          <Badge className={`${typeColors[type]} text-xs mb-2`}>
            {type.toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-xs text-muted-foreground">
          Modified {lastModified}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={onUse}
          data-testid="button-use-template"
        >
          <Copy className="h-4 w-4 mr-2" />
          Use Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          data-testid="button-preview-template"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          data-testid="button-edit-template"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
