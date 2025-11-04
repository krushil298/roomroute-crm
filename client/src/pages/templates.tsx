import { ContractTemplateCard } from "@/components/contract-template-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");

  const lnrTemplates = [
    {
      name: "Standard LNR Agreement",
      type: "lnr" as const,
      description: "Standard lease agreement template for long-term rentals with customizable terms and conditions.",
      lastModified: "2 days ago",
    },
    {
      name: "Short-term LNR Contract",
      type: "lnr" as const,
      description: "Flexible short-term rental agreement with weekly or monthly payment options.",
      lastModified: "1 week ago",
    },
    {
      name: "Premium LNR Package",
      type: "lnr" as const,
      description: "Comprehensive rental agreement with premium amenities and services included.",
      lastModified: "3 days ago",
    },
  ];

  const groupTemplates = [
    {
      name: "Group Booking Agreement",
      type: "group" as const,
      description: "Standard contract for group reservations with multiple rooms and extended stays.",
      lastModified: "1 week ago",
    },
    {
      name: "Corporate Group Contract",
      type: "group" as const,
      description: "Tailored agreement for corporate groups with special rates and additional services.",
      lastModified: "4 days ago",
    },
    {
      name: "Event Group Package",
      type: "group" as const,
      description: "Specialized contract for event-based group bookings with flexible terms.",
      lastModified: "5 days ago",
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lnrTemplates.map((template) => (
              <ContractTemplateCard
                key={template.name}
                {...template}
                onUse={() => console.log("Use template:", template.name)}
                onEdit={() => console.log("Edit template:", template.name)}
                onPreview={() => console.log("Preview template:", template.name)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="group" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupTemplates.map((template) => (
              <ContractTemplateCard
                key={template.name}
                {...template}
                onUse={() => console.log("Use template:", template.name)}
                onEdit={() => console.log("Edit template:", template.name)}
                onPreview={() => console.log("Preview template:", template.name)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="email" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ContractTemplateCard
              name="Introduction Email"
              type="lnr"
              description="Standard introduction email template for new leads and prospects."
              lastModified="1 day ago"
              onUse={() => console.log("Use email template")}
              onEdit={() => console.log("Edit email template")}
              onPreview={() => console.log("Preview email template")}
            />
            <ContractTemplateCard
              name="Follow-up Email"
              type="lnr"
              description="Professional follow-up template for ongoing conversations."
              lastModified="3 days ago"
              onUse={() => console.log("Use email template")}
              onEdit={() => console.log("Edit email template")}
              onPreview={() => console.log("Preview email template")}
            />
            <ContractTemplateCard
              name="Proposal Email"
              type="group"
              description="Formal proposal submission email with attachment guidelines."
              lastModified="1 week ago"
              onUse={() => console.log("Use email template")}
              onEdit={() => console.log("Edit email template")}
              onPreview={() => console.log("Preview email template")}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
