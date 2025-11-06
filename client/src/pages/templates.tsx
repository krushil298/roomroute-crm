import { ContractTemplateCard } from "@/components/contract-template-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { ContractTemplate, EmailTemplate } from "@shared/schema";
import { CreateTemplateDialog } from "@/components/dialogs/create-template-dialog";
import { EditTemplateDialog } from "@/components/dialogs/edit-template-dialog";
import { PreviewTemplateDialog } from "@/components/dialogs/preview-template-dialog";
import { UseTemplateDialog } from "@/components/dialogs/use-template-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TemplateType = "contract" | "email";

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"lnr" | "group" | "email">("lnr");
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<TemplateType>("contract");
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ContractTemplate | EmailTemplate | null>(null);
  const [editTemplateType, setEditTemplateType] = useState<TemplateType>("contract");

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | EmailTemplate | null>(null);
  const [previewTemplateType, setPreviewTemplateType] = useState<TemplateType>("contract");

  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [useTemplate, setUseTemplate] = useState<ContractTemplate | EmailTemplate | null>(null);
  const [useTemplateType, setUseTemplateType] = useState<TemplateType>("contract");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTemplate, setDeleteTemplate] = useState<{ id: string; name: string; type: TemplateType } | null>(null);

  const { data: contractTemplates = [], isLoading: loadingContracts } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/contract-templates"],
  });

  const { data: emailTemplates = [], isLoading: loadingEmails } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const deleteContractMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/contract-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({
        title: "Template deleted",
        description: "Contract template has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeleteTemplate(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contract template",
        variant: "destructive",
      });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/email-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeleteTemplate(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    setCreateDialogType(activeTab === "email" ? "email" : "contract");
    setCreateDialogOpen(true);
  };

  const handleEditTemplate = (template: ContractTemplate | EmailTemplate, type: TemplateType) => {
    setEditTemplate(template);
    setEditTemplateType(type);
    setEditDialogOpen(true);
  };

  const handlePreviewTemplate = (template: ContractTemplate | EmailTemplate, type: TemplateType) => {
    setPreviewTemplate(template);
    setPreviewTemplateType(type);
    setPreviewDialogOpen(true);
  };

  const handleUseTemplate = (template: ContractTemplate | EmailTemplate, type: TemplateType) => {
    setUseTemplate(template);
    setUseTemplateType(type);
    setUseDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string, name: string, type: TemplateType) => {
    setDeleteTemplate({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTemplate) {
      if (deleteTemplate.type === "contract") {
        deleteContractMutation.mutate(deleteTemplate.id);
      } else {
        deleteEmailMutation.mutate(deleteTemplate.id);
      }
    }
  };

  const lnrTemplates = contractTemplates.filter(t => 
    t.type === "lnr" && 
    (!searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const groupTemplates = contractTemplates.filter(t => 
    t.type === "group" && 
    (!searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredEmailTemplates = emailTemplates.filter(t => 
    !searchQuery || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Manage your contract and email templates for LNR and group bookings
          </p>
        </div>
        <Button onClick={handleCreateTemplate} data-testid="button-create-template">
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "lnr" | "group" | "email")}>
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
              <p className="text-muted-foreground">
                {searchQuery ? "No templates match your search" : "No LNR templates yet"}
              </p>
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
                  onUse={() => handleUseTemplate(template, "contract")}
                  onEdit={() => handleEditTemplate(template, "contract")}
                  onPreview={() => handlePreviewTemplate(template, "contract")}
                  onDelete={() => handleDeleteTemplate(template.id, template.name, "contract")}
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
              <p className="text-muted-foreground">
                {searchQuery ? "No templates match your search" : "No group templates yet"}
              </p>
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
                  onUse={() => handleUseTemplate(template, "contract")}
                  onEdit={() => handleEditTemplate(template, "contract")}
                  onPreview={() => handlePreviewTemplate(template, "contract")}
                  onDelete={() => handleDeleteTemplate(template.id, template.name, "contract")}
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
          ) : filteredEmailTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No templates match your search" : "No email templates yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmailTemplates.map((template) => (
                <ContractTemplateCard
                  key={template.id}
                  name={template.name}
                  type="lnr"
                  description={`Subject: ${template.subject}`}
                  lastModified={formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                  onUse={() => handleUseTemplate(template, "email")}
                  onEdit={() => handleEditTemplate(template, "email")}
                  onPreview={() => handlePreviewTemplate(template, "email")}
                  onDelete={() => handleDeleteTemplate(template.id, template.name, "email")}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        type={createDialogType}
        onSuccess={() => {
          setCreateDialogOpen(false);
        }}
      />

      <EditTemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        template={editTemplate}
        type={editTemplateType}
        onSuccess={() => {
          setEditDialogOpen(false);
          setEditTemplate(null);
        }}
      />

      <PreviewTemplateDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        template={previewTemplate}
        type={previewTemplateType}
      />

      <UseTemplateDialog
        open={useDialogOpen}
        onOpenChange={setUseDialogOpen}
        template={useTemplate}
        type={useTemplateType}
        onCopy={(content) => {
          console.log("Template copied:", content);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-template">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteContractMutation.isPending || deleteEmailMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteContractMutation.isPending || deleteEmailMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
