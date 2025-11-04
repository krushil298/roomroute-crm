import { ContractTemplateCard } from "@/components/contract-template-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { ContractTemplate, EmailTemplate } from "@shared/schema";

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contractTemplates = [], isLoading: loadingContracts } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/contract-templates"],
  });

  const { data: emailTemplates = [], isLoading: loadingEmails } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const lnrTemplates = contractTemplates.filter(t => t.type === "lnr");
  const groupTemplates = contractTemplates.filter(t => t.type === "group");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Contract Templates</h1>
          <p className="text-sm text-muted-foreground">
            Manage your contract templates for LNR and group bookings
          </p>
        </div>
        <Button data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-templates"
        />
      </div>

      <Tabs defaultValue="lnr">
        <TabsList>
          <TabsTrigger value="lnr" data-testid="tab-lnr-templates">
            LNR Templates
          </TabsTrigger>
          <TabsTrigger value="group" data-testid="tab-group-templates">
            Group Templates
          </TabsTrigger>
          <TabsTrigger value="email" data-testid="tab-email-templates">
            Email Templates
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lnr" className="space-y-4 mt-6">
          {loadingContracts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : lnrTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No LNR templates yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lnrTemplates.map((template) => (
                <ContractTemplateCard
                  key={template.id}
                  name={template.name}
                  type={template.type as "lnr" | "group"}
                  description={template.description}
                  lastModified={formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                  onUse={() => console.log("Use template:", template.name)}
                  onEdit={() => console.log("Edit template:", template.name)}
                  onPreview={() => console.log("Preview template:", template.name)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="group" className="space-y-4 mt-6">
          {loadingContracts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : groupTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No group templates yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupTemplates.map((template) => (
                <ContractTemplateCard
                  key={template.id}
                  name={template.name}
                  type={template.type as "lnr" | "group"}
                  description={template.description}
                  lastModified={formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                  onUse={() => console.log("Use template:", template.name)}
                  onEdit={() => console.log("Edit template:", template.name)}
                  onPreview={() => console.log("Preview template:", template.name)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="email" className="space-y-4 mt-6">
          {loadingEmails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : emailTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No email templates yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emailTemplates.map((template) => (
                <ContractTemplateCard
                  key={template.id}
                  name={template.name}
                  type="lnr"
                  description={`Subject: ${template.subject}`}
                  lastModified={formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                  onUse={() => console.log("Use email template:", template.name)}
                  onEdit={() => console.log("Edit email template:", template.name)}
                  onPreview={() => console.log("Preview email template:", template.name)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
